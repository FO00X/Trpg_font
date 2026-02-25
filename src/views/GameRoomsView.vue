<template>
  <div class="flex flex-col">
    <PageHeader title="大厅" icon="mdi:dice-multiple">
      <template #actions>
        <button
          type="button"
          class="p-2 rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/30 transition-colors"
          title="创建房间"
          @click="goCreateRoomPage"
        >
          <Icon icon="mdi:plus" class="text-xl" />
        </button>
      </template>
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
              <Icon :icon="getModuleIcon(room.module)" class="text-2xl text-accent" />
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-white truncate mb-1">{{ room.title }}</h3>
              <span class="text-xs text-accent-muted">{{ room.module }} · {{ ownerDisplay(room) }}</span>
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
            <span class="flex items-center gap-1">
              <Icon icon="mdi:account-group" class="text-sm" />
              最多 {{ room.maxPlayers || 6 }} 人
            </span>
            <span class="flex items-center gap-1">
              <Icon icon="mdi:calendar" class="text-sm" />
              {{ formatDate(room.created_at) }}
            </span>
          </div>

          <!-- 操作按钮 -->
          <div class="flex flex-wrap gap-2 mt-auto">
            <div class="flex gap-2 flex-1 min-w-0">
              <template v-if="room.status === 'recruiting'">
                <button
                  v-if="canEnterRoom(room)"
                  type="button"
                  class="flex-1 px-3 py-2 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-colors text-sm font-medium"
                  @click="onEnterRoom(room)"
                >
                  进入房间
                </button>
                <button
                  v-else-if="room.myApplicationStatus === 'pending'"
                  type="button"
                  class="flex-1 px-3 py-2 rounded-lg bg-accent-muted/20 text-accent-muted cursor-not-allowed text-sm font-medium"
                  disabled
                >
                  等待审核
                </button>
                <button
                  v-else
                  type="button"
                  class="flex-1 px-3 py-2 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-colors text-sm font-medium"
                  @click="onApplyToRoom(room.id)"
                >
                  申请加入
                </button>
              </template>
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
            </div>
            <button
              type="button"
              class="px-3 py-2 rounded-lg text-accent-muted hover:text-white hover:bg-white/5 transition-colors"
              title="查看详情"
              @click="openRoomDetails(room)"
            >
              <Icon icon="mdi:information-outline" class="text-lg" />
            </button>
          </div>
      </div>
    </div>
  </div>

  <!-- 房间详情弹窗（成员列表） -->
  <Teleport to="body">
    <Dialog :open="roomDetailsOpen" class="relative z-50" @close="roomDetailsOpen = false">
      <div class="fixed inset-0 bg-black/60" aria-hidden="true" />
      <div class="fixed inset-0 flex items-center justify-center p-4" @click.self="roomDetailsOpen = false">
        <DialogPanel class="mx-auto w-full max-w-md rounded-xl bg-sidebar border border-chat-border shadow-xl">
          <DialogTitle class="sr-only">房间详情</DialogTitle>
          <div class="p-4">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-white flex items-center gap-2">
                <Icon icon="mdi:information-outline" class="text-xl text-accent" />
                房间成员
              </h2>
              <button
                type="button"
                class="p-2 rounded-lg text-accent-muted hover:text-white hover:bg-white/5"
                @click="roomDetailsOpen = false"
              >
                <Icon icon="mdi:close" class="text-xl" />
              </button>
            </div>
            <div v-if="loadingMembers" class="text-center py-8 text-accent-muted">
              <Icon icon="mdi:loading" class="text-2xl animate-spin mx-auto mb-2" />
              <p>加载中…</p>
            </div>
            <div v-else-if="roomMembers.length === 0" class="text-center py-8 text-accent-muted">
              暂无成员
            </div>
            <ul v-else class="space-y-2 max-h-96 overflow-y-auto scroll-thin">
              <li
                v-for="member in roomMembers"
                :key="member.id"
                class="flex items-center gap-3 p-3 rounded-lg bg-chat-bg border border-chat-border"
              >
                <div class="w-10 h-10 rounded-full bg-sidebar-active flex items-center justify-center shrink-0 text-accent overflow-hidden">
                  <img v-if="member.avatar" :src="member.avatar" alt="" class="w-full h-full object-cover" />
                  <span v-else class="text-sm font-medium">{{ (member.username || member.id).charAt(0).toUpperCase() }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-white truncate">{{ member.username || '未命名' }}</span>
                    <span
                      v-if="member.isOwner"
                      class="px-2 py-0.5 rounded text-xs bg-accent/20 text-accent"
                    >
                      房主
                    </span>
                  </div>
                  <p v-if="member.id" class="text-xs text-accent-muted truncate">{{ member.id }}</p>
                </div>
              </li>
            </ul>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { Menu, MenuButton, MenuItems, Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'
import PageHeader from '../components/PageHeader.vue'
import { useGameRoomsStore } from '../stores/gameRooms'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'

const router = useRouter()
const { rooms, availableModules, fetchRooms, fetchModules, fetchTags, applyToRoom } = useGameRoomsStore()
const authStore = useAuthStore()
const myId = computed(() => authStore.user?.value?.id)

const roomDetailsOpen = ref(false)
const roomMembers = ref([])
const loadingMembers = ref(false)
const currentRoomForDetails = ref(null)

// 房主用户名缓存：{ ownerId -> username }
const ownerNameById = ref({})

/** 招募中时：房主或已通过申请的用户显示「进入房间」 */
function canEnterRoom(room) {
  if (room.status !== 'recruiting') return false
  if (room.ownerId === myId.value) return true
  return room.myApplicationStatus === 'accepted'
}

function onEnterRoom(room) {
  router.push({ name: 'game-room', params: { id: room.id } })
}

onMounted(() => {
  fetchRooms()
  fetchModules()
  fetchTags()
  loadOwnerNames()
})

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
      const title = (room.title || '').toLowerCase()
      const module = (room.module || '').toLowerCase()
      const desc = (room.description || '').toLowerCase()
      const tagsStr = (room.tags || []).join(' ').toLowerCase()
      return title.includes(query) || module.includes(query) || desc.includes(query) || tagsStr.includes(query)
    })
  }

  // 状态筛选
  if (selectedStatuses.value.length > 0 && selectedStatuses.value.length < statusFilters.length) {
    result = result.filter((room) => selectedStatuses.value.includes(room.status))
  }

  // 模组筛选
  if (selectedModules.value.length > 0) {
    const moduleNames = selectedModules.value
      .map((id) => availableModules.value.find((m) => m.id === id)?.name)
      .filter(Boolean)
    result = result.filter((room) => {
      return moduleNames.includes(room.module) || selectedModules.value.includes(room.module)
    })
  }

  return result
})

