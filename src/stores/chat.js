import { ref, computed, shallowRef } from 'vue'
import { useSocket, mockReceiveMessage } from '../services/socket'
import { apiGet } from '../services/api'
import { useAuthStore } from '../stores/auth'

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

const socket = shallowRef(null)

export function useChatStore() {
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
    return [...list].sort((a, b) => a.time - b.time)
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
      const res = await apiGet('/channels')
      if (res?.ok) {
        if (Array.isArray(res.channels)) channels.value = res.channels
        if (Array.isArray(res.modules)) modules.value = res.modules
      }
      return res
    } catch {
      return { ok: false, message: '网络错误：无法获取频道列表' }
    }
  }

  async function fetchMessages(channelId, params = {}) {
    try {
      const q = new URLSearchParams()
      if (params.limit != null) q.set('limit', params.limit)
      if (params.before != null) q.set('before', params.before)
      const path = `/channels/${channelId}/messages` + (q.toString() ? `?${q.toString()}` : '')
      const res = await apiGet(path)
      if (res?.ok && Array.isArray(res.messages)) {
        messagesByChannel.value[channelId] = res.messages.map((m) => ({
          ...m,
          time: typeof m.time === 'number' ? m.time : (m.time ? new Date(m.time).getTime() : Date.now()),
        }))
      }
      return res
    } catch {
      return { ok: false, message: '网络错误：无法获取消息列表' }
    }
  }

  function initSocket() {
    if (socket.value) return
    const auth = useAuthStore()
    if (auth.user?.value?.username) {
      currentUser.value = { ...currentUser.value, id: auth.user.value.username, name: auth.user.value.username }
    }
    const s = useSocket()
    socket.value = s
    // 仅当配置了后端 Socket 地址时才拉取频道列表，避免未启动后端时触发代理报错
    if (import.meta.env.VITE_SOCKET_URL) {
      fetchChannels()
    }
    s.on('message', (msg) => {
      // 自己发出的消息已在 sendMessage 中加入列表，避免 Mock 或服务端回显时重复添加
      if (msg.userId === currentUser.value.id) return
      const channelId = msg.channelId || currentChannelId.value
      if (!messagesByChannel.value[channelId]) messagesByChannel.value[channelId] = []
      messagesByChannel.value[channelId].push({
        id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        userId: msg.userId,
        userName: msg.userName || '未知',
        content: msg.content,
        time: msg.time || Date.now(),
        type: msg.type || 'text',
      })
    })
    s.on('connect', () => {
      if (import.meta.env.DEV) console.log('[Socket] 已连接')
    })
    s.on('disconnect', () => {
      if (import.meta.env.DEV) console.log('[Socket] 已断开')
    })
  }

  function sendMessage(content) {
    const channelId = currentChannelId.value
    const mod = getCurrentModule()
    const isKP = mod && mod.ownerId === currentUser.value.id
    const msg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      channelId,
      userId: currentUser.value.id,
      userName: currentUser.value.name,
      content: content.trim(),
      time: Date.now(),
      type: 'text',
    }
    if (isKP) {
      const role = speakerRoleInChannel.value
      if (role === 'kp') {
        msg.speakerRole = 'kp'
      } else if (role.startsWith('npc-')) {
        const mod = getCurrentModule()
        const npcs = mod ? moduleNPCs.value[mod.id] || [] : []
        const npc = npcs.find((n) => n.id === role)
        msg.speakerRole = 'npc'
        msg.speakerNpcId = npc?.id
        msg.speakerNpcName = npc?.name || 'NPC'
      }
    }
    if (!messagesByChannel.value[channelId]) messagesByChannel.value[channelId] = []
    messagesByChannel.value[channelId].push(msg)

    if (socket.value && socket.value.connected) {
      socket.value.emit('message', msg)
    } else {
      // Mock: 模拟对方回复
      setTimeout(() => {
        mockReceiveMessage({
          ...msg,
          id: `msg-${Date.now()}-bot`,
          userId: 'bot',
          userName: '小助手',
          content: `收到：「${msg.content}」`,
          time: Date.now(),
        })
      }, 500)
    }
  }

  function isDirectMessageChannelId(id) {
    return typeof id === 'string' && id.startsWith('dm:')
  }

  function setChannel(id) {
    currentChannelId.value = id

    // 私聊频道不走 HTTP 拉消息（避免后端未启动/未实现 DM 接口时 fetch 报错）
    if (isDirectMessageChannelId(id)) {
      if (!messagesByChannel.value[id]) messagesByChannel.value[id] = []
      if (socket.value && typeof socket.value.emit === 'function') {
        socket.value.emit('join', { channelId: id })
      }
      return
    }

    fetchMessages(id, { limit: 50 }).catch(() => {})
    if (socket.value && typeof socket.value.emit === 'function') {
      socket.value.emit('join', { channelId: id })
    }
  }

  /** 打开/创建一个私聊频道（DM）并切换到该频道 */
  function openDirectMessage(friend) {
    const peerId = friend?.id || friend?.userId
    const peerName = friend?.name || friend?.userName || '私聊'
    if (!peerId) return null
    const id = `dm:${peerId}`

    if (!directChannels.value.some((c) => c.id === id)) {
      directChannels.value = [
        ...directChannels.value,
        { id, name: peerName, icon: 'mdi:account', peerId },
      ]
    }
    if (!messagesByChannel.value[id]) {
      messagesByChannel.value[id] = [
        { id: `sys-${Date.now()}`, userId: 'system', userName: '系统', content: `开始与「${peerName}」的私聊`, time: Date.now(), type: 'system' },
      ]
    }

    setChannel(id)
    return id
  }

  /** 修改当前用户昵称 */
  function updateNickname(name) {
    const trimmed = (name || '').trim()
    if (trimmed) currentUser.value.name = trimmed
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
