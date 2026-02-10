import { ref } from 'vue'
import { apiGet, apiPost } from '../services/api'

const rooms = ref([])
const availableModules = ref([])
const availableTags = ref([])

export function useGameRoomsStore() {
  async function fetchRooms(params = {}) {
    const q = new URLSearchParams()
    if (params.keyword != null && params.keyword !== '') q.set('keyword', params.keyword)
    if (params.status != null && params.status !== '') q.set('status', params.status)
    if (params.module != null && params.module !== '') q.set('module', params.module)
    const path = '/game-rooms' + (q.toString() ? `?${q.toString()}` : '')
    const res = await apiGet(path)
    if (res?.ok && Array.isArray(res.list)) {
      rooms.value = res.list
    }
    return res
  }

  async function fetchModules() {
    const res = await apiGet('/game-rooms/modules')
    if (res?.ok && Array.isArray(res.modules)) {
      availableModules.value = res.modules
    }
    return res
  }

  async function fetchTags() {
    const res = await apiGet('/game-rooms/tags')
    if (res?.ok && Array.isArray(res.tags)) {
      availableTags.value = res.tags
    }
    return res
  }

  async function addRoom(payload) {
    const res = await apiPost('/game-rooms', payload)
    if (res?.ok && res.room) {
      rooms.value.unshift(res.room)
      return res.room
    }
    return null
  }

  async function applyToRoom(roomId) {
    const res = await apiPost(`/game-rooms/${roomId}/apply`, {})
    return res?.ok ? res : null
  }

  return {
    rooms,
    availableModules,
    availableTags,
    fetchRooms,
    fetchModules,
    fetchTags,
    addRoom,
    applyToRoom,
  }
}
