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
      <div class="max-w-lg mx-auto space-y-4">
        <!-- 房间名称 -->
        <div>
          <label class="block text-sm font-medium text-white mb-1.5">房间名称 *</label>
          <input
            v-model="roomForm.name"
            type="text"
            placeholder="例如：亡蝶葬仪 - 调查组"
            class="w-full px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-[#cdd6f4] placeholder:text-accent-muted focus:border-accent/50 outline-none text-sm"
          />
        </div>

        <!-- 模组名称（可选择或自定义输入，并可选择图标） -->
        <div>
          <label class="block text-sm font-medium text-white mb-1.5">模组名称 *</label>
          <ModuleSelect
            v-model="roomForm.module"
            v-model:icon="roomForm.icon"
            placeholder="选择或输入模组名称..."
          />
        </div>

        <!-- 房间描述 -->
        <div>
          <label class="block text-sm font-medium text-white mb-1.5">房间描述</label>
          <textarea
            v-model="roomForm.description"
            rows="4"
            placeholder="介绍一下你的房间..."
            class="w-full px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-[#cdd6f4] placeholder:text-accent-muted focus:border-accent/50 outline-none text-sm resize-none"
          />
        </div>

        <!-- 最大人数 -->
        <div>
          <label class="block text-sm font-medium text-white mb-1.5">最大人数</label>
          <input
            v-model.number="roomForm.maxPlayers"
            type="number"
            min="2"
            max="10"
            class="w-full px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-[#cdd6f4] focus:border-accent/50 outline-none text-sm"
          />
        </div>

        <!-- 标签 -->
        <div>
          <label class="block text-sm font-medium text-white mb-1.5">标签（可选）</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="tag in availableTags"
              :key="tag"
              type="button"
              :class="[
                'px-3 py-1.5 rounded-lg text-sm transition-colors',
                roomForm.tags.includes(tag)
                  ? 'bg-accent text-chat-bg'
                  : 'bg-chat-bg border border-chat-border text-accent-muted hover:border-accent/30',
              ]"
              @click="toggleTag(tag)"
            >
              {{ tag }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import PageHeader from '../components/PageHeader.vue'
import ModuleSelect from '../components/ModuleSelect.vue'
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

function toggleTag(tag) {
  const idx = roomForm.value.tags.indexOf(tag)
  if (idx >= 0) {
    roomForm.value.tags.splice(idx, 1)
  } else {
    roomForm.value.tags.push(tag)
  }
}

async function confirmCreateRoom() {
  if (!roomForm.value.name.trim()) return
  const moduleName = roomForm.value.module.trim()
  const payload = {
    name: roomForm.value.name.trim(),
    description: roomForm.value.description.trim(),
    module: moduleName || '自定义模组',
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

