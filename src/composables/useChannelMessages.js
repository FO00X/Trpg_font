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
      const { ok, rows, error: err } = await fetchChannelMessagesRaw(channelId, { limit: 200 })
      if (!ok) {
        error.value = err?.message || '加载消息失败'
        return
      }
      const userIds = [...new Set((rows || []).map((r) => r.user_id).filter(Boolean))]
      const profileMap = userIds.length > 0 ? await profileCache.getProfiles(userIds) : new Map()
      const rowsWithAvatar = (rows || []).map((row) => ({
        ...row,
        user_avatar: row.user_id ? profileMap.get(row.user_id)?.avatar ?? null : null,
      }))
      const me = auth.user?.value
      const currentUserId = me?.id
      messages.value = rowsWithAvatar.map((row) => normalizeMessageRow(row, currentUserId))
    } finally {
      loading.value = false
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
      .subscribe()
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
      loadMessages()
      setupRealtime()
    }
  )

  return {
    messages,
    loading,
    error,
    reload,
  }
}

