<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Icon } from '@iconify/vue'
import LoadingSpinner from './LoadingSpinner.vue'
import { supabase } from '../lib/supabase'
import { formatDateTime, formatDate, formatTime } from '../utils/date'
import { MESSAGE_TYPES } from '../constants/enums'
import { parseRpText, toRenderableRpTokens } from '../utils/rpText'

const props = defineProps({
  roomId: { type: String, required: true },
  isOwner: { type: Boolean, default: false },
})

const messages = ref([])
const loading = ref(true)
const error = ref('')

const channelId = computed(() => `room:${props.roomId}`)

const viewMode = ref('dialogue') // 'dialogue' | 'novel'
const novels = ref({})
const generatingNovels = ref({})
// KP 手动选择要生成小说的消息 id 集合
const selectedForNovelIds = ref(new Set())

async function fetchNovels() {
  const { data } = await supabase
    .from('room_log_novels')
    .select('date, content')
    .eq('room_id', props.roomId)
  if (data) {
    const map = {}
    for (const d of data) {
      map[d.date] = d.content
    }
    novels.value = map
  }
}

watch(viewMode, (val) => {
  if (val === 'novel') {
    fetchNovels()
  }
})

function toggleNovelSelection(msg) {
  const next = new Set(selectedForNovelIds.value)
  if (next.has(msg.id)) next.delete(msg.id)
  else next.add(msg.id)
  selectedForNovelIds.value = next
}

function isSelectedForNovel(msg) {
  return selectedForNovelIds.value.has(msg.id)
}

async function generateNovel(group) {
  // 只使用当前日期组中被 KP 选中的对话
  const selectedMessages = group.messages.filter(
    (m) => !isSystemNotification(m) && isSelectedForNovel(m)
  )
  if (!selectedMessages.length) {
    alert('请先在对话模式中点击“选入小说”，选择要生成小说的对话。')
    return
  }

  generatingNovels.value[group.date] = true
  try {
    const { data: configData, error: configErr } = await supabase
      .from('system_settings')
      .select('value')
      .eq('id', 'ai_config')
      .single()
    
    if (configErr || !configData?.value?.apiKey) {
      throw new Error('未配置 AI API Key，请联系管理员')
    }
    const config = configData.value

    const textToProcess = selectedMessages.map(m => {
      const speaker = getSpeakerName(m)
      return `[${speaker}] ${m.content}`
    }).join('\n')

    const prompt = `你是一个小说家，请将以下跑团（TRPG）的文字日志转换为生动流畅的小说格式。
要求：
1. 保持原有的剧情和对话，可以适当增加环境渲染和心理描写。
2. 忽略系统无关紧要的检定信息，除非它们对剧情有重大影响。
3. 不要输出多余的解释，直接输出小说内容。

跑团日志：
${textToProcess}`
    const res = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }]
      })
    })
    
    if (!res.ok) {
      const txt = await res.text()
      throw new Error(`AI 接口请求失败 (${res.status}): ${txt}`)
    }
    const json = await res.json()
    const content = json.choices?.[0]?.message?.content
    if (!content) throw new Error('AI 返回数据格式错误')

    const { error: upsertErr } = await supabase.from('room_log_novels').upsert({
      room_id: props.roomId,
      date: group.date,
      content: content
    }, { onConflict: 'room_id,date' })
    
    if (upsertErr) throw upsertErr

    novels.value[group.date] = content
  } catch (e) {
    alert('生成失败：' + e.message)
  } finally {
    generatingNovels.value[group.date] = false
  }
}

