<template>
  <div class="flex flex-col h-full">
    <!-- 消息列表 -->
    <RoomChatMessages
      :messages="messages"
      :loading="loading"
      :is-owner="isOwner"
      :self-character-avatar="selfCharacterAvatar"
      @refresh="reloadMessages"
      @avatar-click="handleAvatarClick"
    />

    <div class="border-t border-base-200/50 bg-base-100 px-3 py-2 flex flex-col gap-2 pb-safe">
      <div class="flex items-center gap-2 text-xs text-base-content/60 px-1 overflow-x-auto scroll-thin">
        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all active:scale-95 whitespace-nowrap"
          :class="activeTool === 'dice' ? 'bg-primary/10 text-primary font-medium' : 'bg-base-200 hover:bg-base-300'"
          @click="activeTool = activeTool === 'dice' ? null : 'dice'"
        >
          <Icon icon="mdi:dice-multiple" class="text-base" />
          <span>掷骰</span>
        </button>
        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all active:scale-95 whitespace-nowrap"
          :class="activeTool === 'stat' ? 'bg-primary/10 text-primary font-medium' : 'bg-base-200 hover:bg-base-300'"
          @click="activeTool = activeTool === 'stat' ? null : 'stat'"
        >
          <Icon icon="mdi:pencil-plus-outline" class="text-base" />
          <span>更新属性</span>
        </button>
        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-base-200 hover:bg-base-300 transition-all active:scale-95 whitespace-nowrap"
          @click="skillCheck"
        >
          <Icon icon="mdi:account-search-outline" class="text-base" />
          <span>技能检定</span>
        </button>
      </div>

      <!-- 掷骰面板 -->
      <div
        v-if="activeTool === 'dice'"
        class="px-4 py-3 rounded-2xl bg-base-200 shadow-sm border border-base-300/50 space-y-3"
      >
        <div class="flex flex-wrap items-center gap-3">
          <span class="text-xs font-bold text-base-content/50 shrink-0">骰子</span>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="d in diceOptions"
              :key="d"
              type="button"
              class="px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95"
              :class="selectedDice === d ? 'bg-primary text-primary-content shadow-sm shadow-primary/30' : 'bg-base-100 text-base-content/70 hover:bg-base-300'"
              @click="selectedDice = d"
            >
              {{ d }}
            </button>
          </div>
        </div>
        <div class="flex justify-end gap-2 pt-2 border-t border-base-300/50">
          <button
            type="button"
            class="px-4 py-1.5 rounded-xl text-xs font-medium bg-base-100 text-base-content/60 hover:bg-base-300 active:scale-95 transition-all"
            @click="activeTool = null"
          >
            取消
          </button>
          <button
            type="button"
            class="px-5 py-1.5 rounded-xl text-xs font-bold bg-primary text-primary-content shadow-sm shadow-primary/20 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
            :disabled="diceRolling"
            @click="rollDice(selectedDice)"
          >
            <Icon
              v-if="diceRolling"
              icon="mdi:loading"
              class="text-sm animate-spin"
            />
            <span v-else>确认掷骰</span>
          </button>
        </div>
      </div>

      <!-- 更新属性面板 -->
      <div
        v-if="activeTool === 'stat'"
        class="px-4 py-3 rounded-2xl bg-base-200 shadow-sm border border-base-300/50 space-y-3"
      >
        <div class="flex flex-wrap items-center gap-3">
          <select
            v-model="statAttr"
            class="select select-sm select-bordered rounded-xl bg-base-100 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="hp">HP</option>
            <option value="mp">MP</option>
            <option value="san">SAN</option>
          </select>
          <select
            v-model="statOp"
            class="select select-sm select-bordered rounded-xl bg-base-100 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/50 w-16 px-2"
          >
            <option value="-">-</option>
            <option value="+">+</option>
          </select>
          <input
            v-model="statExpr"
            type="text"
            placeholder="如 1 或 1d6"
            class="input input-sm input-bordered rounded-xl bg-base-100 text-xs w-28 outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div class="flex justify-end gap-2 pt-2 border-t border-base-300/50">
          <button
            type="button"
            class="px-4 py-1.5 rounded-xl text-xs font-medium bg-base-100 text-base-content/60 hover:bg-base-300 active:scale-95 transition-all"
            @click="activeTool = null"
          >
            取消
          </button>
          <button
            type="button"
            class="px-5 py-1.5 rounded-xl text-xs font-bold bg-primary text-primary-content shadow-sm shadow-primary/20 active:scale-95 transition-all"
            @click="applyStatChangeFromPanel"
          >
            执行更新
          </button>
        </div>
      </div>
      
      <div class="flex items-end gap-2">
        <textarea
          ref="inputEl"
          v-model="input"
          rows="1"
          placeholder="请输入内容... (输入 / 可使用指令)"
          class="flex-1 min-h-[44px] max-h-32 px-4 py-3 rounded-2xl bg-base-200 border-none text-sm text-base-content placeholder:text-base-content/40 resize-none outline-none focus:ring-2 focus:ring-primary/30 transition-all shadow-inner"
          @keydown="onKeydown"
        />
        <button
          type="button"
          class="h-[44px] p-3 rounded-full bg-primary text-primary-content flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-sm shadow-primary/30"
          :disabled="sending || !input.trim()"
          @click="send"
        >
          <Icon v-if="sending" icon="mdi:loading" class="text-xl animate-spin" />
          <Icon v-else icon="mdi:send" class="text-xl" />
        </button>
      </div>

      <!-- 文本快捷键：场外、说话 -->
      <div class="flex items-center gap-2 text-[11px] text-base-content/60 px-1 overflow-x-auto scroll-thin">
        <button
          v-for="s in textShortcuts"
          :key="s.label"
          type="button"
          class="shrink-0 px-2.5 py-1 rounded-lg bg-base-200 hover:bg-base-300 transition-colors active:scale-95"
          @click="wrapSelection(s.open, s.close, s.placeholder)"
        >
          {{ s.label }}
        </button>
      </div>
    </div>

    <!-- 技能选择弹窗 -->
    <BottomSheet v-model:open="skillPickerOpen" :title="skillPickerMode === 'self' ? '选择技能进行检定' : '选择要请求的技能'">
      <div class="flex-1 min-h-0 space-y-2">
        <div
          v-for="item in skillPickerSkills"
          :key="item.displayName"
          class="flex items-center justify-between px-4 py-3 rounded-lg bg-base-200 border border-base-300 hover:border-primary/60 hover:bg-primary/10 cursor-pointer active:scale-95 transition-all text-sm text-base-content"
          @click="onSelectSkillFromPicker(item)"
        >
          <span class="truncate">{{ item.displayName }}</span>
          <Icon icon="mdi:chevron-right" class="text-xl text-base-content/50" />
        </div>
      </div>
    </BottomSheet>

  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import BottomSheet from './BottomSheet.vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import { useGameRoomsStore } from '../stores/gameRooms'
