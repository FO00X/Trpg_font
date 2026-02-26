import { ref, computed, shallowRef, watch } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import { useProfileCache } from '../stores/profileCache'

// 频道列表（大厅等）与模组/子频道，由 fetchChannels 从后端拉取
const channels = ref([{ id: 'general', name: '大厅', icon: 'mdi:home', unread: 0 }])
const modules = ref([])

// 私聊频道（DM）：本地维护，不依赖后端 channels 列表
// 结构：{ id: `dm:${peerId}`, name: peerName, icon, peerId }
const directChannels = ref([])

// 当前选中的频道
const currentChannelId = ref('general')

// 消息列表 { channelId -> messages[] }，由 fetchMessages 与 Socket 填充
const messagesByChannel = ref({
  general: [
    { id: '1', userId: 'system', userName: '系统', content: '欢迎使用 FOXTrpg。请在下方输入消息并发送。', time: Date.now() - 3600000, type: 'system' },
  ],
})

// 当前用户（可后续接登录）
const currentUser = ref({
  id: 'me',
  name: '我',
  avatar: null,
})

// 在线用户 Mock
const onlineUsers = ref([
  { id: 'u1', name: '熊猫', status: 'online' },
  { id: 'u2', name: '田中', status: 'online' },
  { id: 'u3', name: '方糕', status: 'online' },
  { id: 'u4', name: '言安', status: 'online' },
])

// 子频道内玩家选中的角色：{ [channelId]: { [userId]: characterId | null } }
const subChannelMemberCharacter = ref({})

// KP 在当前子频道的发言身份：'kp' 或 'npc-{id}'（NPC 由 KP 在模组设置等处添加，此处仅选择）
const speakerRoleInChannel = ref('kp')

// 各模组下 KP 添加的 NPC 列表，供发言身份选择。{ [moduleId]: [ { id, name } ] }
const moduleNPCs = ref({})

const realtimeChannel = shallowRef(null)

// 当前私聊对方资料（用于消息列表显示头像与用户名）
const dmPeerProfile = ref(null)

