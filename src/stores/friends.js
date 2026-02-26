import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './auth'

const friends = ref([])
const pendingReceived = ref([])
const pendingSent = ref([])

export function useFriendsStore() {
  async function fetchFriends() {
    const auth = useAuthStore()
    const uid = auth.user?.value?.id
    if (!uid) return { ok: false, message: '未登录' }

    const { data: rows, error } = await supabase
      .from('friend_requests')
      .select('id, from_user_id, to_user_id, status, created_at')
      .eq('status', 'accepted')
      .or(`from_user_id.eq.${uid},to_user_id.eq.${uid}`)

    if (error) return { ok: false, message: error.message }

    const friendIds = (rows || []).map((r) => (r.from_user_id === uid ? r.to_user_id : r.from_user_id))
    if (friendIds.length === 0) {
      friends.value = []
      return { ok: true }
    }

    const { data: profiles } = await supabase.from('profiles').select('id, username, avatar').in('id', friendIds)
    const profileMap = new Map((profiles || []).map((p) => [p.id, p]))

    friends.value = friendIds.map((id) => {
      const profile = profileMap.get(id)
      return {
        id,
        name: profile?.username || id.slice(0, 8) + '…',
        avatar: profile?.avatar || null,
        status: 'offline',
        lastMsg: null,
        lastMsgTime: null,
      }
    })
    return { ok: true }
  }

  async function fetchPendingReceived() {
    const auth = useAuthStore()
    const uid = auth.user?.value?.id
    if (!uid) return { ok: false }

    const { data, error } = await supabase
      .from('friend_requests')
      .select('id, from_user_id, created_at')
      .eq('to_user_id', uid)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) return { ok: false, message: error.message }

    const fromIds = [...new Set((data || []).map((r) => r.from_user_id))]
    const { data: profiles } = await supabase.from('profiles').select('id, username, avatar').in('id', fromIds)
    const profileMap = new Map((profiles || []).map((p) => [p.id, p]))

    pendingReceived.value = (data || []).map((r) => {
      const profile = profileMap.get(r.from_user_id)
      return {
        id: r.id,
        from_user_id: r.from_user_id,
        from_name: profile?.username || r.from_user_id.slice(0, 8) + '…',
        from_avatar: profile?.avatar || null,
        created_at: r.created_at,
      }
    })
    return { ok: true }
  }

  async function fetchPendingSent() {
    const auth = useAuthStore()
    const uid = auth.user?.value?.id
    if (!uid) return { ok: false }

    const { data, error } = await supabase
      .from('friend_requests')
      .select('id, to_user_id, created_at')
      .eq('from_user_id', uid)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) return { ok: false, message: error.message }

    const toIds = [...new Set((data || []).map((r) => r.to_user_id))]
    const { data: profiles } = await supabase.from('profiles').select('id, username, avatar').in('id', toIds)
    const profileMap = new Map((profiles || []).map((p) => [p.id, p]))

    pendingSent.value = (data || []).map((r) => {
      const profile = profileMap.get(r.to_user_id)
      return {
        id: r.id,
        to_user_id: r.to_user_id,
        to_name: profile?.username || r.to_user_id.slice(0, 8) + '…',
        to_avatar: profile?.avatar || null,
        created_at: r.created_at,
      }
    })
    return { ok: true }
  }

  /** 通过邮箱或用户名查找用户 id（先查 profiles.username，再查 auth 需 service 端） */
  async function findUserByUsernameOrEmail(input) {
    const trimmed = (input || '').trim()
    if (!trimmed) return { ok: false, message: '请输入用户名或邮箱' }

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, username')
      .ilike('username', trimmed)

    if (error) return { ok: false, message: error.message }
    if (!profiles?.length) return { ok: false, message: '未找到该用户' }
    if (profiles.length > 1) return { ok: false, message: '请输入更精确的用户名' }

    return { ok: true, user: { id: profiles[0].id, name: profiles[0].username } }
  }

  /** 发送好友请求 */
  async function sendFriendRequest(toUserId) {
    const auth = useAuthStore()
    const uid = auth.user?.value?.id
    if (!uid) return { ok: false, message: '未登录' }
    if (toUserId === uid) return { ok: false, message: '不能添加自己为好友' }

    const { error } = await supabase.from('friend_requests').insert({
      from_user_id: uid,
      to_user_id: toUserId,
      status: 'pending',
    })

    if (error) {
      if (error.code === '23505') return { ok: false, message: '已发送过请求或已是好友' }
      return { ok: false, message: error.message }
    }
    await fetchPendingSent()
    return { ok: true }
  }

  /** 同意好友请求 */
  async function acceptRequest(requestId) {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId)
      .eq('to_user_id', useAuthStore().user?.value?.id)

    if (error) return { ok: false, message: error.message }
    await fetchFriends()
    await fetchPendingReceived()
    return { ok: true }
  }

  /** 拒绝好友请求 */
  async function rejectRequest(requestId) {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId)
      .eq('to_user_id', useAuthStore().user?.value?.id)

    if (error) return { ok: false, message: error.message }
    await fetchPendingReceived()
    return { ok: true }
  }

  /** 删除好友（或取消待处理请求） */
  async function removeFriend(friendId) {
    const auth = useAuthStore()
    const uid = auth.user?.value?.id
    if (!uid) return { ok: false, message: '未登录' }

    const { error } = await supabase
      .from('friend_requests')
      .delete()
      .or(`and(from_user_id.eq.${uid},to_user_id.eq.${friendId}),and(from_user_id.eq.${friendId},to_user_id.eq.${uid})`)

    if (error) return { ok: false, message: error.message }
    friends.value = friends.value.filter((f) => f.id !== friendId)
    return { ok: true }
  }

  /** 取消已发送的请求 */
  async function cancelSentRequest(requestId) {
    const { error } = await supabase
      .from('friend_requests')
      .delete()
      .eq('id', requestId)
      .eq('from_user_id', useAuthStore().user?.value?.id)

    if (error) return { ok: false, message: error.message }
    await fetchPendingSent()
    return { ok: true }
  }

  return {
    friends,
    pendingReceived,
    pendingSent,
    fetchFriends,
    fetchPendingReceived,
    fetchPendingSent,
    findUserByUsernameOrEmail,
    sendFriendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
    cancelSentRequest,
  }
}
