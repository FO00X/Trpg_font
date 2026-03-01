<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Icon } from '@iconify/vue'
import LoadingSpinner from './LoadingSpinner.vue'
import { supabase } from '../lib/supabase'

const props = defineProps({
  roomId: { type: String, required: true },
  isOwner: { type: Boolean, default: false },
})

const messages = ref([])
const loading = ref(true)
const error = ref('')

const channelId = computed(() => `room:${props.roomId}`)

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

function formatDateTime(timestamp) {
  const d = new Date(timestamp)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatDate(timestamp) {
  const d = new Date(timestamp)
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function formatTime(timestamp) {
  const d = new Date(timestamp)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
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
  return ['system', 'hidden_roll', 'hidden_skill', 'check_request'].includes(msg.type)
}

function getMessageContent(msg) {
  if ((msg.type === 'hidden_roll' || msg.type === 'hidden_skill') && !props.isOwner) {
    return '？？'
  }
  if (msg.type === 'check_request') {
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

          <!-- 该日期的消息列表（小说式：角色说话 / KP 环境描写 / 系统通知） -->
          <div class="space-y-3">
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
                  </div>
                  <div class="pl-1 text-sm break-words whitespace-pre-wrap text-base-content">
                    <span class="text-base-content">「</span>{{ msg.content }}<span class="text-base-content">」</span>
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
                  </div>
                  <div class="pl-3 text-sm break-words whitespace-pre-wrap text-[#a6adc8] italic border-l-2 border-blue-500/30">
                    {{ msg.content }}
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
