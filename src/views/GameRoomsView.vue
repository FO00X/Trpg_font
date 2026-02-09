<template>
  <div class="flex flex-col h-full">
    <PageHeader title="跑团房间" icon="mdi:dice-multiple">
      <button
        type="button"
        class="p-2 rounded-lg bg-accent text-chat-bg hover:opacity-90 transition-opacity"
        title="创建房间"
        @click="openCreateRoomDialog"
      >
        <Icon icon="mdi:plus" class="text-xl" />
      </button>
    </PageHeader>

    <!-- 搜索和筛选栏 -->
    <div class="shrink-0 px-4 py-3 border-b border-chat-border bg-chat-panel">
      <div class="flex items-center gap-2">
        <!-- 搜索框 -->
        <div class="flex-1 relative">
          <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 text-accent-muted text-lg pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索房间名称、模组、KP..."
            class="w-full pl-10 pr-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-[#cdd6f4] placeholder:text-accent-muted focus:border-accent/50 outline-none text-sm"
          />
        </div>
        <!-- 筛选按钮 -->
        <Menu as="div" class="relative shrink-0">
          <MenuButton
            type="button"
            class="p-2 rounded-lg bg-chat-bg border border-chat-border text-accent-muted hover:text-white hover:border-accent/50 transition-colors"
            title="筛选"
          >
            <Icon icon="mdi:filter-outline" class="text-xl" />
          </MenuButton>
            <transition
              enter-active-class="transition duration-100 ease-out"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition duration-75 ease-in"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <MenuItems
                class="absolute right-0 top-full mt-2 w-56 rounded-lg bg-sidebar border border-chat-border shadow-xl py-1 z-50 focus:outline-none"
              >
                <!-- 状态筛选 -->
                <div class="px-3 py-2 border-b border-chat-border/50">
                  <div class="text-xs font-medium text-accent-muted uppercase mb-2">状态</div>
                  <div class="space-y-1.5">
                    <label
                      v-for="status in statusFilters"
                      :key="status.value"
                      class="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        v-model="selectedStatuses"
                        type="checkbox"
                        :value="status.value"
                        class="w-4 h-4 rounded border-chat-border bg-chat-bg text-accent focus:ring-accent focus:ring-offset-0"
                      />
                      <span class="text-sm text-[#cdd6f4]">{{ status.label }}</span>
                    </label>
                  </div>
                </div>
                <!-- 模组筛选 -->
                <div class="px-3 py-2 border-b border-chat-border/50">
                  <div class="text-xs font-medium text-accent-muted uppercase mb-2">模组</div>
                  <div class="space-y-1.5">
                    <label
                      v-for="mod in availableModules"
                      :key="mod.id"
                      class="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        v-model="selectedModules"
                        type="checkbox"
                        :value="mod.id"
                        class="w-4 h-4 rounded border-chat-border bg-chat-bg text-accent focus:ring-accent focus:ring-offset-0"
                      />
                      <span class="text-sm text-[#cdd6f4]">{{ mod.name }}</span>
                    </label>
                  </div>
                </div>
                <!-- 重置按钮 -->
                <div class="px-3 py-2">
                  <button
                    type="button"
                    class="w-full px-3 py-1.5 rounded-lg bg-chat-bg border border-chat-border text-[#cdd6f4] hover:bg-white/5 transition-colors text-sm"
                    @click="resetFilters"
                  >
                    重置筛选
                  </button>
                </div>
              </MenuItems>
            </transition>
          </Menu>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto scroll-thin p-4">
      <div v-if="filteredRooms.length === 0" class="flex flex-col items-center justify-center h-full text-center text-accent-muted">
        <Icon icon="mdi:dice-multiple-outline" class="text-6xl mb-4 opacity-50" />
        <p class="text-lg mb-2">{{ rooms.length === 0 ? '暂无房间' : '未找到匹配的房间' }}</p>
        <p class="text-sm">{{ rooms.length === 0 ? '点击右上角「+」创建房间开始你的跑团之旅' : '尝试调整搜索条件或筛选条件' }}</p>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <div
          v-for="room in filteredRooms"
          :key="room.id"
          class="flex flex-col p-4 rounded-xl bg-chat-panel border border-chat-border hover:border-accent/30 transition-colors"
        >
          <!-- 房间头部 -->
          <div class="flex items-start gap-3 mb-3">
            <div class="w-12 h-12 rounded-lg bg-sidebar-active flex items-center justify-center shrink-0">
              <Icon :icon="room.moduleIcon" class="text-2xl text-accent" />
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-white truncate mb-1">{{ room.name }}</h3>
              <div class="flex items-center gap-2 text-xs text-accent-muted">
                <span>{{ room.module }}</span>
                <span>•</span>
                <span>{{ room.owner }}</span>
              </div>
            </div>
            <span
              class="px-2 py-0.5 rounded text-xs font-medium shrink-0"
              :class="getStatusColor(room.status)"
            >
              {{ getStatusLabel(room.status) }}
            </span>
          </div>

          <!-- 房间描述 -->
          <p class="text-sm text-[#a6adc8] mb-3 line-clamp-2">{{ room.description || '暂无描述' }}</p>

          <!-- 标签 -->
          <div v-if="room.tags.length > 0" class="flex flex-wrap gap-1.5 mb-3">
            <span
              v-for="tag in room.tags"
              :key="tag"
              class="px-2 py-0.5 rounded text-xs bg-sidebar-active text-accent-muted"
            >
              {{ tag }}
            </span>
          </div>

          <!-- 房间信息 -->
          <div class="flex items-center justify-between text-xs text-accent-muted mb-3">
            <div class="flex items-center gap-4">
              <span class="flex items-center gap-1">
                <Icon icon="mdi:account-group" class="text-sm" />
                {{ room.currentPlayers }} / {{ room.maxPlayers }}
              </span>
              <span class="flex items-center gap-1">
                <Icon icon="mdi:calendar" class="text-sm" />
                {{ room.createdAt }}
              </span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex gap-2 mt-auto">
            <button
              v-if="room.status === 'recruiting' && room.currentPlayers < room.maxPlayers"
              type="button"
              class="flex-1 px-3 py-2 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-colors text-sm font-medium"
              @click="applyToRoom(room.id)"
            >
              申请加入
            </button>
            <button
              v-else-if="room.status === 'full'"
              type="button"
              class="flex-1 px-3 py-2 rounded-lg bg-accent-muted/20 text-accent-muted cursor-not-allowed text-sm font-medium"
              disabled
            >
              已满员
            </button>
            <button
              v-else-if="room.status === 'started'"
              type="button"
              class="flex-1 px-3 py-2 rounded-lg bg-blue-500/20 text-blue-400 cursor-not-allowed text-sm font-medium"
              disabled
            >
              进行中
            </button>
            <button
              type="button"
              class="px-3 py-2 rounded-lg text-accent-muted hover:text-white hover:bg-white/5 transition-colors"
              title="查看详情"
            >
              <Icon icon="mdi:information-outline" class="text-lg" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建房间弹窗 -->
    <Dialog :open="createRoomDialogOpen" @close="closeCreateRoomDialog" class="relative z-50">
      <div class="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div class="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel class="w-full max-w-lg rounded-xl bg-sidebar border border-chat-border shadow-xl p-6 max-h-[90vh] overflow-y-auto scroll-thin">
          <DialogTitle class="text-lg font-semibold text-white mb-4">创建跑团房间</DialogTitle>

          <div class="space-y-4">
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

            <!-- 模组选择 -->
            <div>
              <label class="block text-sm font-medium text-white mb-1.5">选择模组 *</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="mod in availableModules"
                  :key="mod.id"
                  type="button"
                  :class="[
                    'flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors',
                    roomForm.module === mod.id
                      ? 'bg-accent/20 border-accent text-accent'
                      : 'bg-chat-bg border-chat-border text-accent-muted hover:border-accent/30',
                  ]"
                  @click="roomForm.module = mod.id; roomForm.moduleIcon = mod.icon"
                >
                  <Icon :icon="mod.icon" class="text-xl" />
                  <span class="text-xs">{{ mod.name }}</span>
                </button>
              </div>
            </div>

            <!-- 房间描述 -->
            <div>
              <label class="block text-sm font-medium text-white mb-1.5">房间描述</label>
              <textarea
                v-model="roomForm.description"
                rows="4"
                placeholder="介绍一下你的跑团房间..."
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

          <!-- 操作按钮 -->
          <div class="flex gap-3 mt-6">
            <button
              type="button"
              class="flex-1 px-4 py-2 rounded-lg bg-chat-bg border border-chat-border text-[#cdd6f4] hover:bg-white/5 transition-colors"
              @click="closeCreateRoomDialog"
            >
              取消
            </button>
            <button
              type="button"
              class="flex-1 px-4 py-2 rounded-lg bg-accent text-chat-bg hover:opacity-90 transition-opacity font-medium"
              :disabled="!roomForm.name.trim() || !roomForm.module"
              @click="confirmCreateRoom"
            >
              创建
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { Dialog, DialogPanel, DialogTitle, Menu, MenuButton, MenuItems } from '@headlessui/vue'
import PageHeader from '../components/PageHeader.vue'