export function useChatStore() {
  const profileCache = useProfileCache()

  const currentChannel = computed(() => {
    const dm = directChannels.value.find((c) => c.id === currentChannelId.value)
    if (dm) return dm
    const fromChannels = channels.value.find((c) => c.id === currentChannelId.value)
    if (fromChannels) return fromChannels
    const sub = getSubChannelById(currentChannelId.value)
    if (sub) return { id: sub.id, name: sub.name, icon: 'mdi:forum', unread: 0 }
    return channels.value[0]
  })

  /** 根据子频道 id 找到子频道对象（含所属模组） */
  function getSubChannelById(subChannelId) {
    for (const mod of modules.value) {
      const sub = mod.subChannels.find((s) => s.id === subChannelId)
      if (sub) return sub
    }
    return null
  }

  /** 当前用户是否为某模组的 KP（拥有人/守密人） */
  function isModuleKP(moduleId) {
    const mod = modules.value.find((m) => m.id === moduleId)
    return mod && mod.ownerId === currentUser.value.id
  }

  /** 当前子频道所属模组（非子频道返回 null） */
  function getCurrentModule() {
    const channelId = currentChannelId.value
    for (const mod of modules.value) {
      if (mod.subChannels?.some((s) => s.id === channelId)) return mod
    }
    return null
  }

  /** 当前用户是否为当前子频道的 KP（在跑团频道右上角固定显示为 KP、不切换角色卡） */
  const isCurrentChannelKP = computed(() => {
    const mod = getCurrentModule()
    return mod && mod.ownerId === currentUser.value.id
  })

  /** 当前模组下的 NPC 列表（KP 在别处添加，此处仅用于发言身份选择） */
  const currentModuleNPCs = computed(() => {
    const mod = getCurrentModule()
    if (!mod) return []
    return moduleNPCs.value[mod.id] || []
  })

  /** KP 设置当前子频道发言身份：'kp' 或 'npc-{id}' */
  function setSpeakerRole(role) {
    if (role === 'kp' || (typeof role === 'string' && role.startsWith('npc-'))) {
      speakerRoleInChannel.value = role
    }
  }

  /** KP 为模组添加 NPC（上传/添加在别处调用，此处仅提供方法） */
  function addModuleNPC(moduleId, { id, name }) {
    const mod = modules.value.find((m) => m.id === moduleId)
    if (!mod || mod.ownerId !== currentUser.value.id) return
    const list = moduleNPCs.value[moduleId] || []
    const next = list.some((n) => n.id === id) ? list.map((n) => (n.id === id ? { id, name: name || n.name } : n)) : [...list, { id: id || `npc-${Date.now()}`, name: name || '未命名' }]
    moduleNPCs.value = { ...moduleNPCs.value, [moduleId]: next }
  }

  /** KP 移除模组下某 NPC */
  function removeModuleNPC(moduleId, npcId) {
    const list = (moduleNPCs.value[moduleId] || []).filter((n) => n.id !== npcId)
    moduleNPCs.value = { ...moduleNPCs.value, [moduleId]: list }
  }

  /** 当前用户是否可进入该子频道（未配置视为 full） */
  function canEnterSubChannel(subChannel) {
    if (!subChannel) return false
    const level = (subChannel.userAccess || {})[currentUser.value.id] ?? 'full'
    return level === 'readonly' || level === 'full'
  }

  /** 当前用户在该子频道是否可发言（未配置视为 full） */
  function canSpeakInSubChannel(subChannel) {
    if (!subChannel) return false
    const level = (subChannel.userAccess || {})[currentUser.value.id] ?? 'full'
    return level === 'full'
  }

  /** 某模组下当前用户可见的子频道列表（可进入或可发言） */
  function visibleSubChannels(moduleId) {
    const mod = modules.value.find((m) => m.id === moduleId)
    if (!mod || !mod.subChannels) return []
    return mod.subChannels.filter((s) => canEnterSubChannel(s))
  }

  /** 当前频道是否为子频道且当前用户不可发言（用于禁用输入框） */
  function isCurrentChannelReadOnly() {
    const sub = getSubChannelById(currentChannelId.value)
    return sub ? !canSpeakInSubChannel(sub) : false
  }

  /** KP：创建子频道 */
  function createSubChannel(moduleId, name) {
    const mod = modules.value.find((m) => m.id === moduleId)
    if (!mod || mod.ownerId !== currentUser.value.id) return null
    const id = `${moduleId}-${Date.now()}`
    const sub = { id, name: (name || '').trim() || '未命名', userAccess: {} }
    mod.subChannels.push(sub)
    if (!messagesByChannel.value[id]) messagesByChannel.value[id] = []
    return sub
  }

  /** KP：更新子频道用户权限 userAccess: { [userId]: 'none' | 'readonly' | 'full' } */
  function updateSubChannelAccess(subChannelId, { userAccess }) {
    const sub = getSubChannelById(subChannelId)
    if (!sub) return
    const mod = modules.value.find((m) => m.subChannels.some((s) => s.id === subChannelId))
    if (!mod || mod.ownerId !== currentUser.value.id) return
    if (userAccess && typeof userAccess === 'object') sub.userAccess = { ...userAccess }
  }

  const currentMessages = computed(() => {
    const list = messagesByChannel.value[currentChannelId.value] || []
    const byId = new Map()
    list.forEach((m) => byId.set(m.id, m))
    return [...byId.values()].sort((a, b) => a.time - b.time)
  })

  /** 当前频道是否为子频道（跑团频道） */
  const isSubChannel = computed(() => !!getSubChannelById(currentChannelId.value))

  /** 当前跑团频道内的玩家列表（含玩家名与选中的角色 id），仅子频道有值 */
  const currentChannelMembers = computed(() => {
    const channelId = currentChannelId.value
    if (!getSubChannelById(channelId)) return []
    const map = subChannelMemberCharacter.value[channelId] || {}
    const members = []
    const add = (user) => {
      members.push({
        userId: user.id,
        userName: user.name,
        characterId: map[user.id] ?? null,
      })
    }
    add(currentUser.value)
    onlineUsers.value.forEach(add)
    return members
  })

  async function fetchChannels() {
    try {
      const [chRes, modRes] = await Promise.all([
        supabase.from('channels').select('id, name, icon'),
        supabase.from('modules').select('id, name, icon, owner_id, sub_channels'),
      ])
      if (chRes.data) {
        channels.value = (chRes.data || []).map((c) => ({ ...c, unread: 0 }))
      }
      if (modRes.data) {
        modules.value = (modRes.data || []).map((m) => ({
          id: m.id,
          name: m.name,
          icon: m.icon,
          ownerId: m.owner_id,
          subChannels: m.sub_channels || [],
        }))
      }
      return { ok: true }
    } catch {
      return { ok: false, message: '网络错误：无法获取频道列表' }
    }
  }

  async function fetchMessages(channelId, params = {}) {
    try {
      const limit = params.limit ?? 50
      let q = supabase
        .from('messages')
        .select('id, channel_id, user_id, user_name, content, type, speaker_role, speaker_npc_id, speaker_npc_name, created_at')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
        .limit(limit)
      if (params.before) {
        const { data: beforeRow } = await supabase.from('messages').select('created_at').eq('id', params.before).single()
        if (beforeRow) q = q.lt('created_at', beforeRow.created_at)
      }
      const { data, error } = await q
      if (error) return { ok: false, message: error.message }
      messagesByChannel.value[channelId] = (data || []).map((m) => ({
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
      return { ok: true, messages: messagesByChannel.value[channelId] }
    } catch {
      return { ok: false, message: '网络错误：无法获取消息列表' }
    }
  }

  function initSocket() {
    if (realtimeChannel.value) return
    const auth = useAuthStore()
    function syncCurrentUser() {
      const u = auth.user?.value
      if (u?.id) {
        currentUser.value = { id: u.id, name: u.username || u.email?.split('@')[0] || '我', avatar: u.avatar || null }
      }
    }
    syncCurrentUser()
    watch(
      () => [auth.user?.value?.id, auth.user?.value?.username, auth.user?.value?.avatar],
      syncCurrentUser,
      { immediate: false }
    )
    fetchChannels()
    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const row = payload.new
          const channelId = row.channel_id
          if (!channelId) return
          const myId = currentUser.value?.id
          if (row.user_id === myId) return
          if (channelId.startsWith('dm:')) {
            const parts = channelId.split(':')
            if (parts.length >= 3 && parts[1] && parts[2]) {
              if (myId !== parts[1] && myId !== parts[2]) return
            }
          }
          if (!messagesByChannel.value[channelId]) messagesByChannel.value[channelId] = []
          messagesByChannel.value[channelId].push({
            id: row.id,
            userId: row.user_id || 'system',
            userName: row.user_name || '未知',
            content: row.content,
            time: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
            type: row.type || 'text',
            speakerRole: row.speaker_role,
            speakerNpcId: row.speaker_npc_id,
            speakerNpcName: row.speaker_npc_name,
          })
        }
      )
      .subscribe()
    realtimeChannel.value = channel
  }

  async function sendMessage(content) {
    const channelId = currentChannelId.value
    const mod = getCurrentModule()
    const uid = currentUser.value.id
    const validUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid)
    const isKP = mod && mod.ownerId === currentUser.value.id
    const payload = {
      channel_id: channelId,
      user_id: validUuid ? uid : null,
      user_name: currentUser.value.name,
      content: content.trim(),
      type: 'text',
    }
    if (isKP) {
      const role = speakerRoleInChannel.value
      if (role === 'kp') {
        payload.speaker_role = 'kp'
      } else if (role.startsWith('npc-')) {
        const npcs = mod ? moduleNPCs.value[mod.id] || [] : []
        const npc = npcs.find((n) => n.id === role)
        payload.speaker_role = 'npc'
        payload.speaker_npc_id = npc?.id
        payload.speaker_npc_name = npc?.name || 'NPC'
      }
    }
    const { data, error } = await supabase.from('messages').insert(payload).select('id, created_at').single()
    if (error) return
    const msg = {
      id: data.id,
      userId: currentUser.value.id,
      userName: currentUser.value.name,
      content: payload.content,
      time: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
      type: 'text',
      speakerRole: payload.speaker_role,
      speakerNpcId: payload.speaker_npc_id,
      speakerNpcName: payload.speaker_npc_name,
    }
    if (!messagesByChannel.value[channelId]) messagesByChannel.value[channelId] = []
    messagesByChannel.value[channelId].push(msg)
  }

  function isDirectMessageChannelId(id) {
    return typeof id === 'string' && id.startsWith('dm:')
  }

  /** 私聊频道 id：两人共用同一 channel，便于拉取历史与 Realtime */
  function getDmChannelId(uid1, uid2) {
    if (!uid1 || !uid2) return null
    const parts = [uid1, uid2].sort()
    return `dm:${parts[0]}:${parts[1]}`
  }

  function setChannel(id) {
    currentChannelId.value = id

    if (isDirectMessageChannelId(id)) {
      if (!messagesByChannel.value[id]) messagesByChannel.value[id] = []
      fetchMessages(id, { limit: 50 }).catch(() => {})
      ensureDmChannelPeerInfo(id)
      return
    }

    dmPeerProfile.value = null
    fetchMessages(id, { limit: 50 }).catch(() => {})
  }

  /** 根据私聊 channelId 解析对方 id，从 profileCache 拉取用户名和头像，更新 directChannels 并设置 dmPeerProfile */
  async function ensureDmChannelPeerInfo(channelId) {
    if (!isDirectMessageChannelId(channelId)) return
    const parts = channelId.split(':')
    if (parts.length < 3 || !parts[1] || !parts[2]) return
    const myId = currentUser.value?.id
    if (!myId) return
    const peerId = myId === parts[1] ? parts[2] : parts[1]
    const profile = await profileCache.getProfile(peerId)
    const name = profile?.username || profile?.id?.slice(0, 8) + '…' || '私聊'
    const avatar = profile?.avatar || null
    dmPeerProfile.value = { id: peerId, username: name, avatar }

    const existing = directChannels.value.find((c) => c.id === channelId)
    if (existing) {
      existing.name = name
      existing.avatar = avatar
    } else {
      directChannels.value = [
        ...directChannels.value,
        { id: channelId, name, icon: 'mdi:account', peerId, avatar },
      ]
    }
  }

  /** 打开/创建一个私聊频道（DM）并切换到该频道；优先使用传入的 name/avatar，否则从 profileCache 拉取 */
  function openDirectMessage(friend) {
    const peerId = friend?.id || friend?.userId
    const peerName = (friend?.name || friend?.userName || '').trim() || '私聊'
    if (!peerId) return null
    const myId = currentUser.value?.id
    if (!myId) return null
    const id = getDmChannelId(myId, peerId) || `dm:${peerId}`

    if (!directChannels.value.some((c) => c.id === id)) {
      directChannels.value = [
        ...directChannels.value,
        { id, name: peerName, icon: 'mdi:account', peerId, avatar: friend?.avatar ?? null },
      ]
    } else {
      const existing = directChannels.value.find((c) => c.id === id)
      if (existing) {
        existing.name = peerName
        existing.avatar = friend?.avatar ?? existing.avatar
      }
    }
    if (!messagesByChannel.value[id]) {
      messagesByChannel.value[id] = []
    }

    setChannel(id)
    return id
  }

  /** 修改当前用户昵称（会写入 Supabase profiles，好友通过此用户名搜索到你） */
  async function updateNickname(name) {
    const trimmed = (name || '').trim()
    if (!trimmed) return { ok: false, message: '请输入昵称' }
    const auth = useAuthStore()
    const res = await auth.updateProfileUsername(trimmed)
    if (res.ok) currentUser.value.name = trimmed
    return res
  }

  /** 退出登录：重置为默认用户（后续可接真实登出逻辑） */
  function logout() {
    currentUser.value = {
      id: 'me',
      name: '我',
      avatar: null,
    }
  }

  /** 设置当前用户在当前子频道选中的角色（后续可接持久化/同步） */
  function setMyCharacterInChannel(characterId) {
    const channelId = currentChannelId.value
    if (!getSubChannelById(channelId)) return
    const prev = subChannelMemberCharacter.value[channelId] || {}
    subChannelMemberCharacter.value = {
      ...subChannelMemberCharacter.value,
      [channelId]: { ...prev, [currentUser.value.id]: characterId || null },
    }
  }

  return {
    channels,
    modules,
    directChannels,
    currentChannelId,
    currentChannel,
    currentMessages,
    currentUser,
    dmPeerProfile,
    ensureDmChannelPeerInfo,
    onlineUsers,
    subChannelMemberCharacter,
    speakerRoleInChannel,
    isSubChannel,
    currentChannelMembers,
    isCurrentChannelKP,
    getCurrentModule,
    fetchChannels,
    fetchMessages,
    initSocket,
    sendMessage,
    setChannel,
    openDirectMessage,
    updateNickname,
    setMyCharacterInChannel,
    setSpeakerRole,
    currentModuleNPCs,
    moduleNPCs,
    addModuleNPC,
    removeModuleNPC,
    logout,
    getSubChannelById,
    isModuleKP,
    canEnterSubChannel,
    canSpeakInSubChannel,
    visibleSubChannels,
    isCurrentChannelReadOnly,
    createSubChannel,
    updateSubChannelAccess,
  }
}
