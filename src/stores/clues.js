import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './auth'

const listByRoom = ref({})

export function useCluesStore() {
  const auth = useAuthStore()

  async function fetchList(roomId) {
    const uid = auth.user?.value?.id
    if (!uid) return { ok: false, message: '未登录' }
    const { data, error } = await supabase
      .from('room_clues')
      .select('id, room_id, user_id, title, content, images, created_at, updated_at')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
    if (error) return { ok: false, message: error.message }
    const clues = (data || []).map((r) => ({
      id: r.id,
      roomId: r.room_id,
      userId: r.user_id,
      title: r.title || '',
      content: r.content || '',
      images: r.images || [],
      created_at: r.created_at,
      updated_at: r.updated_at,
    }))
    listByRoom.value[roomId] = clues
    return { ok: true, list: clues }
  }

  async function fetchOne(id) {
    const uid = auth.user?.value?.id
    if (!uid) return { ok: false, message: '未登录', data: null }
    const { data, error } = await supabase
      .from('room_clues')
      .select('id, room_id, user_id, title, content, images, created_at, updated_at')
      .eq('id', id)
      .single()
    if (error) return { ok: false, message: error.message, data: null }
    return {
      ok: true,
      data: {
        id: data.id,
        roomId: data.room_id,
        userId: data.user_id,
        title: data.title || '',
        content: data.content || '',
        images: data.images || [],
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
    }
  }

  async function create(roomId, payload) {
    const uid = auth.user?.value?.id
    if (!uid) return { ok: false, message: '未登录', data: null }
    const row = {
      room_id: roomId,
      user_id: uid,
      title: payload.title ?? '',
      content: payload.content ?? '',
      images: Array.isArray(payload.images) ? payload.images : [],
    }
    const { data, error } = await supabase
      .from('room_clues')
      .insert(row)
      .select('id, room_id, user_id, title, content, images, created_at, updated_at')
      .single()
    if (error) return { ok: false, message: error.message, data: null }
    const clue = {
      id: data.id,
      roomId: data.room_id,
      userId: data.user_id,
      title: data.title || '',
      content: data.content || '',
      images: data.images || [],
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
    if (!listByRoom.value[roomId]) listByRoom.value[roomId] = []
    listByRoom.value[roomId].unshift(clue)
    return { ok: true, data: clue }
  }

  async function update(id, payload) {
    const uid = auth.user?.value?.id
    if (!uid) return { ok: false, message: '未登录' }
    const { data, error } = await supabase
      .from('room_clues')
      .update({
        title: payload.title ?? undefined,
        content: payload.content ?? undefined,
        images: Array.isArray(payload.images) ? payload.images : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', uid)
      .select('id, room_id, user_id, title, content, images, created_at, updated_at')
      .single()
    if (error) return { ok: false, message: error.message }
    const clue = {
      id: data.id,
      roomId: data.room_id,
      userId: data.user_id,
      title: data.title || '',
      content: data.content || '',
      images: data.images || [],
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
    const roomId = clue.roomId
    const list = listByRoom.value[roomId] || []
    const i = list.findIndex((c) => c.id === id)
    if (i >= 0) list[i] = clue
    return { ok: true, data: clue }
  }

  async function remove(id) {
    const uid = auth.user?.value?.id
    if (!uid) return { ok: false, message: '未登录' }
    const { error } = await supabase.from('room_clues').delete().eq('id', id).eq('user_id', uid)
    if (error) return { ok: false, message: error.message }
    for (const roomId in listByRoom.value) {
      listByRoom.value[roomId] = listByRoom.value[roomId].filter((c) => c.id !== id)
    }
    return { ok: true }
  }

  function getList(roomId) {
    return listByRoom.value[roomId] || []
  }

  return { listByRoom, fetchList, fetchOne, create, update, remove, getList }
}
