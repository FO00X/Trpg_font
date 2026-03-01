<template>
  <div class="flex flex-col">
    <PageHeader title="大厅" icon="mdi:dice-multiple">
      <template #actions>
        <button type="button" class="btn btn-primary btn-circle btn-sm" title="创建房间" @click="goCreateRoomPage">
          <Icon icon="mdi:plus" class="text-xl" />
        </button>
      </template>
    </PageHeader>

    <!-- 搜索和筛选栏 -->
    <div class="shrink-0 px-4 py-3">
      <div class="flex items-center gap-2">
        <div class="flex-1 relative">
          <Icon icon="mdi:magnify" class="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40 text-lg pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索房间名称、描述..."
            class="w-full pl-11 pr-4 py-2.5 bg-base-100 border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/50 transition-all outline-none text-sm"
          />
        </div>
        <Menu as="div" class="relative shrink-0 z-10">
          <MenuButton
            type="button"
            class="h-10 w-10 flex items-center justify-center bg-base-100 rounded-2xl shadow-sm hover:bg-base-200 transition-colors active:scale-95"
            title="筛选"
          >
            <Icon icon="mdi:filter-variant" class="text-xl text-base-content/70" />
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
                class="absolute right-0 top-full mt-2 w-56 rounded-box bg-base-100 border border-base-300 shadow-xl z-50 p-2 focus:outline-none"
              >
                <div class="px-3 py-2 border-b border-base-300">
                  <div class="text-xs font-medium text-base-content/60 uppercase mb-2">状态</div>
                  <div class="space-y-1.5">
                    <label v-for="status in statusFilters" :key="status.value" class="flex items-center gap-2 cursor-pointer">
                      <input v-model="selectedStatuses" type="checkbox" :value="status.value" class="checkbox checkbox-sm checkbox-primary" />
                      <span class="text-sm text-base-content">{{ status.label }}</span>
                    </label>
                  </div>
                </div>
                <div class="px-3 py-2 border-b border-base-300">
                  <div class="text-xs font-medium text-base-content/60 uppercase mb-2">模组</div>
                  <div class="space-y-1.5">
                    <label v-for="mod in availableModules" :key="mod.id" class="flex items-center gap-2 cursor-pointer">
                      <input v-model="selectedModules" type="checkbox" :value="mod.id" class="checkbox checkbox-sm checkbox-primary" />
                      <span class="text-sm text-base-content">{{ mod.name }}</span>
                    </label>
                  </div>
                </div>
                <div class="px-3 py-2">
                  <button type="button" class="btn btn-ghost btn-sm w-full" @click="resetFilters">重置筛选</button>
                </div>
              </MenuItems>
            </transition>
          </Menu>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto scroll-thin p-4">
      <div v-if="filteredRooms.length === 0" class="flex flex-col items-center justify-center h-full text-center text-base-content/60">
        <Icon icon="mdi:dice-multiple-outline" class="text-6xl mb-4 opacity-50" />
        <p class="text-lg mb-2">{{ rooms.length === 0 ? '暂无房间' : '未找到匹配的房间' }}</p>
        <p class="text-sm">{{ rooms.length === 0 ? '点击右上角「+」创建房间开始你的跑团之旅' : '尝试调整搜索条件或筛选条件' }}</p>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
        <div
          v-for="room in filteredRooms"
          :key="room.id"
          class="bg-base-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow flex flex-col"
        >
        <div class="p-5 flex-1 flex flex-col">
        <div class="flex items-start gap-4 mb-3">
            <div class="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon :icon="getModuleIcon(room.module)" class="text-3xl text-primary" />
            </div>
            <div class="flex-1 min-w-0 pt-1">
              <h3 class="font-bold text-base-content truncate mb-0.5 text-base">{{ room.title }}</h3>
              <span class="text-xs text-base-content/50">{{ room.module }} · {{ ownerDisplay(room) }}</span>
            </div>
            <span
              class="px-2.5 py-1 rounded-full text-[11px] font-medium shrink-0 mt-1"
              :class="{
                'bg-success/10 text-success': room.status === 'recruiting',
                'bg-base-content/10 text-base-content/60': room.status === 'full',
                'bg-info/10 text-info': room.status === 'started',
              }"
            >
              {{ getStatusLabel(room.status) }}
            </span>
          </div>

        <div class="mb-4">
          <p
            :ref="(el) => setDescRef(room.id, el)"
            class="text-sm text-base-content/60 leading-relaxed whitespace-pre-wrap break-words"
            :class="{ 'line-clamp-3': !expandedDescIds.has(room.id) }"
          >
            {{ room.description || '暂无描述' }}
          </p>
          <button
            v-if="(overflowRoomIds[room.id] && !expandedDescIds.has(room.id)) || expandedDescIds.has(room.id)"
            type="button"
            class="text-xs text-primary hover:text-primary/80 mt-1 font-medium"
            @click="toggleDesc(room.id)"
          >
            {{ expandedDescIds.has(room.id) ? '收起' : '展开' }}
          </button>
        </div>

        <div v-if="room.tags.length > 0" class="flex flex-wrap gap-1.5 mb-4">
            <span v-for="tag in room.tags" :key="tag" class="px-2 py-0.5 bg-base-200 text-base-content/70 rounded-md text-[10px] font-medium">{{ tag }}</span>
          </div>

          <div class="flex items-center gap-4 text-xs text-base-content/50 mb-4 mt-auto">
            <span class="flex items-center gap-1.5">
              <Icon icon="mdi:account-group-outline" class="text-sm" />
              {{ room.maxPlayers || 6 }} 人上限
            </span>
            <span class="flex items-center gap-1.5">
              <Icon icon="mdi:calendar-blank-outline" class="text-sm" />
              {{ formatDate(room.created_at) }}
            </span>
          </div>

          <div class="flex gap-2  border-t border-base-200/50 mt-auto">
            <template v-if="room.status === 'recruiting'">
              <button v-if="canEnterRoom(room)" type="button" class="flex-1 py-2.5 bg-primary text-primary-content rounded-xl font-medium text-sm active:scale-95 transition-all shadow-sm shadow-primary/20" @click="onEnterRoom(room)">进入房间</button>
              <button v-else-if="room.myApplicationStatus === 'pending'" type="button" class="flex-1 py-2.5 bg-base-200 text-base-content/40 rounded-xl font-medium text-sm" disabled>等待审核</button>
              <button v-else type="button" class="flex-1 py-2.5 bg-primary/10 text-primary rounded-xl font-medium text-sm active:scale-95 transition-all" @click="onApplyToRoom(room.id)">申请加入</button>
            </template>
            <button v-else-if="room.status === 'full'" type="button" class="flex-1 py-2.5 bg-base-200 text-base-content/40 rounded-xl font-medium text-sm" disabled>已满员</button>
            <button v-else-if="room.status === 'started'" type="button" class="flex-1 py-2.5 bg-base-200 text-base-content/40 rounded-xl font-medium text-sm" disabled>进行中</button>
            
            <button type="button" class="w-10 flex items-center justify-center bg-base-200 text-base-content/60 rounded-xl hover:bg-base-300 active:scale-95 transition-all" title="查看成员" @click="openRoomDetails(room)">
              <Icon icon="mdi:account-group-outline" class="text-xl" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 房间详情弹窗（成员列表） -->
  <BottomSheet v-model:open="roomDetailsOpen" title="房间成员">
    <template #header>
      <h2 class="font-semibold text-base-content flex items-center gap-2">
        <Icon icon="mdi:information-outline" class="text-xl text-primary" />
        房间成员
      </h2>
      <button type="button" class="btn btn-ghost btn-square btn-sm active:scale-95 transition-all" @click="roomDetailsOpen = false">
        <Icon icon="mdi:close" class="text-xl" />
      </button>
    </template>

    <LoadingSpinner v-if="loadingMembers" message="加载中…" />
    <div v-else-if="roomMembers.length === 0" class="text-center py-8 text-base-content/60">暂无成员</div>
    <ul v-else class="space-y-2">
      <li v-for="member in roomMembers" :key="member.id" class="flex items-center gap-3 p-3 rounded-lg bg-base-200 border border-base-300">
        <div class="avatar placeholder">
          <div class="w-10 rounded-full bg-base-100 text-primary flex items-center justify-center overflow-hidden shadow-sm">
            <img v-if="member.avatar" :src="member.avatar" alt="" class="w-full h-full object-cover" />
            <span v-else class="text-sm font-medium">{{ (member.username || member.id).charAt(0).toUpperCase() }}</span>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="font-medium text-base-content truncate">{{ member.username || '未命名' }}</span>
            <span v-if="member.isOwner" class="badge badge-primary badge-sm">房主</span>
          </div>
        </div>
      </li>
    </ul>
  </BottomSheet>

  <!-- Toast 提示 -->
  <Toast ref="toastRef" />
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { Menu, MenuButton, MenuItems } from '@headlessui/vue'
import PageHeader from '../components/PageHeader.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import Toast from '../components/Toast.vue'
import BottomSheet from '../components/BottomSheet.vue'
import { useGameRoomsStore } from '../stores/gameRooms'
import { useAuthStore } from '../stores/auth'
import { useProfileCache } from '../stores/profileCache'
import { supabase } from '../lib/supabase'

