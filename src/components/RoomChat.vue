<template>
  <div class="flex flex-col h-full">
    <!-- 消息列表 -->
    <div ref="listEl" class="flex-1 overflow-y-auto scroll-thin px-4 py-3 space-y-2">
      <template v-for="m in messages" :key="m.id">
        <!-- 骰娘 / 系统 / 暗骰 / 请求检定 消息：居中提示样式 -->
        <div
          v-if="m.type === 'system' || m.type === 'hidden_roll' || m.type === 'hidden_skill' || m.type === 'check_request'"
          class="flex justify-center my-1 text-[11px] text-accent-muted"
        >
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-chat-panel/60 border border-dashed border-accent-muted/40">
            <Icon icon="mdi:dice-multiple" class="text-sm" />
            <span>{{ getMessageContent(m) }}</span>
          </div>
        </div>

        <!-- 普通聊天消息 -->
        <div
          v-else
          :class="[
            'flex gap-2 text-sm',
            m.isSelf ? 'flex-row-reverse' : 'flex-row',
          ]"
        >
          <div
            class="w-8 h-8 rounded-full bg-sidebar-active flex items-center justify-center shrink-0 text-accent text-xs font-medium"
          >
            {{ m.userName.slice(0, 1).toUpperCase() }}
          </div>
          <div :class="['max-w-[75%] flex flex-col', m.isSelf ? 'items-end' : 'items-start']">
            <div class="flex items-baseline gap-2 mb-0.5">
              <span
                class="px-2 py-0.5 rounded text-[11px] font-medium"
                :class="getSpeakerBadge(m).class"
              >
                {{ getSpeakerBadge(m).text }}
              </span>
              <span class="text-xs font-medium text-white">{{ getSpeakerName(m) }}</span>
              <span class="text-[11px] text-accent-muted">{{ formatTime(m.time) }}</span>
            </div>
            <div
              :class="[
                'px-3 py-2 rounded-2xl text-sm break-words whitespace-pre-wrap',
                m.isSelf
                  ? 'bg-accent text-chat-bg rounded-br-md'
                  : 'bg-chat-panel border border-chat-border rounded-bl-md',
              ]"
            >
              {{ getMessageContent(m) }}
            </div>
          </div>
        </div>
      </template>
      <div v-if="!messages.length && !loading" class="text-center text-xs text-accent-muted py-6">
        暂无消息，开始在房间里说点什么吧～
      </div>
      <LoadingSpinner v-if="loading" :block="false" size="sm" message="加载中…" className="justify-center py-4" />
    </div>

    <!-- 输入区 + 功能按钮 / 面板 -->
    <div class="border-t border-chat-border px-3 py-2 flex flex-col gap-1">
      <div class="flex items-center gap-2 text-[11px] text-accent-muted">
        <div class="relative">
          <button
            type="button"
            class="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/5"
            @click="activeTool = activeTool === 'dice' ? null : 'dice'"
          >
            <Icon icon="mdi:dice-multiple" class="text-base" />
            <span>掷骰</span>
          </button>
        </div>
        <button
          v-if="isOwner"
          type="button"
          class="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/5"
          @click="activeTool = activeTool === 'request' ? null : 'request'"
        >
          <Icon icon="mdi:account-question-outline" class="text-base" />
          <span>请求检定</span>
        </button>
        <button
          type="button"
          class="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/5"
          @click="activeTool = activeTool === 'stat' ? null : 'stat'"
        >
          <Icon icon="mdi:pencil-plus-outline" class="text-base" />
          <span>更新属性</span>
        </button>
        <button
          type="button"
          class="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/5"
          @click="skillCheck"
        >
          <Icon icon="mdi:account-search-outline" class="text-base" />
          <span>技能检定</span>
        </button>
      </div>

      <!-- 房主专用：请求检定面板 -->
      <!-- 掷骰面板 -->
      <div
        v-if="activeTool === 'dice'"
        class="mt-1 px-3 py-2 rounded-lg bg-chat-panel border border-chat-border text-[11px] text-accent-muted space-y-2"
      >
        <div class="flex flex-wrap items-center gap-2">
          <span class="shrink-0">骰子：</span>
          <div class="flex flex-wrap gap-1">
            <button
              v-for="d in diceOptions"
              :key="d"
              type="button"
              class="px-2 py-0.5 rounded-md border border-chat-border text-[11px]"
              :class="selectedDice === d ? 'bg-accent/20 text-accent border-accent/60' : 'text-accent-muted hover:text-white hover:bg-white/5'"
              @click="selectedDice = d"
            >
              {{ d }}
            </button>
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-1">
          <button
            type="button"
            class="px-3 py-1 rounded-lg border border-chat-border text-[11px] text-accent-muted hover:text-white hover:bg-white/5"
            @click="activeTool = null"
          >
            取消
          </button>
          <button
            type="button"
            class="px-3 py-1 rounded-lg bg-accent text-chat-bg text-[11px] hover:opacity-90"
            @click="rollDice(selectedDice)"
          >
            掷骰
          </button>
        </div>
      </div>

      <!-- 房主专用：请求检定面板 -->
      <div
        v-if="isOwner && activeTool === 'request'"
        class="mt-1 px-3 py-2 rounded-lg bg-chat-panel border border-chat-border text-[11px] text-accent-muted space-y-2"
      >
        <div class="flex flex-wrap items-center gap-2">
          <span class="shrink-0">目标玩家：</span>
          <select
            v-model="requestTargetUserId"
            class="min-w-[140px] max-w-[220px] px-2 py-1 rounded bg-chat-bg border border-chat-border text-xs text-white outline-none"
          >
            <option value="">请选择角色</option>
            <option
              v-for="m in roomMembers"
              :key="m.userId + '-' + m.characterId"
              :value="m.userId"
            >
              {{ m.characterName || '未命名角色' }}
            </option>
          </select>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span class="shrink-0">类型：</span>
          <div class="inline-flex rounded-lg bg-chat-bg border border-chat-border overflow-hidden">
            <button
              type="button"
              class="px-2 py-1 text-xs"
              :class="requestKind === 'skill' ? 'bg-accent/20 text-accent' : 'text-accent-muted hover:text-white hover:bg-white/5'"
              @click="requestKind = 'skill'"
            >
              技能
            </button>
            <button
              type="button"
              class="px-2 py-1 text-xs border-l border-chat-border"
              :class="requestKind === 'sanity' ? 'bg-accent/20 text-accent' : 'text-accent-muted hover:text-white hover:bg-white/5'"
              @click="requestKind = 'sanity'"
            >
              理智
            </button>
            <button
              type="button"
              class="px-2 py-1 text-xs border-l border-chat-border"
              :class="requestKind === 'madness' ? 'bg-accent/20 text-accent' : 'text-accent-muted hover:text-white hover:bg-white/5'"
              @click="requestKind = 'madness'"
            >
              疯狂症状
            </button>
          </div>
        </div>

        <div
          v-if="requestKind === 'skill'"
          class="flex flex-wrap items-center gap-2"
        >
          <span class="shrink-0">技能：</span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="px-2 py-1 rounded-lg border border-chat-border text-[11px] text-accent-muted hover:text-white hover:bg-white/5"
              @click="openSkillPickerForRequest"
            >
              选择技能
            </button>
          </div>
          <span class="shrink-0">修正：</span>
          <input
            v-model.number="requestSkillModifier"
            type="number"
            class="w-16 px-2 py-1 rounded bg-chat-bg border border-chat-border text-xs text-white outline-none"
          />
        </div>

        <div
          v-if="requestKind === 'sanity'"
          class="flex flex-wrap items-center gap-2"
        >
          <span class="shrink-0">理智损失：</span>
          <span class="shrink-0">成功：</span>
          <input
            v-model="requestSanSuccessExpr"
            type="text"
            placeholder="0"
            class="w-20 px-2 py-1 rounded bg-chat-bg border border-chat-border text-xs text-white outline-none"
          />
          <span class="shrink-0">失败：</span>
          <input
            v-model="requestSanFailExpr"
            type="text"
            placeholder="1"
            class="w-20 px-2 py-1 rounded bg-chat-bg border border-chat-border text-xs text-white outline-none"
          />
        </div>

        <div class="flex justify-end gap-2 pt-1">
          <button
            type="button"
            class="px-3 py-1 rounded-lg border border-chat-border text-[11px] text-accent-muted hover:text-white hover:bg-white/5"
            @click="activeTool = null"
          >
            取消
          </button>
          <button
            type="button"
            class="px-3 py-1 rounded-lg bg-accent text-chat-bg text-[11px] hover:opacity-90"
            @click="sendCheckRequest"
          >
            发送请求
          </button>
        </div>
      </div>

      <!-- 更新属性面板 -->
      <div
        v-if="activeTool === 'stat'"
        class="mt-1 px-3 py-2 rounded-lg bg-chat-panel border border-chat-border text-[11px] text-accent-muted space-y-2"
      >
        <div class="flex flex-wrap items-center gap-2">
          <span class="shrink-0">属性：</span>
          <select
            v-model="statAttr"
            class="px-2 py-1 rounded bg-chat-bg border border-chat-border text-xs text-white outline-none"
          >
            <option value="hp">HP</option>
            <option value="mp">MP</option>
            <option value="san">SAN</option>
          </select>
          <span class="shrink-0">变动：</span>
          <select
            v-model="statOp"
            class="px-2 py-1 rounded bg-chat-bg border border-chat-border text-xs text-white outline-none"
          >
            <option value="-">-</option>
            <option value="+">+</option>
          </select>
          <input
            v-model="statExpr"
            type="text"
            placeholder="例如 1 或 1d6"
            class="w-24 px-2 py-1 rounded bg-chat-bg border border-chat-border text-xs text-white outline-none"
          />
        </div>
        <div class="flex justify-end gap-2 pt-1">
          <button
            type="button"
            class="px-3 py-1 rounded-lg border border-chat-border text-[11px] text-accent-muted hover:text-white hover:bg-white/5"
            @click="activeTool = null"
          >
            取消
          </button>
          <button
            type="button"
            class="px-3 py-1 rounded-lg bg-accent text-chat-bg text-[11px] hover:opacity-90"
            @click="applyStatChangeFromPanel"
          >
            执行
          </button>
        </div>
      </div>
      <div class="flex items-end gap-2">
        <textarea
          v-model="input"
          rows="1"
          placeholder="请输入内容..."
          class="flex-1 min-h-[40px] max-h-32 px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-sm text-[#cdd6f4] placeholder:text-accent-muted resize-none outline-none"
          @keydown="onKeydown"
        />
        <button
          type="button"
          class="px-3 py-2 rounded-xl bg-accent text-chat-bg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="sending || !input.trim()"
          @click="send"
        >
          <Icon icon="mdi:send" class="text-lg" />
        </button>
      </div>
    </div>

    <!-- 技能选择弹窗 -->
    <div
      v-if="skillPickerOpen"
      class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60"
    >
      <div
        class="w-full max-w-md rounded-xl bg-sidebar border border-chat-border shadow-xl max-h-[80vh] flex flex-col"
      >
        <div class="px-4 py-3 border-b border-chat-border flex items-center justify-between">
          <h2 class="text-sm font-medium text-accent-muted">
            {{ skillPickerMode === 'self' ? '选择技能进行检定' : '选择要请求的技能' }}
          </h2>
          <button
            type="button"
            class="p-1.5 rounded-lg text-accent-muted hover:text-white hover:bg-white/5"
            @click="skillPickerOpen = false"
          >
            <Icon icon="mdi:close" class="text-base" />
          </button>
        </div>
        <div class="flex-1 min-h-0 overflow-y-auto scroll-thin p-3 space-y-1">
          <div
            v-for="item in skillPickerSkills"
            :key="item.displayName"
            class="flex items-center justify-between px-3 py-1.5 rounded-lg bg-chat-bg border border-chat-border hover:border-accent/60 hover:bg-accent/10 cursor-pointer text-xs text-[#a6adc8]"
            @click="onSelectSkillFromPicker(item)"
          >
            <span class="truncate">{{ item.displayName }}</span>
          </div>
        </div>
        <div class="px-4 py-2 border-t border-chat-border flex justify-end">
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg border border-chat-border text-xs text-accent-muted hover:text-white hover:bg-white/5"
            @click="skillPickerOpen = false"
          >
            关闭
          </button>
        </div>
      </div>
    </div>

    <!-- 被请求方本地骰子动画弹窗 -->
    <DiceRollModal
      :open="checkModalOpen"
      :batch="checkModalBatch"
      :max-rolls="1"
      @close="checkModalOpen = false"
      @confirm="handleCheckConfirm"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import LoadingSpinner from './LoadingSpinner.vue'
