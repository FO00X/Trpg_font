import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './auth'

// 模块级状态，保证全局单例
const list = ref([])
const unreadCount = ref(0)

export function useNotificationsStore() {
  const auth = useAuthStore()

  async function ensureUid() {
    let uid = auth.user?.value?.id
    if (uid) return uid

    const { data } = await supabase.auth.getUser()
    uid = data?.user?.id

    if (uid && !auth.user?.value && data?.user) {
      auth.user.value = {
        id: uid,
        email: data.user.email,
        username: data.user.email?.split('@')[0] || uid,
      }
    }
    return uid
  }

  async function fetchList() {
    const uid = await ensureUid()
    if (!uid) return { ok: false, message: '未登录' }

    const { data, error } = await supabase
      .from('notifications')
      .select('id, type, title, content, link, read, created_at, decision')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })

    if (error) return { ok: false, message: error.message }

    const rows = Array.isArray(data) ? data : []
    const seen = new Set()
    const normalized = []

    for (const r of rows) {
      const id = r?.id
      if (!id || seen.has(id)) continue
      seen.add(id)
      normalized.push({
        id,
        type: r.type || 'system',
        title: r.title || '',
        content: r.content || '',
        link: r.link || null,
        read: !!r.read,
        decision: r.decision || null,
        created_at: r.created_at,
      })
    }

    list.value = normalized
    unreadCount.value = list.value.filter((n) => !n.read).length

    return { ok: true, list: list.value }
  }

  async function fetchUnreadCount() {
    const uid = await ensureUid()
    if (!uid) return 0

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', uid)
      .eq('read', false)

    if (error) return 0

    unreadCount.value = count ?? 0
    return unreadCount.value
  }

  async function markAsRead(id) {
    const uid = auth.user?.value?.id
    if (!uid) return { ok: false, message: '未登录' }

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', uid)

    if (error) return { ok: false, message: error.message }

    const n = list.value.find((x) => x.id === id)
    if (n && !n.read) {
      n.read = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }

    return { ok: true }
  }

  async function markAllRead() {
    const uid = auth.user?.value?.id
    if (!uid) return { ok: false, message: '未登录' }

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', uid)
      .eq('read', false)
      .neq('type', 'room_apply')

    if (error) return { ok: false, message: error.message }

    list.value.forEach((n) => {
      if (n.type !== 'room_apply') {
        n.read = true
      }
    })
    unreadCount.value = list.value.filter((n) => !n.read).length

    return { ok: true }
  }

  async function setDecision(id, decision) {
    const uid = auth.user?.value?.id
    if (!uid) return { ok: false, message: '未登录' }

    const { error } = await supabase
      .from('notifications')
      .update({ decision, read: true })
      .eq('id', id)
      .eq('user_id', uid)

    if (error) return { ok: false, message: error.message }

    const n = list.value.find((x) => x.id === id)
    if (n) {
      n.decision = decision
      if (!n.read) {
        n.read = true
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
    }

    return { ok: true }
  }

  return { list, unreadCount, fetchList, fetchUnreadCount, markAsRead, markAllRead, setDecision }
}