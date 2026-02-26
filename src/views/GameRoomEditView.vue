<template>
  <div class="flex flex-col h-full">
    <PageHeader title="修改房间" icon="mdi:pencil" back-label="返回房间" @back="goBack">
      <template #actions>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="px-4 py-2 rounded-lg text-accent-muted hover:text-white border border-chat-border"
            @click="goBack"
          >
            取消
          </button>
          <button
            type="button"
            class="px-4 py-2 rounded-lg bg-accent text-chat-bg hover:opacity-90 font-medium disabled:opacity-50"
            :disabled="!roomForm.name.trim() || !roomForm.module || saving"
            @click="confirmSave"
          >
            {{ saving ? '保存中…' : '保存' }}
          </button>
        </div>
      </template>
    </PageHeader>

    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <LoadingSpinner message="加载中…" />
    </div>
    <div v-else-if="!room || !isOwner" class="flex-1 flex items-center justify-center text-accent-muted">
      <p>无权修改此房间</p>
    </div>
    <div v-else class="flex-1 overflow-y-auto scroll-thin p-4">
      <GameRoomForm v-model="roomForm" :available-tags="availableTags">
        <template #module="{ form }">
          <input
            v-model="form.module"
            type="text"
            placeholder="例如：亡蝶葬仪 / 自编模组"
            class="w-full px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-[#cdd6f4] placeholder:text-accent-muted focus:border-accent/50 outline-none text-sm"
          />
        </template>
      </GameRoomForm>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '../components/PageHeader.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import GameRoomForm from '../components/GameRoomForm.vue'
import { useGameRoomsStore } from '../stores/gameRooms'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const roomId = computed(() => route.params.id)
const auth = useAuthStore()
const { fetchRoom, updateRoom, availableTags, fetchTags } = useGameRoomsStore()

const room = ref(null)
const loading = ref(true)
const saving = ref(false)
const roomForm = ref({
  name: '',
  description: '',
  module: '',
  maxPlayers: 6,
  tags: [],
})

const isOwner = computed(() => {
  const u = auth.user?.value
  const r = room.value
  return u?.id && r?.ownerId && u.id === r.ownerId
})

async function load() {
  if (!roomId.value) return
  loading.value = true
  room.value = await fetchRoom(roomId.value)
  loading.value = false
  if (room.value) {
    roomForm.value = {
      name: room.value.title || '',
      description: room.value.description || '',
      module: room.value.module || '',
      maxPlayers: room.value.maxPlayers ?? 6,
      tags: [...(room.value.tags || [])],
    }
  }
}

async function confirmSave() {
  if (!roomForm.value.name.trim()) return
  const payload = {
    title: roomForm.value.name.trim(),
    description: roomForm.value.description?.trim() ?? '',
    module: roomForm.value.module?.trim() || '自定义模组',
    maxPlayers: roomForm.value.maxPlayers,
    tags: [...roomForm.value.tags],
  }
  saving.value = true
  const res = await updateRoom(roomId.value, payload)
  saving.value = false
  if (res?.ok) router.push({ name: 'game-room', params: { id: roomId.value } })
  else alert(res?.message || '保存失败')
}

function goBack() {
  router.push({ name: 'game-room', params: { id: roomId.value } })
}

onMounted(() => {
  fetchTags()
  load()
})
watch(roomId, () => load())
</script>