import DiceRollModal from './DiceRollModal.vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import { useGameRoomsStore } from '../stores/gameRooms'
import { useCharactersStore } from '../stores/characters'

const props = defineProps({
  roomId: {
    type: [String, Number],
    required: true,
  },
})

const auth = useAuthStore()
const gameRoomsStore = useGameRoomsStore()
const charactersStore = useCharactersStore()
const listEl = ref(null)
const messages = ref([])
const activeTool = ref(null) // 'dice' | 'request' | 'stat' | null
const loading = ref(true)
const sending = ref(false)
const input = ref('')
let realtimeChannel = null

// 是否为房主（用于显示掷骰/检定中的 KP 名称）
const isOwner = ref(false)

// 房间玩家列表（通过 room_characters 表的已通过记录）
const roomMembers = ref([])

// 房主侧：请求检定面板状态
const requestKind = ref('skill') // 'skill' | 'sanity' | 'madness'
const requestTargetUserId = ref('')
const requestSkillName = ref('')
const requestSkillModifier = ref(0)
const requestSanSuccessExpr = ref('')
const requestSanFailExpr = ref('')

// 更新属性面板状态
const statAttr = ref('hp') // 'hp' | 'mp' | 'san'
const statOp = ref('-') // '+' | '-'
const statExpr = ref('1')