import { useCharactersStore } from '../stores/characters'
import { useAchievementsStore } from '../stores/achievements'
import { IMMEDIATE_INSANITY_TABLE } from '../data/madnessTable'
import { useChannelMessages } from '../composables/useChannelMessages'
import { useToast } from '../composables/useToast'
import { useDice3D } from '../composables/useDice3D'
import { useCharacterCardModal } from '../composables/useCharacterCardModal'
import { parseAndRollDice as utilsParseAndRollDice, randomD100 as utilsRandomD100, rollAmount as utilsRollAmount } from '../utils/dice'
import { MESSAGE_TYPES, ROOM_CHARACTER_STATUS } from '../constants/enums'
import RoomChatMessages from './RoomChatMessages.vue'

const props = defineProps({
  roomId: {
    type: [String, Number],
    required: true,
  },
})

const auth = useAuthStore()
const gameRoomsStore = useGameRoomsStore()
const charactersStore = useCharactersStore()
const achievementsStore = useAchievementsStore()
const { openCharacterCard } = useCharacterCardModal()
const { roll: roll3D, isInitialized: isDice3DInitialized } = useDice3D()
const activeTool = ref(null) // 'dice' | 'request' | 'stat' | null
const loading = ref(false)
const sending = ref(false)
const input = ref('')
const inputEl = ref(null)

const textShortcuts = [
  { open: '(', close: ')', placeholder: '场外', label: '() 场外' },
  { open: '"', close: '"', placeholder: '说话', label: '"" 说话' },
]

// 是否为房主（用于显示掷骰/检定中的 KP 名称）
const isOwner = ref(false)

// 房间玩家列表（通过 room_characters 表的已通过记录）
const roomMembers = ref([])
const roomUserCharacterMap = ref({})

const selectedRoomCharacterId = computed(() => gameRoomsStore.getRoomCharacter(props.roomId))
const selfCharacterAvatar = computed(() => {
  const id = selectedRoomCharacterId.value
  if (!id) return ''
  const raw = charactersStore.getById(id)
  const sheet = raw ? charactersStore.normalizeCharacter(raw) : null
  return sheet?.portrait || ''
})

async function loadRoomAcceptedMembers() {
  // 用于：点击头像查看角色卡（需要 userId -> characterId 映射）
  try {
    const res = await gameRoomsStore.fetchRoomCharacterApplications(props.roomId)
    if (!res?.ok) return
    const accepted = (res.list || []).filter((x) => x.status === ROOM_CHARACTER_STATUS.ACCEPTED)

    // 预拉取角色卡数据（避免点开弹窗时再等一轮）
    const ids = [...new Set(accepted.map((x) => x.characterId).filter(Boolean))]
    if (ids.length && charactersStore.fetchCharactersByIds) {
      await charactersStore.fetchCharactersByIds(ids)
    }

    const map = {}
    for (const item of accepted) {
      if (!item.userId || !item.characterId) continue
      if (!map[item.userId]) map[item.userId] = []
      // 同一个用户可能有多张被接受的角色卡，这里都记录，默认取第一张
      if (!map[item.userId].includes(item.characterId)) {
        map[item.userId].push(item.characterId)
      }
    }
    roomUserCharacterMap.value = map
  } catch {
    // ignore
  }
}

