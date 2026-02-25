import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './auth'

const list = ref([])

export function useNotesStore() {
  const auth = useAuthStore()

  async function fetchList() {
    const uid = auth.user?.value?.id
    if (!uid) return { ok: false, message: '未登录' }
    const { data, error } = await supabase
      .from('notes')
      .select('id, title, content, created_at, updated_at')
      .eq('user_id', uid)
      .order('updated_at', { ascending: false })
    if (error) return { ok: false, message: error.message }
    list.value = (data || []).map((r) => ({
      id: r.id,
      title: r.title || '',
      content: r.content || '',
      created_at: r.created_at,
      updated_at: r.updated_at,
    }))
    return { ok: true, list: list.value }
  }

  async function fetchOne(id) {
    const uid = auth.user?.value?.id
    if (!uid) return { ok: false, message: '未登录', data: null }
    const { data, error } = await supabase
      .from('notes')
      .select('id, title, content, created_at, updated_at')
      .eq('id', id)
      .eq('user_id', uid)
      .single()
    if (error) return { ok: false, message: error.message, data: null }
    return {
      ok: true,
      data: {
        id: data.id,
        title: data.title || '',
        content: data.content || '',
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
    }
  }

  async function create(payload) {
    const uid = auth.user?.value?.id
    if (!uid) return { ok: false, message: '未登录', data: null }
    const row = {
      user_id: uid,
      title: payload.title ?? '',
      content: payload.content ?? '',
    }
    const { data, error } = await supabase.from('notes').insert(row).select('id, title, content, created_at, updated_at').single()
    if (error) return { ok: false, message: error.message, data: null }
    const note = {
      id: data.id,
      title: data.title || '',
      content: data.content || '',
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
    list.value.unshift(note)
    return { ok: true, data: note }
  }

  async function update(id, payload) {
    const uid = auth.user?.value?.id
    if (!uid) return { ok: false, message: '未登录' }
    const { data, error } = await supabase
      .from('notes')
      .update({
        title: payload.title ?? undefined,
        content: payload.content ?? undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', uid)
      .select('id, title, content, created_at, updated_at')
      .single()
    if (error) return { ok: false, message: error.message }
    const note = list.value.find((n) => n.id === id)
    if (note) {
      note.title = data.title ?? note.title
      note.content = data.content ?? note.content
      note.updated_at = data.updated_at
    }
    return { ok: true, data: { id: data.id, title: data.title, content: data.content, created_at: data.created_at, updated_at: data.updated_at } }
  }

  async function remove(id) {
    const uid = auth.user?.value?.id
    if (!uid) return { ok: false, message: '未登录' }
    const { error } = await supabase.from('notes').delete().eq('id', id).eq('user_id', uid)
    if (error) return { ok: false, message: error.message }
    list.value = list.value.filter((n) => n.id !== id)
    return { ok: true }
  }

  function getById(id) {
    return list.value.find((n) => n.id === id) || null
  }

  return { list, fetchList, fetchOne, create, update, remove, getById }
}
