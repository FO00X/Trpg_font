import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './auth'

const list = ref([])
const unreadCount = ref(0)

export function useNotificationsStore() {
  const auth = useAuthStore()

  async function fetchList() {
    const uid = auth.user?.value?.id
    if (!uid) return { ok: false, message: '未登录' }
    const { data, error } = await supabase
      .from('notifications')
      .select('id, type, title, content, link, read, created_at')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    if (error) return { ok: false, message: error.message }
    list.value = (data || []).map((r) => ({
      id: r.id,
      type: r.type || 'system',
      title: r.title || '',
      content: r.content || '',
      link: r.link || null,
      read: !!r.read,
      created_at: r.created_at,
    }))
    unreadCount.value = list.value.filter((n) => !n.read).length
    return { ok: true, list: list.value }
  }

  async function fetchUnreadCount() {
    const uid = auth.user?.value?.id
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
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id).eq('user_id', uid)
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
    const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', uid).eq('read', false)
    if (error) return { ok: false, message: error.message }
    list.value.forEach((n) => { n.read = true })
    unreadCount.value = 0
    return { ok: true }
  }

  return { list, unreadCount, fetchList, fetchUnreadCount, markAsRead, markAllRead }
}
