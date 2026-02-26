<template>
  <div class="flex flex-col h-full">
    <PageHeader title="创建房间" icon="mdi:dice-multiple" :show-back="false" back-label="返回大厅" @back="goBack">
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
            :disabled="!roomForm.name.trim() || !roomForm.module"
            @click="confirmCreateRoom"
          >
            创建
          </button>
        </div>
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto scroll-thin p-4">
      <GameRoomForm v-model="roomForm" :available-tags="availableTags">
        <template #module="{ form }">
          <ModuleSelect
            v-model="form.module"
            v-model:icon="form.icon"
            placeholder="选择或输入模组名称..."
          />
        </template>
      </GameRoomForm>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '../components/PageHeader.vue'
import ModuleSelect from '../components/ModuleSelect.vue'
import GameRoomForm from '../components/GameRoomForm.vue'
import { useGameRoomsStore } from '../stores/gameRooms'

const router = useRouter()
const { availableTags, fetchTags, addRoom } = useGameRoomsStore()

onMounted(() => {
  fetchTags()
})

const roomForm = ref({
  name: '',
  description: '',
  module: '',
  icon: '',
  maxPlayers: 6,
  tags: [],
})

async function confirmCreateRoom() {
  if (!roomForm.value.name.trim()) return
  const moduleName = roomForm.value.module.trim()
  const payload = {
    name: roomForm.value.name.trim(),
    description: roomForm.value.description.trim(),
    module: moduleName || '自定义模组',
    icon: roomForm.value.icon || '',
    maxPlayers: roomForm.value.maxPlayers,
    tags: [...roomForm.value.tags],
  }
  const room = await addRoom(payload)
  if (room) goBack()
  else alert('创建房间失败，请稍后重试')
}

function goBack() {
  router.push({ name: 'game-rooms' })
}
</script>