function resetFilters() {
  selectedStatuses.value = ['recruiting', 'full', 'started']
  selectedModules.value = []
  searchQuery.value = ''
}

function goCreateRoomPage() {
  router.push({ name: 'game-room-new' })
}

async function onApplyToRoom(roomId) {
  const room = rooms.value.find((r) => r.id === roomId)
  if (!room || room.status !== 'recruiting') return
  const res = await applyToRoom(roomId)
  if (res?.ok) {
    alert(res.message || `已申请加入「${room.title}」，等待 KP 审核`)
  } else {
    alert(res?.message || '申请失败，请稍后重试')
  }
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

function getModuleIcon(moduleNameOrId) {
  const mod = availableModules.value.find((m) => m.name === moduleNameOrId || m.id === moduleNameOrId)
  return mod?.icon || 'mdi:dots-horizontal'
}

function ownerDisplay(room) {
  const ownerId = room.ownerId
  if (!ownerId) return '房主'
  const name = ownerNameById.value[ownerId]
  if (name && name.trim()) return name
  return ownerId.slice(0, 8) + '…'
}

function formatDate(isoString) {
  if (!isoString) return '—'
  const d = new Date(isoString)
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

async function openRoomDetails(room) {
  currentRoomForDetails.value = room
  roomDetailsOpen.value = true
  loadingMembers.value = true
  roomMembers.value = []
  
  try {
    const members = []
    
    // 获取房主信息
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('id, username, avatar')
      .eq('id', room.ownerId)
      .single()
    
    if (ownerProfile) {
      members.push({
        id: ownerProfile.id,
        username: ownerProfile.username,
        avatar: ownerProfile.avatar,
        isOwner: true,
      })
    } else {
      members.push({
        id: room.ownerId,
        username: null,
        avatar: null,
        isOwner: true,
      })
    }
    
    // 获取已通过申请的成员
    const { data: applications } = await supabase
      .from('game_room_applications')
      .select('user_id')
      .eq('room_id', room.id)
      .eq('status', 'accepted')
    
    if (applications && applications.length > 0) {
      const memberIds = applications.map((a) => a.user_id).filter((id) => id !== room.ownerId)
      
      if (memberIds.length > 0) {
        const { data: memberProfiles } = await supabase
          .from('profiles')
          .select('id, username, avatar')
          .in('id', memberIds)
        
        if (memberProfiles) {
          memberProfiles.forEach((profile) => {
            members.push({
              id: profile.id,
              username: profile.username,
              avatar: profile.avatar,
              isOwner: false,
            })
          })
        }
        
        // 对于没有 profile 的成员，也添加进去
        memberIds.forEach((id) => {
          if (!memberProfiles?.find((p) => p.id === id)) {
            members.push({
              id,
              username: null,
              avatar: null,
              isOwner: false,
            })
          }
        })
      }
    }
    
    roomMembers.value = members
  } catch (error) {
    console.error('加载成员列表失败:', error)
  } finally {
    loadingMembers.value = false
  }
}

async function loadOwnerNames() {
  const ids = Array.from(new Set(rooms.value.map((r) => r.ownerId).filter(Boolean)))
  if (!ids.length) return
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', ids)
    if (error) return
    ownerNameById.value = Object.fromEntries(
      (data || []).map((p) => [p.id, p.username])
    )
  } catch {
    // 忽略错误，保持回退为 ID
  }
}
</script>