// 掷骰面板选择
const selectedDice = ref('1d100')

// 技能选择弹窗（自检 / 请求检定 共用）
const skillPickerOpen = ref(false)
const skillPickerMode = ref('self') // 'self' | 'request'
const skillPickerSkills = ref([]) // { raw, displayName }[]
const skillPickerLoading = ref(false)

// 被请求方：本地检定弹窗
const checkModalOpen = ref(false)
const checkModalBatch = ref([])
const checkRequest = ref(null)

const channelId = computed(() => `room:${props.roomId}`)

function normalizeRow(row) {
  const userId = row.user_id || 'system'
  const userName = row.user_name || (userId === 'system' ? '系统' : '未知')
  const me = auth.user?.value
  return {
    id: row.id,
    userId,
    userName,
    content: row.content,
    time: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    type: row.type || 'text',
    speakerRole: row.speaker_role || null,
    speakerNpcId: row.speaker_npc_id || null,
    speakerNpcName: row.speaker_npc_name || null,
    isSelf: me && me.id === userId,
  }
}

function getMessageContent(msg) {
  if ((msg.type === 'hidden_roll' || msg.type === 'hidden_skill') && !isOwner.value) {
    return '？？'
  }
  if (msg.type === 'check_request') {
    try {
      const data = JSON.parse(msg.content || '{}')
      const from = data.requesterName || 'KP'
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
        return `【疯狂症状】 ${who} 抽取疯狂症状`
      }
    } catch (e) {
      // ignore
    }
  }
  return msg.content
}

function getSpeakerName(msg) {
  if (msg.type === 'system' || msg.type === 'hidden_roll' || msg.type === 'hidden_skill' || msg.type === 'check_request')
    return '骰娘'
  if (msg.speakerRole === 'kp') return 'KP'
  if (msg.speakerRole === 'npc' && msg.speakerNpcName) return msg.speakerNpcName
  return msg.userName || '未知'
}

function getSpeakerBadge(msg) {
  if (msg.type === 'system' || msg.type === 'hidden_roll' || msg.type === 'hidden_skill' || msg.type === 'check_request')
    return { text: '骰娘', class: 'bg-accent-muted/20 text-accent-muted' }
  if (msg.speakerRole === 'kp') return { text: 'KP', class: 'bg-blue-500/20 text-blue-400' }
  if (msg.speakerRole === 'npc') return { text: 'NPC', class: 'bg-purple-500/20 text-purple-400' }
  return { text: 'PL', class: 'bg-green-500/20 text-green-400' }
}

function scrollToBottom() {
  nextTick(() => {
    if (!listEl.value) return
    listEl.value.scrollTop = listEl.value.scrollHeight
  })
}

function formatTime(ts) {
  const d = new Date(ts)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

async function loadMessages() {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('id, user_id, user_name, content, type, speaker_role, speaker_npc_id, speaker_npc_name, created_at')
      .eq('channel_id', channelId.value)
      .order('created_at', { ascending: true })
      .limit(200)
    if (error) return
    messages.value = (data || []).map(normalizeRow)
    scrollToBottom()
  } finally {
    loading.value = false
  }
}
async function openSkillPickerForRequest() {
  // 先校验是否选择了目标玩家
  if (!requestTargetUserId.value) {
    alert('请先选择要请求检定的目标玩家！');
    return;
  }
  
  // 获取目标玩家的技能列表
  const res = await getCurrentSkillListForPicker();
  if (!res) return;
  
  // 设置技能选择弹窗的模式和数据，并打开弹窗
  skillPickerSkills.value = res.list;
  skillPickerMode.value = 'request'; // 标记为“请求检定”模式
  skillPickerOpen.value = true;
}
function setupRealtime() {
  if (realtimeChannel) return
  realtimeChannel = supabase
    .channel(`room-chat-${props.roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channelId.value}`,
      },
      (payload) => {
        const row = payload.new
        if (messages.value.some((m) => m.id === row.id)) return
        const msg = normalizeRow(row)
        messages.value.push(msg)
        if (msg.type === 'check_request') {
          handleIncomingCheckRequest(msg)
        }
        scrollToBottom()
      }
    )
    .subscribe()
}

function cleanupRealtime() {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel)
    realtimeChannel = null
  }
}

async function send() {
  const text = input.value.trim()
  if (!text || sending.value) return
  const me = auth.user?.value
  if (!me?.id) {
    alert('请先登录')
    return
  }

  // 聊天指令处理（.r / .ra）
  if (text.startsWith('.')) {
    const handled = await handleCommand(text)
    if (handled) {
      input.value = ''
      return
    }
  }

  sending.value = true
  try {
    let speakerRole = null
    let speakerNpcName = null

    if (isOwner.value) {
      const { getRoomCharacter } = gameRoomsStore
      const { getById, fetchCharacter, normalizeCharacter } = charactersStore
      const charId = getRoomCharacter(props.roomId)
      if (!charId) {
        speakerRole = 'kp'
      } else {
        let raw = getById(charId)
        if (!raw) {
          await fetchCharacter(charId)
          raw = getById(charId)
        }
        if (raw) {
          const sheet = normalizeCharacter(raw)
          speakerRole = 'npc'
          speakerNpcName = sheet.name?.trim() || null
        } else {
          speakerRole = 'kp'
        }
      }
    }

    const payload = {
      channel_id: channelId.value,
      user_id: me.id,
      user_name: me.username || me.email?.split?.('@')[0] || '我',
      content: text,
      type: 'text',
      speaker_role: speakerRole,
      speaker_npc_id: null,
      speaker_npc_name: speakerNpcName,
    }
    const { data, error } = await supabase
      .from('messages')
      .insert(payload)
      .select('id, user_id, user_name, content, type, speaker_role, speaker_npc_id, speaker_npc_name, created_at')
      .single()
    if (!error && data) {
      messages.value.push(normalizeRow(data))
      scrollToBottom()
      input.value = ''
    }
  } finally {
    sending.value = false
  }
}

function onKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  }
}

function randomD100() {
  return Math.floor(Math.random() * 100) + 1
}

// 掷骰表达式解析（仅用于理智损失）：支持如 "1", "1d4", "d10"
function rollAmount(expr) {
  const raw = String(expr || '').trim().toLowerCase()
  if (!raw) return { total: 0, detail: '0' }

  // 纯数字
  if (!raw.includes('d')) {
    const n = Number(raw)
    const v = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0
    return { total: v, detail: String(v) }
  }

  const m = raw.match(/^(\d*)d(\d+)$/)
  if (!m) {
    const n = Number(raw)
    const v = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0
    return { total: v, detail: String(v) }
  }

  const count = m[1] ? Math.max(1, parseInt(m[1], 10)) : 1
  const sides = Math.max(1, parseInt(m[2], 10))
  const rolls = []
  let sum = 0
  for (let i = 0; i < count; i++) {
    const v = Math.floor(Math.random() * sides) + 1
    rolls.push(v)
    sum += v
  }
  const detail =
    count > 1 ? `${count}d${sides} = ${rolls.join(' + ')} = ${sum}` : `${count}d${sides} = ${sum}`
  return { total: sum, detail }
}

async function sendSystemMessage(text) {
  sending.value = true
  try {
    const payload = {
      channel_id: channelId.value,
      user_id: null,
      user_name: '骰娘',
      content: text,
      type: 'system',
    }
    // 不在本地立即 push，交给 Realtime INSERT 事件统一处理，避免重复
    await supabase.from('messages').insert(payload)
  } finally {
    sending.value = false
  }
}

// 只对房主可见内容的消息（暗骰 / 暗中检定）
async function sendHiddenMessage(text, type = 'hidden_roll') {
  sending.value = true
  try {
    const payload = {
      channel_id: channelId.value,
      user_id: null,
      user_name: '骰娘',
      content: text,
      type,
    }
    await supabase.from('messages').insert(payload)
  } finally {
    sending.value = false
  }
}

const diceOptions = ['1d4', '1d6', '1d8', '1d10', '1d12', '1d20', '1d100']

async function applyStatChangeFromPanel() {
  const attrKey = statAttr.value
  const op = statOp.value === '+' ? '+' : '-'
  const expr = (statExpr.value || '').trim()
  if (!expr) {
    alert('请填写变动表达式，例如 1 或 1d6。')
    return
  }

  const attrMap = {
    hp: { field: 'hpCurrent', label: 'HP' },
    mp: { field: 'mpCurrent', label: 'MP' },
    san: { field: 'sanCurrent', label: 'SAN' },
  }
  const metaAttr = attrMap[attrKey]
  if (!metaAttr) return

  const { getRoomCharacter } = gameRoomsStore
  const { getById, fetchCharacter, normalizeCharacter } = charactersStore
  const charId = getRoomCharacter(props.roomId)
  if (!charId) {
    alert('请先在房间右上角选择角色卡，再更新属性。')
    return
  }

  let raw = getById(charId)
  if (!raw) {
    await fetchCharacter(charId)
    raw = getById(charId)
  }
  if (!raw) {
    alert('未找到该角色卡信息，请稍后重试。')
    return
  }

  const sheet = normalizeCharacter(raw)
  const field = metaAttr.field
  const oldValue = Number(sheet[field] ?? 0) || 0
  const rollInfo = rollAmount(expr)
  const delta = rollInfo.total
  const signedDelta = op === '+' ? delta : -delta
  const newValue = Math.max(0, oldValue + signedDelta)

  const sheetName = sheet.name?.trim() || '未命名角色'
  const detailText =
    expr && expr.toLowerCase().includes('d')
      ? `（表达式 ${expr}，实际 ${rollInfo.detail}）`
      : expr
      ? `（表达式 ${expr}）`
      : ''

  const textMsg =
    `【属性变化】「${sheetName}」的 ${metaAttr.label}：` +
    `${oldValue} ${op} ${delta} → ${newValue}${detailText ? '，' + detailText : ''}`
  await sendSystemMessage(textMsg)
  activeTool.value = null
}

async function rollDice(diceType = '1d100') {
  const chosen = diceType
  const sides = parseInt(chosen.slice(2), 10) || 100
  const value = Math.floor(Math.random() * sides) + 1
  const me = auth.user?.value

  let name = ''
  if (isOwner.value) {
    name = 'KP'
  } else {
    const { getRoomCharacter } = gameRoomsStore
    const { getById, fetchCharacter, normalizeCharacter } = charactersStore
    const charId = getRoomCharacter(props.roomId)
    if (charId) {
      let raw = getById(charId)
      if (!raw) {
        await fetchCharacter(charId)
        raw = getById(charId)
      }
      if (raw) {
        const sheet = normalizeCharacter(raw)
        name = sheet.name?.trim() || '未命名角色'
      }
    }
    if (!name) {
      name = me?.username || me?.email?.split?.('@')[0] || '我'
    }
  }

  const text = `【掷骰】${name} 掷出 ${chosen} = ${value}`
  await sendSystemMessage(text);
  selectedDice.value = '1d100';
}

