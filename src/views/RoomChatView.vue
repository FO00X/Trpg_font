<template>
  <div class="flex flex-col h-full">
    <PageHeader
      :title="roomTitle"
      icon="mdi:chat-outline"
    >
      <template #actions>
        <button
          type="button"
          class="p-2 rounded-lg bg-sidebar-active text-white hover:bg-sidebar-hover transition-colors"
          title="返回房间"
          @click="goBack"
        >
          <Icon icon="mdi:arrow-left" class="text-lg" />
        </button>
      </template>
    </PageHeader>
    <div class="flex-1 min-h-0">
      <RoomChat v-if="roomId" :room-id="roomId" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import PageHeader from '../components/PageHeader.vue'
import RoomChat from '../components/RoomChat.vue'
import { useGameRoomsStore } from '../stores/gameRooms'

const route = useRoute()
const router = useRouter()
const gameRoomsStore = useGameRoomsStore()

const roomId = computed(() => route.params.id)

const roomTitle = computed(() => {
  const id = roomId.value
  if (!id) return '房间聊天'
  const room = gameRoomsStore.getRoomById(id)
  return room ? `${room.title} - 聊天` : '房间聊天'
})

function goBack() {
  if (roomId.value) {
    router.push({ name: 'game-room', params: { id: roomId.value } })
  } else {
    router.push({ name: 'game-rooms' })
  }
}
</script>