// Mock 房间数据
const rooms = ref([
  {
    id: 'room-1',
    name: '亡蝶葬仪 - 调查组',
    description: '一个充满神秘色彩的调查故事，欢迎加入我们的冒险。',
    module: '亡蝶葬仪',
    moduleIcon: 'mdi:butterfly',
    owner: 'KP-熊猫',
    maxPlayers: 6,
    currentPlayers: 3,
    status: 'recruiting', // recruiting, full, started
    tags: ['恐怖', '调查', 'COC'],
    createdAt: '2026-02-05',
  },
  {
    id: 'room-2',
    name: '致我不灭的 - 主频道',
    description: '探索未知的世界，寻找不灭的真相。',
    module: '致我不灭的',
    moduleIcon: 'mdi:fire',
    owner: 'KP-田中',
    maxPlayers: 4,
    currentPlayers: 4,
    status: 'full',
    tags: ['奇幻', '冒险'],
    createdAt: '2026-02-03',
  },
  {
    id: 'room-3',
    name: '新模组测试',
    description: '测试新模组，欢迎参与。',
    module: '测试模组',
    moduleIcon: 'mdi:test-tube',
    owner: 'KP-方糕',
    maxPlayers: 5,
    currentPlayers: 2,
    status: 'recruiting',
    tags: ['测试'],
    createdAt: '2026-02-08',
  },
])