// 辅助：获取当前房间绑定角色的技能列表（用于弹窗选择）
async function getCurrentSkillListForPicker() {
  const { getRoomCharacter } = gameRoomsStore
  const { getById, fetchCharacter, normalizeCharacter, skillDisplayName } = charactersStore

  let charId = null

  // 若当前是在“请求检定”模式，并且已选择目标玩家，则优先使用目标玩家在本房间绑定的角色卡
  if (skillPickerMode.value === 'request' && requestTargetUserId.value) {
    const member = roomMembers.value.find((m) => m.userId === requestTargetUserId.value)
    charId = member?.characterId || null
    if (!charId) {
      alert('该玩家在本房间尚未绑定角色卡，无法进行技能检定。')
      return null
    }
  } else {
    // 自身技能检定时，仍然使用右上角绑定的角色卡
    charId = getRoomCharacter(props.roomId)
    if (!charId) {
      alert('请先在房间右上角选择角色卡，再进行技能检定。')
      return null
    }
  }

  let raw = getById(charId)
  if (!raw) {
    await fetchCharacter(charId)
    raw = getById(charId)
  }
  if (!raw) {
    alert('未找到该角色卡信息，请稍后重试。')
    return null
  }

  const sheet = normalizeCharacter(raw)
  const skills = Array.isArray(sheet.skills) ? sheet.skills : []
  if (!skills.length) {
    alert('该角色没有技能数据，请先在角色卡中填写技能。')
    return null
  }

  const list = skills
    .map((s) => ({
      raw: s,
      displayName: charactersStore.skillDisplayName(s),
    }))
    .filter((x) => x.displayName)

  if (!list.length) {
    alert('当前角色没有可用的技能名称。')
    return null
  }

  return { sheet, list }
}

// 点击“技能检定”按钮：通过弹窗选择技能，而不是手动输入
async function skillCheck() {
  const res = await getCurrentSkillListForPicker()
  if (!res) return
  skillPickerSkills.value = res.list
  skillPickerMode.value = 'self'
  skillPickerOpen.value = true
}

// 技能选择弹窗中选择某个技能
async function onSelectSkillFromPicker(item) {
  const name = item?.displayName
  if (!name) return
  if (skillPickerMode.value === 'self') {
    skillPickerOpen.value = false
    await skillCheckByName(name, 0)
  } else {
    requestSkillName.value = name
    skillPickerOpen.value = false
  }
}

// 房主侧：请求某位玩家进行技能 / 理智 / 疯狂症状判定
async function sendCheckRequest() {
  if (!isOwner.value) {
    alert('只有房主可以发起请求检定。');
    return;
  }
  const me = auth.user?.value;
  if (!me?.id) {
    alert('请先登录');
    return;
  }
  const targetUserId = requestTargetUserId.value;
  if (!targetUserId) {
    alert('请选择要请求的玩家。');
    return;
  }
  const member = roomMembers.value.find((m) => m.userId === targetUserId);
  if (!member) {
    alert('未找到该玩家，请稍后重试。');
    return;
  }

  const kind = requestKind.value;
  if (kind === 'skill') {
    const name = requestSkillName.value.trim();
    if (!name) {
      alert('请选择技能。');
      return;
    }
  }
  if (kind === 'sanity') {
    const succ = requestSanSuccessExpr.value.trim();
    const fail = requestSanFailExpr.value.trim();
    if (!succ || !fail) {
      alert('请填写成功/失败时的理智损失，例如：成功 0，失败 1d4。');
      return;
    }
  }

  const modifier = Number(requestSkillModifier.value || 0) || 0;
  const meta = {
    kind,
    roomId: props.roomId,
    targetUserId: member.userId,
    targetCharacterId: member.characterId,
    targetCharacterName: member.characterName,
    requesterId: me.id,
    requesterName: me.username || me.email?.split?.('@')[0] || 'KP',
  };
  if (kind === 'skill') {
    meta.skillName = requestSkillName.value.trim();
    meta.modifier = modifier;
  }
  if (kind === 'sanity') {
    meta.sanSuccessExpr = requestSanSuccessExpr.value.trim() || '0';
    meta.sanFailExpr = requestSanFailExpr.value.trim() || '1';
  }

  try {
    await supabase.from('messages').insert({
      channel_id: channelId.value,
      user_id: null,
      user_name: '骰娘',
      content: JSON.stringify(meta),
      type: 'check_request',
    });
    activeTool.value = null;
    requestSkillName.value = '';
    requestSkillModifier.value = 0;
    requestSanSuccessExpr.value = '';
    requestSanFailExpr.value = '';
  } catch (e) {
    alert('发送请求失败，请稍后重试。');
  }
}

// 输入指令：.ra xxx / .ra xxx+10 走同一套核心逻辑，hidden 表示暗中检定
async function skillCheckByName(keyword, modifier = 0, hidden = false) {
  // 使用当前房间绑定的角色卡进行技能检定
  const { getRoomCharacter } = gameRoomsStore
  const { getById, fetchCharacter, normalizeCharacter, skillSuccess, skillDisplayName } = charactersStore

  const charId = getRoomCharacter(props.roomId)
  if (!charId) {
    alert('请先在房间右上角选择角色卡，再进行技能检定。')
    return
  }

  let raw = getById(charId)
  if (!raw) {
    await fetchCharacter(charId)
    raw = getById(charId)
  }
  if (!raw) {
    alert('未找到该角色卡信息，请稍后重试。')
    return
  }

  const sheet = normalizeCharacter(raw)
  const skills = Array.isArray(sheet.skills) ? sheet.skills : []
  if (!skills.length) {
    alert('该角色没有技能数据，请先在角色卡中填写技能。')
    return
  }

  let chosen = skills.find((s) => {
    const d = skillDisplayName(s)
    const baseName = (s.name || '').replace(/\d$/, '')
    return d === keyword || baseName === keyword || d.replace(/（.*?）/, '') === keyword
  })
  if (!chosen) {
    chosen = skills.find((s) => skillDisplayName(s).includes(keyword))
  }
  if (!chosen) {
    alert('未在当前角色技能中找到对应技能，请检查名称。')
    return
  }

  const baseTarget = skillSuccess(chosen, sheet)
  const target = baseTarget + (modifier || 0)
  const value = randomD100()
  let result = '失败'
  if (value <= Math.floor(target / 5)) result = '极难成功'
  else if (value <= Math.floor(target / 2)) result = '困难成功'
  else if (value <= target) result = '成功'

  const me = auth.user?.value
  const playerName = me?.username || me?.email?.split?.('@')[0] || '我'
  const charName = sheet.name?.trim() || '未命名角色'
  const displaySkillName = skillDisplayName(chosen)
  const modText = modifier
    ? `（基础${baseTarget}${modifier > 0 ? `+${modifier}` : modifier} → 最终${target}）`
    : `（${target}）`
  const prefix = hidden ? '【暗中技能检定】' : '【技能检定】'
  const text = `${prefix}「${charName}」使用「${displaySkillName}」${modText}：1d100 = ${value}，${result}`
  if (hidden) {
    await sendHiddenMessage(text, 'hidden_skill')
  } else {
    await sendSystemMessage(text)
  }
}