async function fetchLogs() {
  loading.value = true
  error.value = ''
  try {
    const { data, error: err } = await supabase
      .from('messages')
      .select('id, user_id, user_name, content, type, speaker_role, speaker_npc_id, speaker_npc_name, created_at')
      .eq('channel_id', channelId.value)
      .order('created_at', { ascending: true })
    if (err) throw err
    messages.value = (data || []).map((m) => ({
      id: m.id,
      userId: m.user_id || 'system',
      userName: m.user_name || '未知',
      content: m.content,
      time: m.created_at ? new Date(m.created_at).getTime() : Date.now(),
      type: m.type || 'text',
      speakerRole: m.speaker_role,
      speakerNpcId: m.speaker_npc_id,
      speakerNpcName: m.speaker_npc_name,
    }))
  } catch (e) {
    error.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

const groupedMessages = computed(() => {
  const groups = []
  let currentDate = null
  let currentGroup = null

  for (const msg of messages.value) {
    const msgDate = formatDate(msg.time)
    if (msgDate !== currentDate) {
      if (currentGroup) groups.push(currentGroup)
      currentDate = msgDate
      currentGroup = { date: currentDate, messages: [] }
    }
    currentGroup.messages.push(msg)
  }
  if (currentGroup) groups.push(currentGroup)

  return groups
})

// 系统通知类消息（掷骰、暗骰、技能检定、理智检定、请求检定等）——不作为说话人展示
function isSystemNotification(msg) {
  return [MESSAGE_TYPES.SYSTEM, MESSAGE_TYPES.HIDDEN_ROLL, MESSAGE_TYPES.HIDDEN_SKILL, MESSAGE_TYPES.CHECK_REQUEST].includes(msg.type)
}

function getMessageContent(msg) {
  if ((msg.type === MESSAGE_TYPES.HIDDEN_ROLL || msg.type === MESSAGE_TYPES.HIDDEN_SKILL) && !props.isOwner) {
    return '？？'
  }
  if (msg.type === MESSAGE_TYPES.CHECK_REQUEST) {
    try {
      const data = JSON.parse(msg.content || '{}')
      const who = data.targetCharacterName || '某位玩家'
      if (data.kind === 'skill') {
        const mod = data.modifier ? (data.modifier > 0 ? `+${data.modifier}` : `${data.modifier}`) : ''
        const extra = mod ? `（${mod}）` : ''
        return `【技能检定】${who} 进行「${data.skillName || '未知技能'}」检定${extra}`
      }
      if (data.kind === 'sanity') {
        const succ = data.sanSuccessExpr || '0'
        const fail = data.sanFailExpr || '1'
        return `【理智检定】${who} 进行理智检定（成功失去 ${succ}，失败失去 ${fail}）`
      }
      if (data.kind === 'madness') {
        return `【疯狂症状】${who} 抽取疯狂症状`
      }
    } catch (e) {
      // ignore
    }
  }
  return msg.content
}

function getRenderableParts(msg) {
  const raw = getMessageContent(msg)
  const base = parseRpText(raw)
  const isSpeakerDialogue = msg?.speakerRole !== 'kp'
  return toRenderableRpTokens(base, { defaultDialogue: isSpeakerDialogue })
}

function getSpeakerName(msg) {
  if (msg.speakerRole === 'kp') return 'KP'
  if (msg.speakerRole === 'npc' && msg.speakerNpcName) return msg.speakerNpcName
  return msg.userName || '未知'
}

function getSpeakerBadge(msg) {
  if (msg.speakerRole === 'kp') return { text: 'KP', class: 'bg-blue-500/20 text-blue-400' }
  if (msg.speakerRole === 'npc') return { text: 'NPC', class: 'bg-purple-500/20 text-purple-400' }
  return { text: 'PL', class: 'bg-green-500/20 text-green-400' }
}

onMounted(() => {
  fetchLogs()
})

watch(() => props.roomId, () => {
  fetchLogs()
})
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- 顶部控制栏 -->
    <div class="shrink-0 px-4 py-2 flex justify-between items-center">
      <span class="text-sm font-medium text-base-content/70">日志记录</span>
      <div class="join bg-base-200 p-1 rounded-xl">
        <button
          type="button"
          class="join-item btn btn-sm border-none"
          :class="viewMode === 'dialogue' ? 'btn-primary' : 'btn-ghost text-base-content/60'"
          @click="viewMode = 'dialogue'"
        >
          <Icon icon="mdi:format-list-bulleted" class="text-lg mr-1" />对话模式
        </button>
        <button
          type="button"
          class="join-item btn btn-sm border-none"
          :class="viewMode === 'novel' ? 'btn-primary' : 'btn-ghost text-base-content/60'"
          @click="viewMode = 'novel'"
        >
          <Icon icon="mdi:book-open-page-variant-outline" class="text-lg mr-1" />小说模式
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto scroll-thin p-4">
      <LoadingSpinner v-if="loading" message="加载日志中…" />
      <div v-else-if="error" class="text-center py-12 text-red-400">
        {{ error }}
      </div>
      <div v-else-if="!messages.length" class="text-center py-12 text-base-content">
        <Icon icon="mdi:note-text-outline" class="text-4xl mb-2 opacity-50" />
        <p>暂无日志记录</p>
      </div>
      <div v-else class="max-w-4xl mx-auto space-y-6">
        <div
          v-for="group in groupedMessages"
          :key="group.date"
          class="space-y-3"
        >
          <!-- 日期分隔 -->
          <div class="flex items-center gap-3 py-2">
            <div class="flex-1 h-px bg-base-300"></div>
            <span class="text-xs font-medium text-base-content px-3">{{ group.date }}</span>
            <div class="flex-1 h-px bg-base-300"></div>
          </div>

          <!-- 小说模式 -->
          <div v-if="viewMode === 'novel'" class="bg-base-200/50 rounded-3xl p-6 md:p-8">
            <div v-if="novels[group.date]" class="text-base-content leading-relaxed whitespace-pre-wrap text-[15px]">
              {{ novels[group.date] }}
            </div>
            <div v-else class="flex flex-col items-center justify-center py-8 text-base-content/60">
              <Icon icon="mdi:robot-outline" class="text-4xl mb-3 opacity-50" />
              <p class="text-sm mb-4">该日期的日志尚未生成小说</p>
              <button
                type="button"
                class="btn btn-primary btn-sm rounded-xl active:scale-95 transition-transform"
                :disabled="generatingNovels[group.date]"
                @click="generateNovel(group)"
              >
                <Icon v-if="generatingNovels[group.date]" icon="mdi:loading" class="animate-spin text-lg" />
                <Icon v-else icon="mdi:magic-staff" class="text-lg" />
                {{ generatingNovels[group.date] ? 'AI 创作中...' : '生成小说' }}
              </button>
            </div>
          </div>

          <!-- 对话模式 -->
          <div v-else class="space-y-3">
            <template v-for="msg in group.messages" :key="msg.id">
              <!-- 系统通知：掷骰、暗骰、技能检定、理智检定等，不作为说话人 -->
              <div
                v-if="isSystemNotification(msg)"
                class="flex justify-center py-0.5"
              >
                <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-base-200/50 border border-accent-muted/30 text-xs text-base-content">
                  <Icon icon="mdi:information-outline" class="text-sm shrink-0" />
                  <span>{{ getMessageContent(msg) }}</span>
                  <span class="text-[10px] opacity-60 shrink-0">{{ formatTime(msg.time) }}</span>
                </div>
              </div>

              <!-- 角色说话（PL）：对话气泡 -->
              <div
                v-else-if="msg.speakerRole !== 'kp'"
                class="flex gap-3 group"
              >
                <div class="flex flex-col items-center shrink-0 pt-1">
                  <div class="w-2 h-2 rounded-full bg-green-500/50 group-hover:bg-green-500 transition-colors"></div>
                  <div class="w-px flex-1 bg-base-300 mt-1"></div>
                </div>
                <div class="flex-1 min-w-0 pb-2">
                  <div class="flex items-baseline gap-2 mb-1">
                    <span class="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">PL</span>
                    <span class="font-medium text-base-content">{{ getSpeakerName(msg) }}</span>
                    <span class="text-xs text-base-content">{{ formatTime(msg.time) }}</span>
                    <button
                      v-if="isOwner && viewMode === 'dialogue'"
                      type="button"
                      class="ml-1 text-[10px] px-1.5 py-0.5 rounded border border-primary/40 text-primary/80 hover:bg-primary/10 transition-colors"
                      @click="toggleNovelSelection(msg)"
                    >
                      {{ isSelectedForNovel(msg) ? '已选入小说' : '选入小说' }}
                    </button>
                  </div>
                  <div class="pl-1 text-sm wrap-break-word whitespace-pre-wrap text-base-content">
                    <template v-for="(p, idx) in getRenderableParts(msg)" :key="idx">
                      <span v-if="p.type === 'ooc'" class="inline-block px-1.5 py-0.5 mx-0.5 rounded-md bg-base-content/10 text-base-content/75 text-[0.9em] italic">（{{ p.text }}）</span>
                      <span v-else-if="p.type === 'dialogue'" class="inline-block pl-2 ml-1 border-l-2 border-primary/40 not-italic">「{{ p.text }}」</span>
                      <span v-else class="not-italic">{{ p.text }}</span>
                    </template>
                  </div>
                </div>
              </div>

              <!-- KP：环境描写 / 事件描述，叙事风格 -->
              <div
                v-else
                class="flex gap-3 group"
              >
                <div class="flex flex-col items-center shrink-0 pt-1">
                  <div class="w-2 h-2 rounded-full bg-blue-500/50 group-hover:bg-blue-500 transition-colors"></div>
                  <div class="w-px flex-1 bg-base-300 mt-1"></div>
                </div>
                <div class="flex-1 min-w-0 pb-2">
                  <div class="flex items-baseline gap-2 mb-1">
                    <span class="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-400">KP</span>
                    <span class="text-xs text-base-content italic">{{ formatTime(msg.time) }}</span>
                    <button
                      v-if="isOwner && viewMode === 'dialogue'"
                      type="button"
                      class="ml-1 text-[10px] px-1.5 py-0.5 rounded border border-primary/40 text-primary/80 hover:bg-primary/10 transition-colors"
                      @click="toggleNovelSelection(msg)"
                    >
                      {{ isSelectedForNovel(msg) ? '已选入小说' : '选入小说' }}
                    </button>
                  </div>
                  <div class="pl-3 text-sm wrap-break-word whitespace-pre-wrap text-[#a6adc8] italic border-l-2 border-blue-500/30">
                    <template v-for="(p, idx) in getRenderableParts(msg)" :key="idx">
                      <span v-if="p.type === 'ooc'" class="inline-block px-1.5 py-0.5 mx-0.5 rounded-md bg-base-content/10 text-base-content/70 text-[0.9em] italic">（{{ p.text }}）</span>
                      <span v-else-if="p.type === 'dialogue'" class="inline-block pl-2 ml-1 border-l-2 border-primary/40 not-italic text-base-content">「{{ p.text }}」</span>
                      <span v-else>{{ p.text }}</span>
                    </template>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
