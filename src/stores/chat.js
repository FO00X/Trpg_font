import { ref, computed, shallowRef } from 'vue'
import { useSocket, mockReceiveMessage } from '../services/socket'

// 频道列表（大厅等）
const channels = ref([
  { id: 'general', name: '大厅', icon: 'mdi:home', unread: 0 },
])

// 子频道用户权限：userAccess[userId] = 'none' | 'readonly' | 'full'
// none=禁止进入, readonly=仅进入, full=可发言；未配置用户默认 full
// 加入的模组（跑团内展示），KP 为 ownerId（守密人/拥有人）
const modules = ref([
  {
    id: 'wangdie',
    name: '亡蝶葬仪',
    icon: 'mdi:butterfly',
    unread: 0,
    ownerId: 'me',
    subChannels: [
      { id: 'wangdie-1', name: '调查组', userAccess: {} },
      { id: 'wangdie-2', name: '讨论组', userAccess: {} },
    ],
  },
  {
    id: 'zhivo',
    name: '致我不灭的',
    icon: 'mdi:fire',
    unread: 0,
    ownerId: 'me',
    subChannels: [
      { id: 'zhivo-1', name: '主频道', userAccess: {} },
    ],
  },
])

// 当前选中的频道
const currentChannelId = ref('general')

// 消息列表 { channelId -> messages[] }（general 或子频道 id）
const messagesByChannel = ref({
  general: [
    { id: '1', userId: 'system', userName: '系统', content: '欢迎使用 FOXTrpg。请在下方输入消息并发送。', time: Date.now() - 3600000, type: 'system' },
  ],
  'wangdie-1': [],
  'wangdie-2': [],
  'zhivo-1': [],
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

const socket = shallowRef(null)

export function useChatStore() {
  const currentChannel = computed(() => {
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

  function initSocket() {
    if (socket.value) return
    const s = useSocket()
    socket.value = s
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
    const msg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      channelId,
      userId: currentUser.value.id,
      userName: currentUser.value.name,
      content: content.trim(),
      time: Date.now(),
      type: 'text',
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

  function setChannel(id) {
    currentChannelId.value = id
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

  return {
    channels,
    modules,
    currentChannelId,
    currentChannel,
    currentMessages,
    currentUser,
    onlineUsers,
    initSocket,
    sendMessage,
    setChannel,
    updateNickname,
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
