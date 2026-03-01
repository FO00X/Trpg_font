<template>
  <div class="flex flex-col h-full">
    <PageHeader title="创建房间" icon="mdi:dice-multiple" :show-back="false" back-label="返回大厅" @back="goBack">
      <template #actions>
        <div class="flex items-center gap-2">
          <button type="button" class="btn btn-ghost btn-sm" @click="goBack">取消</button>
          <button type="button" class="btn btn-primary btn-sm" @click="confirmCreateRoom">创建</button>
        </div>
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto scroll-thin p-4">
      <GameRoomForm
        v-model="roomForm"
        :available-tags="availableTags"
        :tag-groups="availableTagGroups"
      >
        <template #module="{ form }">
          <ModuleSelect
            v-model="form.module"
            v-model:icon="form.icon"
            placeholder="选择或输入模组名称..."
          />
        </template>
      </GameRoomForm>
    </div>

    <!-- Toast 提示 -->
    <Toast ref="toastRef" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '../components/PageHeader.vue'
import ModuleSelect from '../components/ModuleSelect.vue'
import GameRoomForm from '../components/GameRoomForm.vue'
import Toast from '../components/Toast.vue'
import { useGameRoomsStore } from '../stores/gameRooms'

const router = useRouter()
const { availableTags, availableTagGroups, fetchTags, addRoom } = useGameRoomsStore()

// Toast
const toastRef = ref(null)
function showToast(message, duration = 3000) {
  if (toastRef.value) {
    toastRef.value.show(message, duration)
  }
}

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
  const v = roomForm.value || {}
  const name = (v.name || '').trim()
  if (!name) {
    showToast('请填写房间名称')
    return
  }

  const moduleName = (v.module || '').trim()
  const payload = {
    name,
    description: (v.description || '').trim(),
    module: moduleName || '自定义模组',
    icon: v.icon || '',
    maxPlayers: v.maxPlayers ?? 6,
    tags: Array.isArray(v.tags) ? [...v.tags] : [],
  }
  
  try {
    const room = await addRoom(payload)
    if (room) {
      goBack()
    } else {
      showToast('创建房间失败，请稍后重试')
    }
  } catch (e) {
    console.error('创建房间出错:', e)
    showToast('创建房间出错，请稍后重试')
  }
}

function goBack() {
  router.push({ name: 'game-rooms' })
}
</script>