function handleAvatarClick(payload) {
  const userId = payload?.userId
  if (!userId) return

  // NPC 发言：消息已携带 speakerNpcId，优先直接打开对应角色卡
  if (payload?.speakerRole === 'npc' && payload?.speakerNpcId) {
    // KP 查看 NPC 默认按 own=true（不隐藏 tab）；其他人查看按 own=false
    openCharacterCard(payload.speakerNpcId, !!payload?.isSelf)
    return
  }

  // KP 文本（speakerRole === 'kp'）通常没有对应角色卡，直接忽略
  if (payload?.speakerRole === 'kp') return

  let charId = null
  if (payload?.isSelf) {
    // 自己：优先使用房间当前选择的角色卡
    charId = selectedRoomCharacterId.value || (roomUserCharacterMap.value[userId]?.[0] ?? null)
  } else {
    charId = roomUserCharacterMap.value[userId]?.[0] ?? null
  }

  if (!charId) {
    showToast('该玩家在本房间未绑定角色卡。')
    return
  }

  openCharacterCard(charId, !!payload?.isSelf)
}

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
const diceRolling = ref(false)

// 技能选择弹窗（自检 / 请求检定 共用）
const skillPickerOpen = ref(false)
const skillPickerMode = ref('self') // 'self' | 'request'
const skillPickerSkills = ref([]) // { raw, displayName }[]
const skillPickerLoading = ref(false)

const toast = useToast()
function showToast(message, duration = 3000) {
  toast.show(message, duration, 'warning')
}

const channelId = computed(() => `room:${props.roomId}`)

// 房间内消息流：统一使用通用的 useChannelMessages composable 管理加载与 Realtime
const {
  messages,
  loading: messagesLoading,
  reload: reloadMessages,
} = useChannelMessages(channelId, {
  onNewMessage(msg) {
    if (msg.type === MESSAGE_TYPES.CHECK_REQUEST) {
      handleIncomingCheckRequest(msg)
    }
  },
})

watch(
  messagesLoading,
  (val) => {
    loading.value = val
  },
  { immediate: true }
)

watch(
  () => props.roomId,
  async () => {
    await loadRoomAcceptedMembers()
  }
)

// ==================== 工具函数 ====================

/**
 * 获取角色卡信息（带缓存和自动获取）
 */
async function getCharacterSheet(charId) {
  if (!charId) return null
  const { getById, fetchCharacter, normalizeCharacter } = charactersStore
  let raw = getById(charId)
  if (!raw) {
    await fetchCharacter(charId)
    raw = getById(charId)
  }
  return raw ? normalizeCharacter(raw) : null
}

/**
 * 获取当前房间绑定的角色卡
 */
async function getCurrentRoomCharacter() {
  const { getRoomCharacter } = gameRoomsStore
  const charId = getRoomCharacter(props.roomId)
  if (!charId) return null
  return await getCharacterSheet(charId)
}

/**
 * 根据角色 id 持久化更新角色卡部分字段（保持其余字段不变）
 */
async function updateCharacterById(characterId, patch) {
  if (!characterId || !patch || typeof patch !== 'object') return
  const raw = charactersStore.getById(characterId)
  if (!raw) return
  const draft = { ...raw, ...patch }
  delete draft.id
  delete draft.updated_at
  await charactersStore.update(characterId, draft)
}

/**
 * 更新当前房间绑定角色卡的字段
 */
async function updateCurrentRoomCharacter(patch) {
  const { getRoomCharacter } = gameRoomsStore
  const charId = getRoomCharacter(props.roomId)
  if (!charId) return
  await updateCharacterById(charId, patch)
}

/**
 * 获取发言者名称（用于消息显示）
 */
async function getSpeakerNameForMessage() {
  if (isOwner.value) {
    return 'KP'
  }
  const sheet = await getCurrentRoomCharacter()
  if (sheet) {
    return sheet.name?.trim() || '未命名角色'
  }
  const me = auth.user?.value
  return me?.username || me?.email?.split?.('@')[0] || '我'
}

// 统一使用 utils/dice 中的工具函数
const parseAndRollDice = (expr) => utilsParseAndRollDice(expr, roll3D, isDice3DInitialized)