async function handleCommand(raw) {
  const text = raw.trim()

  if (text.startsWith('.r ') || text === '.r') {
    const expr = text.slice(2).trim() // 去掉 .r
    const diceExpr = expr || '1d100'

    const m = diceExpr.trim().match(/^(\d*)d(\d+)$/i)
    if (!m) {
      alert('掷骰指令格式错误，请使用 ".r d100" 或 ".r 3d6" 之类格式。')
      return true
    }
    const count = m[1] ? Math.max(1, parseInt(m[1], 10)) : 1
    const sides = Math.max(1, parseInt(m[2], 10))

    if (count > 100 || sides > 1000) {
      alert('掷骰数量或面数过大，请不要超过 100 颗或 1000 面。')
      return true
    }

    const rolls = []
    let sum = 0
    for (let i = 0; i < count; i++) {
      const v = Math.floor(Math.random() * sides) + 1
      rolls.push(v)
      sum += v
    }

    const me = auth.user?.value
    let name = ''
    if (isOwner.value) {
      name = 'KP'
    } else {
      const { getRoomCharacter } = gameRoomsStore
      const { getById, fetchCharacter, normalizeCharacter } = charactersStore
      const charId = getRoomCharacter(props.roomId)
      if (charId) {
        let rawChar = getById(charId)
        if (!rawChar) {
          await fetchCharacter(charId)
          rawChar = getById(charId)
        }
        if (rawChar) {
          const sheet = normalizeCharacter(rawChar)
          name = sheet.name?.trim() || '未命名角色'
        }
      }
      if (!name) {
        name = me?.username || me?.email?.split?.('@')[0] || '我'
      }
    }

    const exprText = `${count}d${sides}`
    const detail = count > 1 ? ` = ${rolls.join(' + ')} = ${sum}` : ` = ${sum}`
    const textMsg = `【掷骰】${name} 掷出 ${exprText}${detail}`
    await sendSystemMessage(textMsg)
    return true
  }

  // 掷骰指令：.r / .r d10 / .r 3d6
  if (text.startsWith('.r ') || text === '.r') {
    const expr = text.slice(2).trim() // 去掉 .r
    const diceExpr = expr || '1d100'

    const m = diceExpr.trim().match(/^(\d*)d(\d+)$/i)
    if (!m) {
      alert('掷骰指令格式错误，请使用 ".r d100" 或 ".r 3d6" 之类格式。')
      return true
    }
    const count = m[1] ? Math.max(1, parseInt(m[1], 10)) : 1
    const sides = Math.max(1, parseInt(m[2], 10))

    if (count > 100 || sides > 1000) {
      alert('掷骰数量或面数过大，请不要超过 100 颗或 1000 面。')
      return true
    }

    const rolls = []
    let sum = 0
    for (let i = 0; i < count; i++) {
      const v = Math.floor(Math.random() * sides) + 1
      rolls.push(v)
      sum += v
    }

    const me = auth.user?.value
    let name = ''
    if (isOwner.value) {
      name = 'KP'
    } else {
      const { getRoomCharacter } = gameRoomsStore
      const { getById, fetchCharacter, normalizeCharacter } = charactersStore
      const charId = getRoomCharacter(props.roomId)
      if (charId) {
        let rawChar = getById(charId)
        if (!rawChar) {
          await fetchCharacter(charId)
          rawChar = getById(charId)
        }
        if (rawChar) {
          const sheet = normalizeCharacter(rawChar)
          name = sheet.name?.trim() || '未命名角色'
        }
      }
      if (!name) {
        name = me?.username || me?.email?.split?.('@')[0] || '我'
      }
    }

    const exprText = `${count}d${sides}`
    const detail = count > 1 ? ` = ${rolls.join(' + ')} = ${sum}` : ` = ${sum}`
    const textMsg = `【掷骰】${name} 掷出 ${exprText}${detail}`
    await sendSystemMessage(textMsg)
    return true
  }

  // 暗骰指令：.rh / .rh d10 / .rh 3d6 （结果仅房主可见）
  if (text.startsWith('.rh ') || text === '.rh') {
    const expr = text.slice(3).trim() // 去掉 .rh
    const diceExpr = expr || '1d100'

    const m = diceExpr.trim().match(/^(\d*)d(\d+)$/i)
    if (!m) {
      alert('掷骰指令格式错误，请使用 ".rh d100" 或 ".rh 3d6" 之类格式。')
      return true
    }
    const count = m[1] ? Math.max(1, parseInt(m[1], 10)) : 1
    const sides = Math.max(1, parseInt(m[2], 10))

    if (count > 100 || sides > 1000) {
      alert('掷骰数量或面数过大，请不要超过 100 颗或 1000 面。')
      return true
    }

    const rolls = []
    let sum = 0
    for (let i = 0; i < count; i++) {
      const v = Math.floor(Math.random() * sides) + 1
      rolls.push(v)
      sum += v
    }

    const me = auth.user?.value
    let name = ''
    if (isOwner.value) {
      name = 'KP'
    } else {
      const { getRoomCharacter } = gameRoomsStore
      const { getById, fetchCharacter, normalizeCharacter } = charactersStore
      const charId = getRoomCharacter(props.roomId)
      if (charId) {
        let rawChar = getById(charId)
        if (!rawChar) {
          await fetchCharacter(charId)
          rawChar = getById(charId)
        }
        if (rawChar) {
          const sheet = normalizeCharacter(rawChar)
          name = sheet.name?.trim() || '未命名角色'
        }
      }
      if (!name) {
        name = me?.username || me?.email?.split?.('@')[0] || '我'
      }
    }

    const exprText = `${count}d${sides}`
    const detail = count > 1 ? ` = ${rolls.join(' + ')} = ${sum}` : ` = ${sum}`
    const textMsg = `【暗骰】${name} 掷出 ${exprText}${detail}`
    await sendHiddenMessage(textMsg, 'hidden_roll')
    return true
  }

  // 理智检定指令：.sc 成功损失/失败损失  例如 .sc 0/1 .sc 1/1d4 .sc 1d10/1d100
  if (text.startsWith('.sc ')) {
    const body = text.slice(3).trim()
    if (!body) {
      alert('用法：.sc <成功时失去理智>/<失败时失去理智>，例如 .sc 0/1 或 .sc 1/1d4')
      return true
    }
    const parts = body.split('/')
    if (parts.length !== 2) {
      alert('用法错误：请使用 ".sc 0/1"、".sc 1/1d4" 或 ".sc 1d10/1d100" 这样的格式。')
      return true
    }

    const successExpr = parts[0].trim()
    const failExpr = parts[1].trim()

    const { getRoomCharacter } = gameRoomsStore
    const { getById, fetchCharacter, normalizeCharacter } = charactersStore
    const charId = getRoomCharacter(props.roomId)
    if (!charId) {
      alert('请先在房间右上角选择角色卡，再进行理智检定。')
      return true
    }

    let raw = getById(charId)
    if (!raw) {
      await fetchCharacter(charId)
      raw = getById(charId)
    }
    if (!raw) {
      alert('未找到该角色卡信息，请稍后重试。')
      return true
    }

    const sheet = normalizeCharacter(raw)
    const san = Number(sheet.sanCurrent ?? 0) || 0
    const d100 = randomD100()
    const isSuccess = d100 <= san
    const lossInfo = isSuccess ? rollAmount(successExpr) : rollAmount(failExpr)
    const loss = lossInfo.total

    let result = isSuccess ? '成功' : '失败'
    if (d100 === 1) result = '大成功'
    else if (d100 === 100) result = '大失败'

    const sheetName = sheet.name?.trim() || '未命名角色'
    const textMsg =
      `【理智检定】「${sheetName}」进行理智检定（当前SAN ${san}，成功失去 ${successExpr}，失败失去 ${failExpr}）：` +
      `1d100 = ${d100}，${result}，实际失去 ${loss} 点SAN`
    await sendSystemMessage(textMsg)
    return true
  }

  // 更新属性指令：.st <属性>±<表达式>，例如 .st HP-1d6 / .st SAN+1
  if (text.startsWith('.st ')) {
    const body = text.slice(3).trim()
    if (!body) {
      alert('用法：.st <属性>±<表达式>，例如 .st HP-1d6 或 .st SAN+1')
      return true
    }
    const m = body.match(/^(\S+)\s*([+-])\s*(\S+)$/)
    if (!m) {
      alert('属性指令格式错误，请使用 ".st HP-1d6" 或 ".st SAN+1" 这样的格式。')
      return true
    }
    const attrRaw = m[1]
    const op = m[2]
    const expr = m[3]

    const attrKey = attrRaw.toLowerCase()
    const attrMap = {
      hp: { field: 'hpCurrent', label: 'HP' },
      mp: { field: 'mpCurrent', label: 'MP' },
      san: { field: 'sanCurrent', label: 'SAN' },
    }
    const metaAttr = attrMap[attrKey]
    if (!metaAttr) {
      alert('暂只支持 HP / MP / SAN 三种属性，例如 .st HP-1d6')
      return true
    }

    const { getRoomCharacter } = gameRoomsStore
    const { getById, fetchCharacter, normalizeCharacter } = charactersStore
    const charId = getRoomCharacter(props.roomId)
    if (!charId) {
      alert('请先在房间右上角选择角色卡，再更新属性。')
      return true
    }

    let raw = getById(charId)
    if (!raw) {
      await fetchCharacter(charId)
      raw = getById(charId)
    }
    if (!raw) {
      alert('未找到该角色卡信息，请稍后重试。')
      return true
    }

    const sheet = normalizeCharacter(raw)
    const field = metaAttr.field
    const oldValue = Number(sheet[field] ?? 0) || 0
    const rollInfo = rollAmount(expr)
    const delta = rollInfo.total
    const signedDelta = op === '+' ? delta : -delta
    const newValue = Math.max(0, oldValue + signedDelta)

    const sheetName = sheet.name?.trim() || '未命名角色'
    const detailText =
      expr && expr.toLowerCase().includes('d')
        ? `（表达式 ${expr}，实际 ${rollInfo.detail}）`
        : expr
        ? `（表达式 ${expr}）`
        : ''

    const textMsg =
      `【属性变化】「${sheetName}」的 ${metaAttr.label}：` +
      `${oldValue} ${op} ${delta} → ${newValue}${detailText ? '，' + detailText : ''}`
    await sendSystemMessage(textMsg)
    return true
  }

  // 技能检定指令：.ra 侦查 / .ra 侦查+10
  if (text.startsWith('.ra ')) {
    const body = text.slice(3).trim()
    if (!body) {
      return true
    }

    const m = body.match(/^(.+?)([+-]\d+)?$/)
    if (!m) {
      alert('技能检定指令格式错误，请使用 ".ra 侦查" 或 ".ra 侦查+10"。')
      return true
    }
    const name = m[1].trim()
    const modifier = m[2] ? parseInt(m[2], 10) : 0

    await skillCheckByName(name, modifier, false)
    return true
  }

  // 暗中技能检定指令：.rah 侦查 / .rah 侦查+10
  if (text.startsWith('.rah ')) {
    const body = text.slice(4).trim()
    if (!body) {
      return true
    }

    const m = body.match(/^(.+?)([+-]\d+)?$/)
    if (!m) {
      alert('技能检定指令格式错误，请使用 ".rah 侦查" 或 ".rah 侦查+10"。')
      return true
    }
    const name = m[1].trim()
    const modifier = m[2] ? parseInt(m[2], 10) : 0

    await skillCheckByName(name, modifier, true)
    return true
  }

  return false
}

