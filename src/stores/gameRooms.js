import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './auth'
import { useAchievementsStore } from './achievements'
import { ROOM_STATUS, ROOM_CHARACTER_STATUS } from '../constants/enums'

const rooms = ref([])
const availableModules = ref([])
const availableTags = ref([])
const availableTagGroups = ref([])
const roomCharacterSelection = ref({})

export function useGameRoomsStore() {
  const achievements = useAchievementsStore()
  async function fetchRooms(params = {}) {
    const auth = useAuthStore()
    const myId = auth.user?.value?.id

    let q = supabase.from('game_rooms').select('id, owner_id, title, module, tags, status, description, backstory, module_files, max_players, created_at, updated_at').order('created_at', { ascending: false })
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
      backstory: r.backstory ?? '',
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
    const list = (data || [])
      .filter((m) => m.id !== 'other' && m.name !== '其他')
      .map((m) => ({ id: m.id, name: m.name, icon: m.icon || 'mdi:dots-horizontal' }))
    availableModules.value = list
    return { ok: true, modules: availableModules.value }
  }

  async function fetchTags() {
    // 优先按新结构读取（带分组信息），若列不存在则回退为仅 tag
    let data
    let error
    ;({ data, error } = await supabase.from('game_room_tag_options').select('tag, category').order('category', { ascending: true }).order('tag', { ascending: true }))
    if (error && error.message && error.message.includes('column') && error.message.includes('category')) {
      const res = await supabase.from('game_room_tag_options').select('tag').order('tag', { ascending: true })
      data = res.data
      error = res.error
    }
    if (error) return { ok: false, message: error.message }

    availableTags.value = (data || []).map((r) => r.tag)

    const groupsMap = {}
    for (const row of data || []) {
      const cat = row.category || '其他'
      if (!groupsMap[cat]) groupsMap[cat] = []
      groupsMap[cat].push(row.tag)
    }
    availableTagGroups.value = Object.entries(groupsMap).map(([category, tags]) => ({
      category,
      tags,
    }))

    return { ok: true, tags: availableTags.value, groups: availableTagGroups.value }
  }

  async function ensureModuleOption(moduleName, icon) {
    const name = (moduleName || '').trim()
    if (!name) return
    const id = name
    const { error } = await supabase.from('game_room_module_options').insert({
      id,
      name,
      icon: icon || 'mdi:dots-horizontal',
    })
    if (!error) {
      const exists = availableModules.value.some((m) => m.id === id || m.name === name)
      if (!exists) {
        availableModules.value = [...availableModules.value, { id, name, icon: icon || 'mdi:dots-horizontal' }]
      }
    }
    // 若 error.code === '23505' 表示该模组已存在，忽略即可
  }

  async function addRoom(payload) {
    const auth = useAuthStore()
    const uid = auth.user?.value?.id
    if (!uid) return null
    const moduleName = (payload.module || '').trim() || null
    const row = {
      owner_id: uid,
      title: payload.name || payload.title || '',
      module: moduleName,
      tags: Array.isArray(payload.tags) ? payload.tags : [],
      status: ROOM_STATUS.RECRUITING,
      description: payload.description || null,
      backstory: payload.backstory || null,
      max_players: payload.maxPlayers ?? 6,
    }
    const { data, error } = await supabase.from('game_rooms').insert(row).select('id, owner_id, title, module, tags, status, description, backstory, max_players, created_at, updated_at').single()
    if (error) return null
    if (moduleName) {
      await ensureModuleOption(moduleName, payload.icon)
    }
    const room = {
      id: data.id,
      ownerId: data.owner_id,
      title: data.title,
      module: data.module,
      tags: data.tags || [],
      status: data.status,
      description: data.description,
      backstory: data.backstory ?? '',
      maxPlayers: data.max_players ?? 6,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
    rooms.value.unshift(room)
    achievements.onRoomCreated()
    return room
  }

  function getRoomById(id) {
    return rooms.value.find((r) => r.id === id) || null
  }

  async function fetchRoom(roomId) {
    const baseCols = 'id, owner_id, title, module, tags, status, description, backstory, module_files, max_players, created_at, updated_at'
    let data, error
    ;({ data, error } = await supabase
      .from('game_rooms')
      .select(`${baseCols}, module_entries`)
      .eq('id', roomId)
      .single())
    if (error && (error.code === 'PGRST204' || (error.message && /module_entries|schema cache/i.test(error.message)))) {
      const res = await supabase.from('game_rooms').select(baseCols).eq('id', roomId).single()
      data = res.data
      error = res.error
    }
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
      backstory: data.backstory ?? '',
      moduleFiles: data.module_files || [],
      moduleEntries: Array.isArray(data.module_entries) ? data.module_entries : [],
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

  /** 更新模组词条（左侧词条列表 + 右侧正文，仅房主可改）。需在 game_rooms 表存在列：module_entries jsonb DEFAULT '[]' */
  async function updateModuleEntries(roomId, entries) {
    const auth = useAuthStore()
    const uid = auth.user?.value?.id
    if (!uid) return { ok: false, message: '未登录' }
    const { data: roomRow } = await supabase.from('game_rooms').select('owner_id').eq('id', roomId).single()
    if (!roomRow || roomRow.owner_id !== uid) return { ok: false, message: '仅房主可修改模组信息' }
    const list = Array.isArray(entries) ? entries : []
    const { error } = await supabase.from('game_rooms').update({ module_entries: list, updated_at: new Date().toISOString() }).eq('id', roomId)
    if (error) {
      if (error.code === 'PGRST204' || (error.message && /module_entries|schema cache/i.test(error.message))) {
        return { ok: false, message: '数据库尚未添加模组词条字段，请在 Supabase SQL 编辑器中执行：ALTER TABLE game_rooms ADD COLUMN IF NOT EXISTS module_entries jsonb DEFAULT \'[]\';' }
      }
      return { ok: false, message: error.message }
    }
    const r = rooms.value.find((x) => x.id === roomId)
    if (r) r.moduleEntries = list
    return { ok: true }
  }

  async function applyToRoom(roomId) {
    const auth = useAuthStore()
    const uid = auth.user?.value?.id
    if (!uid) return { ok: false, message: '未登录' }
    const { error } = await supabase.from('game_room_applications').insert({ room_id: roomId, user_id: uid, status: ROOM_CHARACTER_STATUS.PENDING })
    if (error) return { ok: false, message: error.message }
    await fetchRooms()
    return { ok: true }
  }

  async function updateApplicationStatus(roomId, userId, status) {
    const auth = useAuthStore()
    const uid = auth.user?.value?.id
    if (!uid) return { ok: false, message: '未登录' }
    if (![ROOM_CHARACTER_STATUS.ACCEPTED, ROOM_CHARACTER_STATUS.REJECTED].includes(status)) return { ok: false, message: '非法状态' }

    const { error } = await supabase
      .from('game_room_applications')
      .update({ status })
      .eq('room_id', roomId)
      .eq('user_id', userId)

    if (error) return { ok: false, message: error.message }
    return { ok: true }
  }

  async function fetchMyApprovedCharacters(roomId) {
    const auth = useAuthStore()
    const uid = auth.user?.value?.id
    if (!uid) return []
    const { data, error } = await supabase
      .from('room_characters')
      .select('character_id, status')
      .eq('room_id', roomId)
      .eq('user_id', uid)
      .eq('status', ROOM_CHARACTER_STATUS.ACCEPTED)
    if (error) return []
    return (data || []).map((r) => r.character_id)
  }

  // 房间内角色卡审核列表（房主可审核，玩家可查看）
  async function fetchRoomCharacterApplications(roomId) {
    const auth = useAuthStore()
    const uid = auth.user?.value?.id
    if (!uid) return { ok: false, message: '未登录', list: [] }

    const { data, error } = await supabase
      .from('room_characters')
      .select('id, room_id, user_id, character_id, status, created_at')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })

    if (error) return { ok: false, message: error.message, list: [] }

    return {
      ok: true,
      list: (data || []).map((r) => ({
        id: r.id,
        roomId: r.room_id,
        userId: r.user_id,
        characterId: r.character_id,
        status: r.status,
        createdAt: r.created_at,
      })),
    }
  }

  // 房主更新某条角色卡审核状态（同意 / 拒绝）
  async function updateRoomCharacterStatus(id, status) {
    const auth = useAuthStore()
    const uid = auth.user?.value?.id
    if (!uid) return { ok: false, message: '未登录' }
    if (![ROOM_CHARACTER_STATUS.ACCEPTED, ROOM_CHARACTER_STATUS.REJECTED].includes(status)) {
      return { ok: false, message: '非法状态' }
    }

    const { error } = await supabase
      .from('room_characters')
      .update({ status })
      .eq('id', id)

    if (error) return { ok: false, message: error.message }
    return { ok: true }
  }

  // 玩家端：获取当前账号下各角色卡的房间审核汇总状态
  // 返回形如 { [characterId]: 'pending' | 'accepted' | 'rejected' }
  async function fetchMyCharacterReviewStatuses() {
    const auth = useAuthStore()
    const uid = auth.user?.value?.id
    if (!uid) return { ok: false, message: '未登录', statusMap: {} }

    const { data, error } = await supabase
      .from('room_characters')
      .select('character_id, status')
      .eq('user_id', uid)

    if (error) return { ok: false, message: error.message, statusMap: {} }

    const statusOrder = { accepted: 3, pending: 2, rejected: 1 }
    const map = {}
    for (const row of data || []) {
      const cid = row.character_id
      const s = row.status
      if (!cid || !statusOrder[s]) continue
      const prev = map[cid]
      if (!prev || statusOrder[s] > statusOrder[prev]) {
        map[cid] = s
      }
    }

    return { ok: true, statusMap: map }
  }

  // 玩家端：获取“我已加入”的房间列表（用于角色卡提交审核选择）
  async function fetchMyJoinedRooms() {
    const auth = useAuthStore()
    const uid = auth.user?.value?.id
    if (!uid) return { ok: false, message: '未登录', rooms: [] }

    const { data: apps, error: err1 } = await supabase
      .from('game_room_applications')
      .select('room_id, status')
      .eq('user_id', uid)
      .eq('status', ROOM_CHARACTER_STATUS.ACCEPTED)

    if (err1) return { ok: false, message: err1.message, rooms: [] }

    const roomIds = (apps || []).map((a) => a.room_id)
    if (!roomIds.length) return { ok: true, rooms: [] }

    const { data: roomRows, error: err2 } = await supabase
      .from('game_rooms')
      .select('id, title, module, status')
      .in('id', roomIds)

    if (err2) return { ok: false, message: err2.message, rooms: [] }

    const list = (roomRows || []).map((r) => ({
      id: r.id,
      title: r.title,
      module: r.module,
      status: r.status,
    }))

    return { ok: true, rooms: list }
  }

  // 玩家端：将某张角色卡提交给指定房间，供 KP 审核
  async function submitCharacterForReview(roomId, characterId) {
    const auth = useAuthStore()
    const uid = auth.user?.value?.id
    if (!uid) return { ok: false, message: '未登录' }

    // 避免重复提交：若已存在该房间的记录，则直接提示
    const { data: existing } = await supabase
      .from('room_characters')
      .select('id, status')
      .eq('room_id', roomId)
      .eq('user_id', uid)
      .eq('character_id', characterId)
      .maybeSingle()

    if (existing) {
      if (existing.status === ROOM_CHARACTER_STATUS.PENDING) {
        return { ok: false, message: '该角色卡已提交该房间，正在等待 KP 审核' }
      }
      if (existing.status === ROOM_CHARACTER_STATUS.ACCEPTED) {
        return { ok: false, message: '该角色卡已被该房间通过审核' }
      }
      // 被拒绝时允许重新提交：更新为 pending
      const { error: updateError } = await supabase
        .from('room_characters')
        .update({ status: ROOM_CHARACTER_STATUS.PENDING })
        .eq('id', existing.id)
      if (updateError) return { ok: false, message: updateError.message }
      return { ok: true }
    }

    const { error } = await supabase
      .from('room_characters')
      .insert({
        room_id: roomId,
        user_id: uid,
        character_id: characterId,
        status: ROOM_CHARACTER_STATUS.PENDING,
      })

    if (error) return { ok: false, message: error.message }
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
    if (payload.backstory != null) updates.backstory = payload.backstory
    if (payload.maxPlayers != null) updates.max_players = payload.maxPlayers
    if (Array.isArray(payload.tags)) updates.tags = payload.tags
    const { data, error } = await supabase.from('game_rooms').update(updates).eq('id', roomId).eq('owner_id', uid).select('id, owner_id, title, module, tags, status, description, backstory, max_players, created_at, updated_at').single()
    if (error) return { ok: false, message: error.message }
    const r = rooms.value.find((x) => x.id === roomId)
    if (r) {
      r.title = data.title
      r.module = data.module
      r.description = data.description
      r.backstory = data.backstory ?? ''
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
    availableTagGroups,
    fetchRooms,
    fetchModules,
    fetchTags,
    getRoomById,
    fetchRoom,
    addRoom,
    applyToRoom,
    updateApplicationStatus,
    fetchMyApprovedCharacters,
    fetchRoomCharacterApplications,
    updateRoomCharacterStatus,
    fetchMyCharacterReviewStatuses,
    fetchMyJoinedRooms,
    submitCharacterForReview,
    updateRoom,
    deleteRoom,
    updateModuleFiles,
    updateModuleEntries,
    roomCharacterSelection,
    setRoomCharacter,
    getRoomCharacter,
  }
}