async function openSkillPickerForRequest() {
  // 先校验是否选择了目标玩家
  if (!requestTargetUserId.value) {
    showToast('请先选择要请求检定的目标玩家！');
    return;
  }
  
  // 先设置模式为"请求检定"，这样 getCurrentSkillListForPicker 才能正确获取目标玩家的技能列表
  skillPickerMode.value = 'request';
  
  // 获取目标玩家的技能列表
  const res = await getCurrentSkillListForPicker();
  if (!res) return;
  
  // 设置技能选择弹窗的模式和数据，并打开弹窗
  skillPickerSkills.value = res.list;
  skillPickerMode.value = 'request'; // 标记为“请求检定”模式
  skillPickerOpen.value = true;
}
async function send() {
  const text = input.value.trim()
  if (!text || sending.value) return
  const me = auth.user?.value
  if (!me?.id) {
    showToast('请先登录')
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
    let speakerNpcId = null
    let speakerNpcName = null

    if (isOwner.value) {
      const { getRoomCharacter } = gameRoomsStore
      const charId = getRoomCharacter(props.roomId)
      if (!charId) {
        speakerRole = 'kp'
      } else {
        const sheet = await getCharacterSheet(charId)
        if (sheet) {
          speakerRole = 'npc'
          speakerNpcId = charId
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
      type: MESSAGE_TYPES.TEXT,
      speaker_role: speakerRole,
      speaker_npc_id: speakerNpcId,
      speaker_npc_name: speakerNpcName,
    }
    const { error } = await supabase
      .from('messages')
      .insert(payload)
      .select('id, user_id, user_name, content, type, speaker_role, speaker_npc_id, speaker_npc_name, created_at')
      .single()
    if (!error) {
      input.value = ''
      achievementsStore.onMessageSent()
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

function wrapSelection(open, close, placeholder = '') {
  const el = inputEl.value
  const value = String(input.value ?? '')
  if (!el || typeof el.selectionStart !== 'number' || typeof el.selectionEnd !== 'number') {
    // 回退：直接追加
    input.value = value + open + (placeholder || '') + close
    return
  }

  const start = el.selectionStart
  const end = el.selectionEnd
  const selected = value.slice(start, end)
  const inner = selected || placeholder || ''
  input.value = value.slice(0, start) + open + inner + close + value.slice(end)

  nextTick(() => {
    try {
      el.focus()
      if (selected) {
        el.setSelectionRange(start + open.length, start + open.length + inner.length)
      } else {
        // 没选中时把光标放到中间，方便继续输入
        const pos = start + open.length
        el.setSelectionRange(pos, pos + inner.length)
      }
    } catch {
      // ignore
    }
  })
}

const randomD100 = () => utilsRandomD100(roll3D, isDice3DInitialized)
const rollAmount = (expr) => utilsRollAmount(expr, roll3D, isDice3DInitialized)

async function sendSystemMessage(text) {
  sending.value = true
  try {
    const payload = {
      channel_id: channelId.value,
      user_id: null,
      user_name: '骰娘',
      content: text,
      type: MESSAGE_TYPES.SYSTEM,
    }
    // 不在本地立即 push，交给 Realtime INSERT 事件统一处理，避免重复
    await supabase.from('messages').insert(payload)
  } finally {
    sending.value = false
  }
}

// 只对房主可见内容的消息（暗骰 / 暗中检定）
async function sendHiddenMessage(text, type = MESSAGE_TYPES.HIDDEN_ROLL) {
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
    showToast('请填写变动表达式，例如 1 或 1d6。')
    return
  }

  const attrMap = {
    hp: { field: 'hpCurrent', label: 'HP' },
    mp: { field: 'mpCurrent', label: 'MP' },
    san: { field: 'sanCurrent', label: 'SAN' },
  }
  const metaAttr = attrMap[attrKey]
  if (!metaAttr) return

  const sheet = await getCurrentRoomCharacter()
  if (!sheet) {
    showToast('请先在房间右上角选择角色卡，再更新属性。')
    return
  }

  const field = metaAttr.field
  const oldValue = Number(sheet[field] ?? 0) || 0
  const rollInfo = await rollAmount(expr)
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

  await updateCurrentRoomCharacter({ [field]: newValue })

  const textMsg =
    `【属性变化】「${sheetName}」的 ${metaAttr.label}：` +
    `${oldValue} ${op} ${delta} → ${newValue}${detailText ? '，' + detailText : ''}`
  await sendSystemMessage(textMsg)
  activeTool.value = null
}

async function rollDice(diceType = '1d100') {
  if (diceRolling.value) return
  diceRolling.value = true
  try {
    const rollResult = await parseAndRollDice(diceType)
    if (!rollResult) {
      showToast('掷骰格式错误')
      return
    }

    const name = await getSpeakerNameForMessage()
    const text = `【掷骰】${name} 掷出 ${rollResult.expr}${rollResult.detail}`
    await sendSystemMessage(text)
    achievementsStore.onDiceRolled()
    selectedDice.value = '1d100'
  } finally {
    diceRolling.value = false
  }
}

// 辅助：获取当前房间绑定角色的技能列表（用于弹窗选择）
async function getCurrentSkillListForPicker() {
  const { getRoomCharacter } = gameRoomsStore
  const { skillDisplayName } = charactersStore

  let charId = null

  // 若当前是在“请求检定”模式，并且已选择目标玩家，则优先使用目标玩家在本房间绑定的角色卡
  if (skillPickerMode.value === 'request' && requestTargetUserId.value) {
    const member = roomMembers.value.find((m) => m.userId === requestTargetUserId.value)
    charId = member?.characterId || null
    if (!charId) {
      showToast('该玩家在本房间尚未绑定角色卡，无法进行技能检定。')
      return null
    }
  } else {
    // 自身技能检定时，仍然使用右上角绑定的角色卡
    charId = getRoomCharacter(props.roomId)
    if (!charId) {
      showToast('请先在房间右上角选择角色卡，再进行技能检定。')
      return null
    }
  }

  const sheet = await getCharacterSheet(charId)
  if (!sheet) {
    showToast('未找到该角色卡信息，请稍后重试。')
    return null
  }
  const skills = Array.isArray(sheet.skills) ? sheet.skills : []
  if (!skills.length) {
    showToast('该角色没有技能数据，请先在角色卡中填写技能。')
    // 没有技能也允许做属性检定，先不直接返回
  }

  const skillList = (skills || [])
    .map((s) => ({
      raw: s,
      displayName: skillDisplayName(s),
    }))
    .filter((x) => x.displayName)

  // 追加属性检定选项（力量、体质、敏捷、外貌、意志、灵感、教育、幸运）
  const attrDefs = [
    { key: 'str', name: '力量' },
    { key: 'con', name: '体质' },
    { key: 'dex', name: '敏捷' },
    { key: 'app', name: '外貌' },
    { key: 'pow', name: '意志' },
    { key: 'int', name: '灵感' },
    { key: 'edu', name: '教育' },
    { key: 'luc', name: '幸运' },
  ]
  const attrList = attrDefs
    .map(({ key, name }) => {
      const value = Number(sheet[key] ?? 0) || 0
      if (!value) return null
      return {
        raw: { kind: 'attribute', key, value },
        displayName: name,
      }
    })
    .filter(Boolean)

  const list = [...attrList, ...skillList]

  if (!list.length) {
    showToast('当前角色没有可用的技能或属性名称。')
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
    showToast('只有房主可以发起请求检定。');
    return;
  }
  const me = auth.user?.value;
  if (!me?.id) {
    showToast('请先登录');
    return;
  }
  const targetUserId = requestTargetUserId.value;
  if (!targetUserId) {
    showToast('请选择要请求的玩家。');
    return;
  }
  const member = roomMembers.value.find((m) => m.userId === targetUserId);
  if (!member) {
    showToast('未找到该玩家，请稍后重试。');
    return;
  }

  const kind = requestKind.value;
  if (kind === 'skill') {
    const name = requestSkillName.value.trim();
    if (!name) {
      showToast('请选择技能。');
      return;
    }
  }
  if (kind === 'sanity') {
    const succ = requestSanSuccessExpr.value.trim();
    const fail = requestSanFailExpr.value.trim();
    if (!succ || !fail) {
      showToast('请填写成功/失败时的理智损失，例如：成功 0，失败 1d4。');
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
      type: MESSAGE_TYPES.CHECK_REQUEST,
    });
    activeTool.value = null;
    requestSkillName.value = '';
    requestSkillModifier.value = 0;
    requestSanSuccessExpr.value = '';
    requestSanFailExpr.value = '';
  } catch (e) {
    showToast('发送请求失败，请稍后重试。');
  }
}

/**
 * 输入指令：.ra xxx / .ra xxx+10 走同一套核心逻辑，hidden 表示暗中检定
 */
async function skillCheckByName(keyword, modifier = 0, hidden = false) {
  const sheet = await getCurrentRoomCharacter()
  if (!sheet) {
    showToast('请先在房间右上角选择角色卡，再进行技能检定。')
    return
  }

  const { skillSuccess, skillDisplayName } = charactersStore
  const skills = Array.isArray(sheet.skills) ? sheet.skills : []
  if (!skills.length) {
    showToast('该角色没有技能数据，请先在角色卡中填写技能。')
    // 继续尝试属性检定
  }

  // 先尝试在技能列表中匹配
  let chosen = skills.find((s) => {
    const d = skillDisplayName(s)
    const baseName = (s.name || '').replace(/\d$/, '')
    return d === keyword || baseName === keyword || d.replace(/（.*?）/, '') === keyword
  })
  if (!chosen) {
    chosen = skills.find((s) => skillDisplayName(s).includes(keyword))
  }

  if (chosen) {
    const baseTarget = skillSuccess(chosen, sheet)
    const target = baseTarget + (modifier || 0)
    const value = await randomD100()
    let result = '失败'
    if (value <= Math.floor(target / 5)) result = '极难成功'
    else if (value <= Math.floor(target / 2)) result = '困难成功'
    else if (value <= target) result = '成功'

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
    return
  }

  // 再尝试属性检定（力量/体质/敏捷/外貌/意志/灵感/教育/幸运）
  const attrMap = {
    力量: 'str',
    体质: 'con',
    敏捷: 'dex',
    外貌: 'app',
    意志: 'pow',
    灵感: 'int',
    教育: 'edu',
    幸运: 'luc',
  }
  const attrKey = attrMap[keyword]
  if (attrKey) {
    const baseTarget = Number(sheet[attrKey] ?? 0) || 0
    const target = baseTarget + (modifier || 0)
    const value = await randomD100()
    let result = '失败'
    if (value <= Math.floor(target / 5)) result = '极难成功'
    else if (value <= Math.floor(target / 2)) result = '困难成功'
    else if (value <= target) result = '成功'

    const charName = sheet.name?.trim() || '未命名角色'
    const attrName = keyword
    const modText = modifier
      ? `（基础${baseTarget}${modifier > 0 ? `+${modifier}` : modifier} → 最终${target}）`
      : `（${target}）`
    const prefix = hidden ? '【暗中属性检定】' : '【属性检定】'
    const text = `${prefix}「${charName}」进行「${attrName}」检定${modText}：1d100 = ${value}，${result}`
    if (hidden) {
      await sendHiddenMessage(text, 'hidden_skill')
    } else {
      await sendSystemMessage(text)
    }
    return
  }

  showToast('未在当前角色技能或属性中找到对应项目，请检查名称。')
}

// ==================== 指令处理函数 ====================

/**
 * 处理掷骰指令：.r / .r d10 / .r 3d6
 */
async function handleRollCommand(text) {
  const expr = text.slice(2).trim() // 去掉 .r
  const diceExpr = expr || '1d100'
  
  const rollResult = await parseAndRollDice(diceExpr)
  if (!rollResult) {
    showToast('掷骰指令格式错误，请使用 ".r d100" 或 ".r 3d6" 之类格式。')
    return true
  }
  
  const name = await getSpeakerNameForMessage()
  const textMsg = `【掷骰】${name} 掷出 ${rollResult.expr}${rollResult.detail}`
  await sendSystemMessage(textMsg)
  return true
}

/**
 * 处理暗骰指令：.rh / .rh d10 / .rh 3d6 （结果仅房主可见）
 */
async function handleHiddenRollCommand(text) {
  const expr = text.slice(3).trim() // 去掉 .rh
  const diceExpr = expr || '1d100'
  
  const rollResult = await parseAndRollDice(diceExpr)
  if (!rollResult) {
    showToast('掷骰指令格式错误，请使用 ".rh d100" 或 ".rh 3d6" 之类格式。')
    return true
  }
  
  const name = await getSpeakerNameForMessage()
  const textMsg = `【暗骰】${name} 掷出 ${rollResult.expr}${rollResult.detail}`
  await sendHiddenMessage(textMsg, MESSAGE_TYPES.HIDDEN_ROLL)
  return true
}

/**
 * 处理理智检定指令：.sc 成功损失/失败损失  例如 .sc 0/1 .sc 1/1d4 .sc 1d10/1d100
 */
async function handleSanityCheckCommand(text) {
  const body = text.slice(3).trim()
  if (!body) {
    showToast('用法：.sc <成功时失去理智>/<失败时失去理智>，例如 .sc 0/1 或 .sc 1/1d4')
    return true
  }
  const parts = body.split('/')
  if (parts.length !== 2) {
    showToast('用法错误：请使用 ".sc 0/1"、".sc 1/1d4" 或 ".sc 1d10/1d100" 这样的格式。')
    return true
  }

  const successExpr = parts[0].trim()
  const failExpr = parts[1].trim()

  const sheet = await getCurrentRoomCharacter()
  if (!sheet) {
    showToast('请先在房间右上角选择角色卡，再进行理智检定。')
    return true
  }

  const san = Number(sheet.sanCurrent ?? 0) || 0
  const d100 = await randomD100()
  const isSuccess = d100 <= san
  const lossInfo = isSuccess ? await rollAmount(successExpr) : await rollAmount(failExpr)
  const loss = lossInfo.total
  const newSan = Math.max(0, san - loss)
  const triggerInsanity = loss >= 5
  const madnessRoll = triggerInsanity ? (Math.floor(Math.random() * 10) + 1) : null

  let result = isSuccess ? '成功' : '失败'
  if (d100 === 1) result = '大成功'
  else if (d100 === 100) result = '大失败'

  const sheetName = sheet.name?.trim() || '未命名角色'
  const textMsg =
    `【理智检定】「${sheetName}」进行理智检定（当前SAN ${san}）：` + `1d100 = ${d100}，${result}，失去 ${loss} 点SAN`

  const patch = triggerInsanity
    ? { sanCurrent: newSan, temporaryInsanity: true }
    : { sanCurrent: newSan }
  await updateCurrentRoomCharacter(patch)
  await sendSystemMessage(textMsg)
  if (triggerInsanity && madnessRoll != null) {
    await logImmediateInsanity(sheetName, madnessRoll)
  }
  return true
}

/**
 * 处理更新属性指令：.st <属性>±<表达式>，例如 .st HP-1d6 / .st SAN+1
 */
async function handleStatCommand(text) {
  const body = text.slice(3).trim()
  if (!body) {
    showToast('用法：.st <属性>±<表达式>，例如 .st HP-1d6 或 .st SAN+1')
    return true
  }
  const m = body.match(/^(\S+)\s*([+-])\s*(\S+)$/)
  if (!m) {
    showToast('属性指令格式错误，请使用 ".st HP-1d6" 或 ".st SAN+1" 这样的格式。')
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
    showToast('暂只支持 HP / MP / SAN 三种属性，例如 .st HP-1d6')
    return true
  }

  const sheet = await getCurrentRoomCharacter()
  if (!sheet) {
    showToast('请先在房间右上角选择角色卡，再更新属性。')
    return true
  }

  const field = metaAttr.field
  const oldValue = Number(sheet[field] ?? 0) || 0
  const rollInfo = await rollAmount(expr)
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

  await updateCurrentRoomCharacter({ [field]: newValue })

  const textMsg =
    `【属性变化】「${sheetName}」的 ${metaAttr.label}：` +
    `${oldValue} ${op} ${delta} → ${newValue}${detailText ? '，' + detailText : ''}`
  await sendSystemMessage(textMsg)
  return true
}

/**
 * 处理技能检定指令：.ra 侦查 / .ra 侦查+10
 */
async function handleSkillCheckCommand(text) {
  const body = text.slice(3).trim()
  if (!body) {
    return true
  }

  const m = body.match(/^(.+?)([+-]\d+)?$/)
  if (!m) {
    showToast('技能检定指令格式错误，请使用 ".ra 侦查" 或 ".ra 侦查+10"。')
    return true
  }
  const name = m[1].trim()
  const modifier = m[2] ? parseInt(m[2], 10) : 0

  await skillCheckByName(name, modifier, false)
  return true
}

/**
 * 处理暗中技能检定指令：.rah 侦查 / .rah 侦查+10
 */
async function handleHiddenSkillCheckCommand(text) {
  const body = text.slice(4).trim()
  if (!body) {
    return true
  }

  const m = body.match(/^(.+?)([+-]\d+)?$/)
  if (!m) {
    showToast('技能检定指令格式错误，请使用 ".rah 侦查" 或 ".rah 侦查+10"。')
    return true
  }
  const name = m[1].trim()
  const modifier = m[2] ? parseInt(m[2], 10) : 0

  await skillCheckByName(name, modifier, true)
  return true
}

/**
 * 主指令处理函数
 */
async function handleCommand(raw) {
  const text = raw.trim()

  if (text.startsWith('.r ') || text === '.r') {
    return await handleRollCommand(text)
  }
  if (text.startsWith('.rh ') || text === '.rh') {
    return await handleHiddenRollCommand(text)
  }
  if (text.startsWith('.sc ')) {
    return await handleSanityCheckCommand(text)
  }
  if (text.startsWith('.st ')) {
    return await handleStatCommand(text)
  }
  if (text.startsWith('.ra ')) {
    return await handleSkillCheckCommand(text)
  }
  if (text.startsWith('.rah ')) {
    return await handleHiddenSkillCheckCommand(text)
  }

  return false
}

// 处理服务端推送的请求检定消息：目标用户端自动使用 3D 骰子完成掷骰并生成系统消息
async function handleIncomingCheckRequest(msg) {
  const me = auth.user?.value
  if (!me?.id) return
  if (!msg || msg.type !== MESSAGE_TYPES.CHECK_REQUEST) return
  let meta
  try {
    meta = JSON.parse(msg.content || '{}')
  } catch (e) {
    return
  }
  if (!meta || meta.targetUserId !== me.id) return

  let rollValue = 0
  if (meta.kind === 'skill' || meta.kind === 'sanity') {
    // 技能 / 理智检定都使用 1d100
    rollValue = await randomD100()
  } else if (meta.kind === 'madness') {
    // 疯狂症状使用 1d10
    const r = await parseAndRollDice('1d10')
    rollValue = r?.sum ?? (Math.floor(Math.random() * 10) + 1)
  } else {
    return
  }

  if (meta.kind === 'skill') {
    await handleLocalSkillCheck(meta, rollValue)
  } else if (meta.kind === 'sanity') {
    await handleLocalSanCheck(meta, rollValue)
  } else if (meta.kind === 'madness') {
    await handleLocalMadness(meta, rollValue)
  }
}

async function handleLocalSkillCheck(meta, value) {
  const { skillDisplayName, skillSuccess } = charactersStore
  // 请求检定必须通过目标角色判定
  const charId = meta.targetCharacterId
  if (!charId) return

  const sheet = await getCharacterSheet(charId)
  if (!sheet) return
  const skills = Array.isArray(sheet.skills) ? sheet.skills : []
  const keyword = meta.skillName || ''
  if (!keyword) return

  // 先尝试按技能处理
  let chosen = skills.find((s) => {
    const d = skillDisplayName(s)
    const baseName = (s.name || '').replace(/\d$/, '')
    return d === keyword || baseName === keyword || d.replace(/（.*?）/, '') === keyword
  })
  if (!chosen) {
    chosen = skills.find((s) => skillDisplayName(s).includes(keyword))
  }

  const sheetName = sheet.name?.trim() || '未命名角色'
  const modifier = Number(meta.modifier || 0) || 0

  if (chosen) {
    const baseTarget = skillSuccess(chosen, sheet)
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

    const displaySkillName = skillDisplayName(chosen)
    const modText = modifier
      ? `（基础${baseTarget}${modifier > 0 ? `+${modifier}` : modifier} → 最终${target}）`
      : `（${target}）`
    const text = `【被请求技能检定】「${sheetName}」使用「${displaySkillName}」${modText}：1d100 = ${value}，${result}`
    await sendSystemMessage(text)
    return
  }

  // 若未找到对应技能，则尝试按属性检定处理
  const attrMap = {
    力量: 'str',
    体质: 'con',
    敏捷: 'dex',
    外貌: 'app',
    意志: 'pow',
    灵感: 'int',
    教育: 'edu',
    幸运: 'luc',
  }
  const attrKey = attrMap[keyword]
  if (!attrKey) return

  const baseTarget = Number(sheet[attrKey] ?? 0) || 0
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

  const attrName = keyword
  const modText = modifier
    ? `（基础${baseTarget}${modifier > 0 ? `+${modifier}` : modifier} → 最终${target}）`
    : `（${target}）`
  const text = `【被请求属性检定】「${sheetName}」进行「${attrName}」检定${modText}：1d100 = ${value}，${result}`
  await sendSystemMessage(text)
}

async function handleLocalSanCheck(meta, value) {
  // 请求检定必须通过目标角色判定
  const charId = meta.targetCharacterId
  if (!charId) return

  const sheet = await getCharacterSheet(charId)
  if (!sheet) return
  const san = Number(sheet.sanCurrent ?? 0) || 0
  const successExpr = meta.sanSuccessExpr || '0'
  const failExpr = meta.sanFailExpr || '1'
  const isSuccess = value <= san
  let result = isSuccess ? '成功' : '失败'
  if (value === 1) result = '大成功'
  else if (value === 100) result = '大失败'

  const chosenExpr = isSuccess ? successExpr : failExpr
  const lossInfo = await rollAmount(chosenExpr)
  const loss = lossInfo.total
  const newSan = Math.max(0, san - loss)
  const triggerInsanity = loss >= 5
  const madnessRoll = triggerInsanity ? (Math.floor(Math.random() * 10) + 1) : null

  const sheetName = sheet.name?.trim() || '未命名角色'
  const text =
    `【理智检定】「${sheetName}」进行理智检定（当前SAN ${san}）：` + `1d100 = ${value}，${result}，失去 ${loss} 点SAN`

  const patch = triggerInsanity
    ? { sanCurrent: newSan, temporaryInsanity: true }
    : { sanCurrent: newSan }
  await updateCharacterById(charId, patch)
  await sendSystemMessage(text)
  if (triggerInsanity && madnessRoll != null) {
    await logImmediateInsanity(sheetName, madnessRoll)
  }
}

async function handleLocalMadness(meta, value) {
  // 请求检定必须通过目标角色判定
  const charId = meta.targetCharacterId
  if (!charId) return

  const sheet = await getCharacterSheet(charId)
  if (!sheet) return
  const sheetName = sheet.name?.trim() || '未命名角色'

  await logImmediateInsanity(sheetName, value)
}

/**
 * 依据 D10 掷骰结果记录一次立即性疯狂症状
 */
async function logImmediateInsanity(sheetName, rollValue) {
  const id = Math.min(Math.max(Math.floor(Number(rollValue)), 1), 10)
  const entry = IMMEDIATE_INSANITY_TABLE.find((item) => item.id === id)
  const symptom = entry ? entry.title : '出现了一种难以言喻的疯狂症状'
  const text = `【疯狂症状】「${sheetName}」抽取到：${symptom}（D10 = ${rollValue}）`
  await sendSystemMessage(text)
}

onMounted(async () => {
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
        const list = (res.list || []).filter((x) => x.status === ROOM_CHARACTER_STATUS.ACCEPTED)
        const ids = [...new Set(list.map((x) => x.characterId).filter(Boolean))]
        if (ids.length && charactersStore.fetchCharactersByIds) {
          await charactersStore.fetchCharactersByIds(ids)
        }
        const members = list.map((item) => {
          const raw = item.characterId ? charactersStore.getById(item.characterId) : null
          const sheet = raw ? charactersStore.normalizeCharacter(raw) : null
          return {
            userId: item.userId,
            characterId: item.characterId,
            characterName: sheet?.name?.trim() || '未命名角色',
          }
        })
        roomMembers.value = members
      }
    } catch (e) {
      // ignore
    }
  }

  // 无论是否房主，都加载已通过的绑定关系，用于“点头像看角色卡”
  await loadRoomAcceptedMembers()
})

</script>