const createRoomDialogOpen = ref(false)
const roomForm = ref({
  name: '',
  description: '',
  module: '',
  moduleIcon: 'mdi:dice-multiple',
  maxPlayers: 6,
  tags: [],
})

const availableModules = [
  { id: 'wangdie', name: '亡蝶葬仪', icon: 'mdi:butterfly' },
  { id: 'zhivo', name: '致我不灭的', icon: 'mdi:fire' },
  { id: 'custom', name: '自定义模组', icon: 'mdi:file-document-edit' },
]

const availableTags = ['恐怖', '调查', 'COC', '奇幻', '冒险', '现代', '古代', '科幻', '测试']

// 搜索和筛选
const searchQuery = ref('')
const selectedStatuses = ref(['recruiting', 'full', 'started'])
const selectedModules = ref([])

const statusFilters = [
  { value: 'recruiting', label: '招募中' },
  { value: 'full', label: '已满员' },
  { value: 'started', label: '进行中' },
]

// 筛选后的房间列表
const filteredRooms = computed(() => {
  let result = rooms.value

  // 搜索筛选
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter((room) => {
      return (
        room.name.toLowerCase().includes(query) ||
        room.module.toLowerCase().includes(query) ||
        room.owner.toLowerCase().includes(query) ||
        room.description.toLowerCase().includes(query)
      )
    })
  }

  // 状态筛选
  if (selectedStatuses.value.length > 0 && selectedStatuses.value.length < statusFilters.length) {
    result = result.filter((room) => selectedStatuses.value.includes(room.status))
  }

  // 模组筛选
  if (selectedModules.value.length > 0) {
    const moduleNames = selectedModules.value
      .map((id) => {
        const mod = availableModules.find((m) => m.id === id)
        return mod?.name
      })
      .filter(Boolean)
    if (moduleNames.length > 0) {
      result = result.filter((room) => moduleNames.includes(room.module))
    }
  }

  return result
})

function resetFilters() {
  selectedStatuses.value = ['recruiting', 'full', 'started']
  selectedModules.value = []
  searchQuery.value = ''
}

function openCreateRoomDialog() {
  roomForm.value = {
    name: '',
    description: '',
    module: '',
    moduleIcon: 'mdi:dice-multiple',
    maxPlayers: 6,
    tags: [],
  }
  createRoomDialogOpen.value = true
}

function confirmCreateRoom() {
  if (!roomForm.value.name.trim()) return
  const module = availableModules.find((m) => m.id === roomForm.value.module)
  const newRoom = {
    id: `room-${Date.now()}`,
    name: roomForm.value.name.trim(),
    description: roomForm.value.description.trim(),
    module: module?.name || '自定义模组',
    moduleIcon: module?.icon || 'mdi:dice-multiple',
    owner: '我',
    maxPlayers: roomForm.value.maxPlayers,
    currentPlayers: 1,
    status: 'recruiting',
    tags: [...roomForm.value.tags],
    createdAt: new Date().toISOString().split('T')[0],
  }
  rooms.value.unshift(newRoom)
  createRoomDialogOpen.value = false
}

function closeCreateRoomDialog() {
  createRoomDialogOpen.value = false
}

function toggleTag(tag) {
  const idx = roomForm.value.tags.indexOf(tag)
  if (idx >= 0) {
    roomForm.value.tags.splice(idx, 1)
  } else {
    roomForm.value.tags.push(tag)
  }
}

function applyToRoom(roomId) {
  const room = rooms.value.find((r) => r.id === roomId)
  if (!room || room.status !== 'recruiting') return
  if (room.currentPlayers >= room.maxPlayers) return
  // TODO: 发送申请请求
  alert(`已申请加入「${room.name}」，等待 KP 审核`)
}

function getStatusLabel(status) {
  const map = {
    recruiting: '招募中',
    full: '已满员',
    started: '进行中',
  }
  return map[status] || status
}

function getStatusColor(status) {
  const map = {
    recruiting: 'bg-green-500/20 text-green-400',
    full: 'bg-accent-muted/20 text-accent-muted',
    started: 'bg-blue-500/20 text-blue-400',
  }
  return map[status] || ''
}
</script>