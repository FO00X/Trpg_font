import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './auth'

const rooms = ref([])
const availableModules = ref([])
const availableTags = ref([])
const roomCharacterSelection = ref({})

export function useGameRoomsStore() {
  async function fetchRooms(params = {}) {
    const auth = useAuthStore()
    const myId = auth.user?.value?.id

    let q = supabase.from('game_rooms').select('id, owner_id, title, module, tags, status, description, module_files, max_players, created_at, updated_at').order('created_at', { ascending: false })
    if (params.keyword != null && params.keyword !== '') {
      q = q.ilike('title', `%${params.keyword}%`)
    }
    if (params.status != null && params.status !== '') {
      q = q.eq('status', params.status)
    }
    if (params.module != null && params.module !== '') {
      q = q.eq('module', params.module)
    }
    const { data, error } = await q
    if (error) return { ok: false, message: error.message }

    let applicationByRoom = {}
    if (myId) {
      const { data: apps } = await supabase
        .from('game_room_applications')
        .select('room_id, status')
        .eq('user_id', myId)
      applicationByRoom = Object.fromEntries((apps || []).map((a) => [a.room_id, a.status]))
    }

    rooms.value = (data || []).map((r) => ({
      id: r.id,
      ownerId: r.owner_id,
      title: r.title,
      module: r.module,
      tags: r.tags || [],
      status: r.status,
      description: r.description,
      moduleFiles: r.module_files || [],
      maxPlayers: r.max_players ?? 6,
      created_at: r.created_at,
      updated_at: r.updated_at,
      myApplicationStatus: applicationByRoom[r.id] || null,
    }))
    return { ok: true, list: rooms.value }
  }

  async function fetchModules() {
    const { data, error } = await supabase.from('game_room_module_options').select('id, name, icon').order('id')
    if (error) return { ok: false, message: error.message }
    availableModules.value = (data || []).map((m) => ({ id: m.id, name: m.name, icon: m.icon || 'mdi:dots-horizontal' }))
    return { ok: true, modules: availableModules.value }
  }

  async function fetchTags() {
    const { data, error } = await supabase.from('game_room_tag_options').select('tag').order('tag')
    if (error) return { ok: false, message: error.message }
    availableTags.value = (data || []).map((r) => r.tag)
    return { ok: true, tags: availableTags.value }
  }

  async function addRoom(payload) {
    const auth = useAuthStore()
    const uid = auth.user?.value?.id
    if (!uid) return null
    const row = {
      owner_id: uid,
      title: payload.name || payload.title || '',
      module: payload.module || null,
      tags: Array.isArray(payload.tags) ? payload.tags : [],
      status: 'recruiting',
      description: payload.description || null,
      max_players: payload.maxPlayers ?? 6,
    }
    const { data, error } = await supabase.from('game_rooms').insert(row).select('id, owner_id, title, module, tags, status, description, max_players, created_at, updated_at').single()
    if (error) return null
    const room = {
      id: data.id,
      ownerId: data.owner_id,
      title: data.title,
      module: data.module,
      tags: data.tags || [],
      status: data.status,
      description: data.description,
      maxPlayers: data.max_players ?? 6,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
    rooms.value.unshift(room)
    return room
  }

  function getRoomById(id) {
    return rooms.value.find((r) => r.id === id) || null
  }

  async function fetchRoom(roomId) {
    const { data, error } = await supabase
      .from('game_rooms')
      .select('id, owner_id, title, module, tags, status, description, module_files, max_players, created_at, updated_at')
      .eq('id', roomId)
      .single()
    if (error || !data) return null
    const auth = useAuthStore()
    const myId = auth.user?.value?.id
    let myApplicationStatus = null
    if (myId) {
      const { data: app } = await supabase
        .from('game_room_applications')
        .select('status')
        .eq('room_id', roomId)
        .eq('user_id', myId)
        .maybeSingle()
      myApplicationStatus = app?.status ?? null
    }
    const room = {
      id: data.id,
      ownerId: data.owner_id,
      title: data.title,
      module: data.module,
      tags: data.tags || [],
      status: data.status,
      description: data.description,
      moduleFiles: data.module_files || [],
      maxPlayers: data.max_players ?? 6,
      created_at: data.created_at,
      updated_at: data.updated_at,
      myApplicationStatus,
    }
    const i = rooms.value.findIndex((r) => r.id === roomId)
    if (i >= 0) rooms.value[i] = room
    else rooms.value.push(room)
    return room
  }

  async function updateModuleFiles(roomId, moduleFiles) {
    const auth = useAuthStore()
    const uid = auth.user?.value?.id
    if (!uid) return { ok: false, message: '未登录' }
    const { data: roomRow } = await supabase.from('game_rooms').select('owner_id').eq('id', roomId).single()
    if (!roomRow || roomRow.owner_id !== uid) return { ok: false, message: '仅房主可修改模组信息' }
    const { error } = await supabase.from('game_rooms').update({ module_files: moduleFiles, updated_at: new Date().toISOString() }).eq('id', roomId)
    if (error) return { ok: false, message: error.message }
    const r = rooms.value.find((x) => x.id === roomId)
    if (r) r.moduleFiles = moduleFiles
    return { ok: true }
  }

  async function applyToRoom(roomId) {
    const auth = useAuthStore()
    const uid = auth.user?.value?.id
    if (!uid) return { ok: false, message: '未登录' }
    const { error } = await supabase.from('game_room_applications').insert({ room_id: roomId, user_id: uid, status: 'pending' })
    if (error) return { ok: false, message: error.message }
    await fetchRooms()
    return { ok: true }
  }

  async function updateRoom(roomId, payload) {
    const auth = useAuthStore()
    const uid = auth.user?.value?.id
    if (!uid) return { ok: false, message: '未登录' }
    const { data: roomRow } = await supabase.from('game_rooms').select('owner_id').eq('id', roomId).single()
    if (!roomRow || roomRow.owner_id !== uid) return { ok: false, message: '仅房主可修改' }
    const updates = {
      updated_at: new Date().toISOString(),
    }
    if (payload.title != null) updates.title = payload.title
    if (payload.module != null) updates.module = payload.module
    if (payload.description != null) updates.description = payload.description
    if (payload.maxPlayers != null) updates.max_players = payload.maxPlayers
    if (Array.isArray(payload.tags)) updates.tags = payload.tags
    const { data, error } = await supabase.from('game_rooms').update(updates).eq('id', roomId).eq('owner_id', uid).select('id, owner_id, title, module, tags, status, description, max_players, created_at, updated_at').single()
    if (error) return { ok: false, message: error.message }
    const r = rooms.value.find((x) => x.id === roomId)
    if (r) {
      r.title = data.title
      r.module = data.module
      r.description = data.description
      r.maxPlayers = data.max_players ?? r.maxPlayers
      r.tags = data.tags || []
      r.updated_at = data.updated_at
    }
    return { ok: true, data: r || data }
  }

  async function deleteRoom(roomId) {
    const auth = useAuthStore()
    const uid = auth.user?.value?.id
    if (!uid) return { ok: false, message: '未登录' }
    const { error } = await supabase
      .from('game_rooms')
      .delete()
      .eq('id', roomId)
      .eq('owner_id', uid)
    if (error) return { ok: false, message: error.message }
    rooms.value = rooms.value.filter((r) => r.id !== roomId)
    return { ok: true }
  }

  function setRoomCharacter(roomId, characterId) {
    roomCharacterSelection.value = { ...roomCharacterSelection.value, [roomId]: characterId || null }
  }

  function getRoomCharacter(roomId) {
    return roomCharacterSelection.value[roomId] ?? null
  }

  return {
    rooms,
    availableModules,
    availableTags,
    fetchRooms,
    fetchModules,
    fetchTags,
    getRoomById,
    fetchRoom,
    addRoom,
    applyToRoom,
    updateRoom,
    deleteRoom,
    updateModuleFiles,
    roomCharacterSelection,
    setRoomCharacter,
    getRoomCharacter,
  }
}
