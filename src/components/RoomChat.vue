<template>
  <div class="flex flex-col h-full">
    <!-- 消息列表 -->
    <div ref="listEl" class="flex-1 overflow-y-auto scroll-thin px-4 py-3 space-y-2">
      <template v-for="m in messages" :key="m.id">
        <!-- 骰娘 / 系统消息：居中提示样式 -->
        <div
          v-if="m.type === 'system'"
          class="flex justify-center my-1 text-[11px] text-accent-muted"
        >
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-chat-panel/60 border border-dashed border-accent-muted/40">
            <Icon icon="mdi:dice-multiple" class="text-sm" />
            <span>{{ m.content }}</span>
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
              {{ m.content }}
            </div>
          </div>
        </div>
      </template>
      <div v-if="!messages.length && !loading" class="text-center text-xs text-accent-muted py-6">
        暂无消息，开始在房间里说点什么吧～
      </div>
      <LoadingSpinner v-if="loading" :block="false" size="sm" message="加载中…" className="justify-center py-4" />
    </div>

    <!-- 输入区 + 掷骰 / 技能检定 -->
    <div class="border-t border-chat-border px-3 py-2 flex flex-col gap-1">
      <div class="flex items-center gap-2 text-[11px] text-accent-muted">
        <button
          type="button"
          class="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/5"
          @click="rollDice"
        >
          <Icon icon="mdi:dice-multiple" class="text-base" />
          <span>掷骰</span>
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
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import LoadingSpinner from './LoadingSpinner.vue'
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
const loading = ref(true)
const sending = ref(false)
const input = ref('')
let realtimeChannel = null

// 是否为房主（用于显示掷骰/检定中的 KP 名称）
const isOwner = ref(false)

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

function getSpeakerName(msg) {
  if (msg.type === 'system') return '骰娘'
  if (msg.speakerRole === 'kp') return 'KP'
  if (msg.speakerRole === 'npc' && msg.speakerNpcName) return msg.speakerNpcName
  return msg.userName || '未知'
}

function getSpeakerBadge(msg) {
  if (msg.type === 'system') return { text: '骰娘', class: 'bg-accent-muted/20 text-accent-muted' }
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
        messages.value.push(normalizeRow(row))
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
  sending.value = true
  try {
    let speakerRole = null
    let speakerNpcName = null

    // 发言身份从房间右上角的角色选择推导：
    // - 房主 + 未选择角色卡：KP
    // - 房主 + 选择了角色卡：NPC（名称为该角色名）
    // - 非房主：普通玩家，不写 speaker_role
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

async function rollDice() {
  const value = randomD100()
  const me = auth.user?.value

  let name = ''
  if (isOwner.value) {
    // 房主：统一显示为 KP
    name = 'KP'
  } else {
    // 其他玩家：优先使用当前绑定角色卡名称
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
    // 若未绑定角色或加载失败，退回到用户名
    if (!name) {
      name = me?.username || me?.email?.split?.('@')[0] || '我'
    }
  }

  const text = `【掷骰】${name} 掷出 1d100 = ${value}`
  await sendSystemMessage(text)
}

async function skillCheck() {
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

  const allNames = skills.map((s) => skillDisplayName(s)).filter(Boolean)
  const preview = allNames.slice(0, 20).join('、') + (allNames.length > 20 ? '…' : '')
  const inputName = window.prompt(
    `请输入要检定的技能名称（例如：侦查）\n当前角色技能：${preview || '（无）'}`,
    '侦查'
  )
  if (inputName == null) return
  const keyword = inputName.trim()
  if (!keyword) return

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

  const target = skillSuccess(chosen, sheet)
  const value = randomD100()
  let result = '失败'
  if (value <= Math.floor(target / 5)) result = '极难成功'
  else if (value <= Math.floor(target / 2)) result = '困难成功'
  else if (value <= target) result = '成功'

  const me = auth.user?.value
  const playerName = me?.username || me?.email?.split?.('@')[0] || '我'
  const charName = sheet.name?.trim() || '未命名角色'
  const displaySkillName = skillDisplayName(chosen)
  const text = `【技能检定】「${charName}」使用「${displaySkillName}」(${target})：1d100 = ${value}，${result}`
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