// 处理服务端推送的请求检定消息，仅在目标用户端弹出骰子动画弹窗
function handleIncomingCheckRequest(msg) {
  const me = auth.user?.value
  if (!me?.id) return
  if (!msg || msg.type !== 'check_request') return
  let meta
  try {
    meta = JSON.parse(msg.content || '{}')
  } catch (e) {
    return
  }
  if (!meta || meta.targetUserId !== me.id) return

  checkRequest.value = meta
  if (meta.kind === 'skill' || meta.kind === 'sanity') {
    checkModalBatch.value = [
      { notation: '1d100', key: 'value', label: 'D100' },
    ]
  } else if (meta.kind === 'madness') {
    checkModalBatch.value = [
      { notation: '1d10', key: 'value', label: 'D10' },
    ]
  } else {
    return
  }
  checkModalOpen.value = true
}

// 玩家在弹窗中完成掷骰后的处理：根据请求类型生成系统消息
async function handleCheckConfirm(payload) {
  const meta = checkRequest.value
  if (!meta) return
  const rollValue = Number(payload?.value || 0) || 0

  if (meta.kind === 'skill') {
    // 与普通技能检定一致的判定逻辑
    await handleLocalSkillCheck(meta, rollValue)
  } else if (meta.kind === 'sanity') {
    await handleLocalSanCheck(meta, rollValue)
  } else if (meta.kind === 'madness') {
    await handleLocalMadness(meta, rollValue)
  }

  checkModalOpen.value = false
  checkRequest.value = null
}

