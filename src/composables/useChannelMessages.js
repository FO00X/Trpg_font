import { ref, watch, onMounted, onUnmounted, unref } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import { useProfileCache } from '../stores/profileCache'
import { normalizeMessageRow, fetchChannelMessagesRaw } from '../services/messagesService'

/**
 * 通用频道消息流 composable：
 * - 负责按 channelId 加载最近消息
 * - 管理 Supabase Realtime 订阅
 * - 暴露标准化后的消息列表与 loading/error 状态
 *
 * @param {import('vue').Ref<string> | import('vue').ComputedRef<string> | string} channelIdRef
 * @param {{ onNewMessage?: (msg: any) => void }} options
 */
export function useChannelMessages(channelIdRef, options = {}) {
  const messages = ref([])
  const loading = ref(false)
  const error = ref(null)
  const hasMore = ref(true)
  const loadingMore = ref(false)

  const auth = useAuthStore()
  const profileCache = useProfileCache()
  let realtimeChannel = null

  function getChannelId() {
    return typeof channelIdRef === 'string' ? channelIdRef : unref(channelIdRef)
  }

  async function loadMessages() {
    const channelId = getChannelId()
    if (!channelId) return
    loading.value = true
    error.value = null
    try {
      // 首次加载：取最近一页消息
      const { ok, rows, error: err } = await fetchChannelMessagesRaw(channelId, { limit: 100 })
      if (!ok) {
        error.value = err?.message || '加载消息失败'
        return
      }
      const orderedRows = [...(rows || [])].reverse() // 转为时间正序，便于 UI 渲染
      const userIds = [...new Set(orderedRows.map((r) => r.user_id).filter(Boolean))]
      const profileMap = userIds.length > 0 ? await profileCache.getProfiles(userIds) : new Map()
      const rowsWithAvatar = orderedRows.map((row) => ({
        ...row,
        user_avatar: row.user_id ? profileMap.get(row.user_id)?.avatar ?? null : null,
      }))
      const me = auth.user?.value
      const currentUserId = me?.id
      messages.value = rowsWithAvatar.map((row) => normalizeMessageRow(row, currentUserId))
      hasMore.value = (rows || []).length === 100
    } finally {
      loading.value = false
    }
  }

  // 向上加载更多历史消息（在当前最早一条之前）
  async function loadMore() {
    const channelId = getChannelId()
    if (!channelId) return
    if (loadingMore.value || loading.value || !hasMore.value) return
    const first = messages.value[0]
    if (!first) return

    loadingMore.value = true
    error.value = null
    try {
      const beforeIso = new Date(first.time).toISOString()
      const { ok, rows, error: err } = await fetchChannelMessagesRaw(channelId, {
        limit: 100,
        before: beforeIso,
      })
      if (!ok) {
        error.value = err?.message || '加载更多消息失败'
        return
      }
      if (!rows || rows.length === 0) {
        hasMore.value = false
        return
      }

      const orderedRows = [...rows].reverse() // 转为时间正序，便于 prepend
      const userIds = [...new Set(orderedRows.map((r) => r.user_id).filter(Boolean))]
      const profileMap = userIds.length > 0 ? await profileCache.getProfiles(userIds) : new Map()
      const rowsWithAvatar = orderedRows.map((row) => ({
        ...row,
        user_avatar: row.user_id ? profileMap.get(row.user_id)?.avatar ?? null : null,
      }))
      const me = auth.user?.value
      const currentUserId = me?.id
      const mapped = rowsWithAvatar.map((row) => normalizeMessageRow(row, currentUserId))

      messages.value = [...mapped, ...messages.value]
      if (rows.length < 100) {
        hasMore.value = false
      }
    } finally {
      loadingMore.value = false
    }
  }

  function setupRealtime() {
    cleanupRealtime()
    const channelId = getChannelId()
    if (!channelId) return

    realtimeChannel = supabase
      .channel(`channel-messages-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          const row = payload.new
          if (!row) return
          if (messages.value.some((m) => m.id === row.id)) return

          // 尝试从 profile 缓存补充头像与用户名，避免每条消息单独查库
          if (row.user_id) {
            try {
              const profile = await profileCache.getProfile(row.user_id)
              if (profile) {
                if (!row.user_name && profile.username) {
                  row.user_name = profile.username
                }
                if (!row.user_avatar && profile.avatar) {
                  row.user_avatar = profile.avatar
                }
              }
            } catch {
              // 忽略缓存读取错误，保持消息正常显示
            }
          }

          const me = auth.user?.value
          const currentUserId = me?.id
          const msg = normalizeMessageRow(row, currentUserId)
          messages.value.push(msg)

          if (typeof options.onNewMessage === 'function') {
            options.onNewMessage(msg)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          const old = payload.old
          if (old?.id) {
            messages.value = messages.value.filter((m) => m.id !== old.id)
          }
        }
      )
      .subscribe()
  }

  /**
   * 撤回消息：从数据库删除并在本地列表中移除（仅允许撤回自己发的消息，由 RLS 校验）
   */
  async function deleteMessage(messageId) {
    if (!messageId) return { ok: false, message: '无效消息' }
    const { error } = await supabase.from('messages').delete().eq('id', messageId)
    if (error) return { ok: false, message: error.message }
    messages.value = messages.value.filter((m) => m.id !== messageId)
    return { ok: true }
  }

  function cleanupRealtime() {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel)
      realtimeChannel = null
    }
  }

  async function reload() {
    await loadMessages()
  }

  onMounted(() => {
    loadMessages()
    setupRealtime()
  })

  onUnmounted(() => {
    cleanupRealtime()
  })

  watch(
    () => getChannelId(),
    () => {
      messages.value = []
      hasMore.value = true
      loadMessages()
      setupRealtime()
    }
  )

  return {
    messages,
    loading,
    loadingMore,
    error,
    reload,
    hasMore,
    loadMore,
    deleteMessage,
  }
}