const router = useRouter()
const profileCache = useProfileCache()
const { rooms, availableModules, fetchRooms, fetchModules, fetchTags, applyToRoom } = useGameRoomsStore()
const authStore = useAuthStore()
const myId = computed(() => authStore.user?.value?.id)

// Toast
const toastRef = ref(null)
function showToast(message, duration = 3000) {
  if (toastRef.value) {
    toastRef.value.show(message, duration)
  }
}

const roomDetailsOpen = ref(false)
const roomMembers = ref([])
const loadingMembers = ref(false)
const currentRoomForDetails = ref(null)

// 房主显示名（由 profileCache 填充，避免重复请求）
const ownerNameById = ref({})

// 描述展开：超过 3 行时显示「展开」按钮
const expandedDescIds = ref(new Set())
const descriptionRefs = ref({})
const overflowRoomIds = ref({})

function setDescRef(roomId, el) {
  if (el) descriptionRefs.value[roomId] = el
  else delete descriptionRefs.value[roomId]
}

function checkOverflows() {
  const next = {}
  for (const [id, el] of Object.entries(descriptionRefs.value)) {
    if (el && typeof el.scrollHeight === 'number') next[id] = el.scrollHeight > el.clientHeight
  }
  overflowRoomIds.value = next
}

function toggleDesc(roomId) {
  const s = new Set(expandedDescIds.value)
  if (s.has(roomId)) s.delete(roomId)
  else s.add(roomId)
  expandedDescIds.value = s
}

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
  nextTick(checkOverflows)
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