async function handleLocalSkillCheck(meta, value) {
  const { getRoomCharacter } = gameRoomsStore
  const { getById, fetchCharacter, normalizeCharacter, skillDisplayName, skillSuccess } = charactersStore
  const charId = getRoomCharacter(props.roomId)
  if (!charId) return

  let raw = getById(charId)
  if (!raw) {
    await fetchCharacter(charId)
    raw = getById(charId)
  }
  if (!raw) return

  const sheet = normalizeCharacter(raw)
  const skills = Array.isArray(sheet.skills) ? sheet.skills : []
  const keyword = meta.skillName || ''
  if (!keyword) return

  let chosen = skills.find((s) => {
    const d = skillDisplayName(s)
    const baseName = (s.name || '').replace(/\d$/, '')
    return d === keyword || baseName === keyword || d.replace(/（.*?）/, '') === keyword
  })
  if (!chosen) {
    chosen = skills.find((s) => skillDisplayName(s).includes(keyword))
  }
  if (!chosen) return

  const baseTarget = skillSuccess(chosen, sheet)
  const modifier = Number(meta.modifier || 0) || 0
  const target = baseTarget + modifier

  let result = '失败'
  if (value === 1) {
    result = '大成功'
  } else if (value === 100 || (value >= 96 && target < 50)) {
    result = '大失败'
  } else if (value <= Math.floor(target / 5)) {
    result = '极难成功'
  } else if (value <= Math.floor(target / 2)) {
    result = '困难成功'
  } else if (value <= target) {
    result = '成功'
  }

  const sheetName = sheet.name?.trim() || '未命名角色'
  const displaySkillName = skillDisplayName(chosen)
  const modText = modifier
    ? `（基础${baseTarget}${modifier > 0 ? `+${modifier}` : modifier} → 最终${target}）`
    : `（${target}）`
  const text = `【被请求技能检定】「${sheetName}」使用「${displaySkillName}」${modText}：1d100 = ${value}，${result}`
  await sendSystemMessage(text)
}

async function handleLocalSanCheck(meta, value) {
  const { getRoomCharacter } = gameRoomsStore
  const { getById, fetchCharacter, normalizeCharacter } = charactersStore
  const charId = getRoomCharacter(props.roomId)
  if (!charId) return

  let raw = getById(charId)
  if (!raw) {
    await fetchCharacter(charId)
    raw = getById(charId)
  }
  if (!raw) return

  const sheet = normalizeCharacter(raw)
  const san = Number(sheet.sanCurrent ?? 0) || 0
  const successExpr = meta.sanSuccessExpr || '0'
  const failExpr = meta.sanFailExpr || '1'
  const isSuccess = value <= san
  let result = isSuccess ? '成功' : '失败'
  if (value === 1) result = '大成功'
  else if (value === 100) result = '大失败'

  const chosenExpr = isSuccess ? successExpr : failExpr
  const lossInfo = rollAmount(chosenExpr)
  const loss = lossInfo.total

  const sheetName = sheet.name?.trim() || '未命名角色'
  const text =
    `【理智检定】「${sheetName}」进行理智检定（当前SAN ${san}，成功失去 ${successExpr}，失败失去 ${failExpr}）：` +
    `1d100 = ${value}，${result}，实际失去 ${loss} 点SAN`
  await sendSystemMessage(text)
}

async function handleLocalMadness(meta, value) {
  const { getRoomCharacter } = gameRoomsStore
  const { getById, fetchCharacter, normalizeCharacter } = charactersStore
  const charId = getRoomCharacter(props.roomId)
  if (!charId) return

  let raw = getById(charId)
  if (!raw) {
    await fetchCharacter(charId)
    raw = getById(charId)
  }
  if (!raw) return

  const sheet = normalizeCharacter(raw)
  const sheetName = sheet.name?.trim() || '未命名角色'

  const table = [
    '失语或言语混乱',
    '恐惧发作，极度惊恐地逃离现场',
    '强迫症状或重复某个动作',
    '短暂性失忆，只记得部分事实',
    '歇斯底里的大笑或大哭',
    '僵直或发呆，一段时间内无法行动',
    '妄想自己遭到追杀或监视',
    '对某个无害事物产生强烈恐惧',
    '攻击性骤增，冲动性地攻击他人或物品',
    '自言自语，沉浸在幻觉或幻听中',
  ]
  const idx = Math.min(Math.max(value, 1), 10) - 1
  const symptom = table[idx] || '出现了一种难以言喻的疯狂症状'
  const text = `【疯狂症状】「${sheetName}」抽取到：${symptom}（D10 = ${value}）`
  await sendSystemMessage(text)
}

onMounted(async () => {
  loadMessages()
  setupRealtime()

  // 计算当前用户是否为房主，用于开启 KP / NPC 发言身份选择
  const { getRoomById, fetchRoom } = gameRoomsStore
  const me = auth.user?.value
  if (me?.id) {
    let room = getRoomById?.(props.roomId)
    if (!room && fetchRoom) {
      room = await fetchRoom(props.roomId)
    }
    if (room && room.ownerId) {
      isOwner.value = room.ownerId === me.id
    }
  }

  // 房主：预加载房间内已通过角色审核的玩家列表，供“请求检定”使用
  if (isOwner.value && gameRoomsStore.fetchRoomCharacterApplications) {
    try {
      const res = await gameRoomsStore.fetchRoomCharacterApplications(props.roomId)
      if (res.ok) {
        const list = (res.list || []).filter((x) => x.status === 'accepted')
        const { getById, fetchCharacter, normalizeCharacter } = charactersStore
        const members = []
        for (const item of list) {
          let rawChar = getById(item.characterId)
          if (!rawChar) {
            await fetchCharacter(item.characterId)
            rawChar = getById(item.characterId)
          }
          let charName = ''
          if (rawChar) {
            const sheet = normalizeCharacter(rawChar)
            charName = sheet.name?.trim() || '未命名角色'
          }
          members.push({
            userId: item.userId,
            characterId: item.characterId,
            characterName: charName,
          })
        }
        roomMembers.value = members
      }
    } catch (e) {
      // ignore
    }
  }
})

onUnmounted(() => {
  cleanupRealtime()
})

watch(
  () => props.roomId,
  () => {
    cleanupRealtime()
    messages.value = []
    loadMessages()
    setupRealtime()
  }
)
</script>

