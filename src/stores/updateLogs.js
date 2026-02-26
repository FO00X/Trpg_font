import { ref } from 'vue'
import { supabase } from '../lib/supabase'

const list = ref([])

export function useUpdateLogsStore() {
  /** 拉取更新记录列表（按时间倒序，时间轴展示时再按正序） */
  async function fetchList() {
    const { data, error } = await supabase
      .from('update_logs')
      .select('id, title, content, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) return { ok: false, message: error.message }
    list.value = data || []
    return { ok: true, list: list.value }
  }

  /** 新增一条（仅管理员，RLS 校验） */
  async function create({ title, content }) {
    const { data, error } = await supabase
      .from('update_logs')
      .insert({
        title: title?.trim() || '',
        content: content?.trim() ?? null,
        updated_at: new Date().toISOString(),
      })
      .select('id, title, content, created_at, updated_at')
      .single()

    if (error) return { ok: false, message: error.message }
    list.value = [data, ...list.value]
    return { ok: true, item: data }
  }

  /** 更新一条（仅管理员） */
  async function update(id, { title, content }) {
    const { data, error } = await supabase
      .from('update_logs')
      .update({
        title: title?.trim() ?? undefined,
        content: content?.trim() ?? undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, title, content, created_at, updated_at')
      .single()

    if (error) return { ok: false, message: error.message }
    const i = list.value.findIndex((item) => item.id === id)
    if (i >= 0) list.value[i] = data
    return { ok: true, item: data }
  }

  /** 删除一条（仅管理员） */
  async function remove(id) {
    const { error } = await supabase.from('update_logs').delete().eq('id', id)
    if (error) return { ok: false, message: error.message }
    list.value = list.value.filter((item) => item.id !== id)
    return { ok: true }
  }

  return {
    list,
    fetchList,
    create,
    update,
    remove,
  }
}