watch(filteredRooms, () => nextTick(checkOverflows), { deep: true })

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
    showToast(res.message || `已申请加入「${room.title}」，等待 KP 审核`)
  } else {
    showToast(res?.message || '申请失败，请稍后重试')
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
    full: 'bg-accent-muted/20 text-base-content',
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
    
    // 房主信息（走缓存，减少接口）
    const ownerProfile = room.ownerId ? await profileCache.getProfile(room.ownerId) : null
    members.push({
      id: room.ownerId,
      username: ownerProfile?.username ?? null,
      avatar: ownerProfile?.avatar ?? null,
      isOwner: true,
    })
    
    const { data: applications } = await supabase
      .from('game_room_applications')
      .select('user_id')
      .eq('room_id', room.id)
      .eq('status', 'accepted')
    
    if (applications && applications.length > 0) {
      const memberIds = applications.map((a) => a.user_id).filter((id) => id !== room.ownerId)
      const memberMap = memberIds.length > 0 ? await profileCache.getProfiles(memberIds) : new Map()
      
      memberIds.forEach((id) => {
        const profile = memberMap.get(id)
        members.push({
          id,
          username: profile?.username ?? null,
          avatar: profile?.avatar ?? null,
          isOwner: false,
        })
      })
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
    const map = await profileCache.getProfiles(ids)
    ownerNameById.value = Object.fromEntries(
      [...map.entries()].map(([id, p]) => [id, p.username ?? null])
    )
  } catch {
    // 忽略错误，保持回退为 ID
  }
}
</script>