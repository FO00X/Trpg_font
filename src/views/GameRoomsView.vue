<template>
  <div class="flex flex-col">
    <PageHeader title="大厅" icon="mdi:dice-multiple">
      <template #actions>
        <button type="button" class="btn btn-primary btn-circle btn-sm" title="创建房间" @click="goCreateRoomPage">
          <Icon icon="mdi:plus" class="text-xl" />
        </button>
      </template>
    </PageHeader>

    <!-- 顶部 Tab：房间 / 跑团日志 -->
    <div class="shrink-0 px-4 pt-3">
      <div class="inline-flex bg-base-200 p-1 rounded-xl">
        <button
          type="button"
          class="btn btn-xs sm:btn-sm border-none rounded-lg"
          :class="activeTab === 'rooms' ? 'btn-primary' : 'btn-ghost text-base-content/70'"
          @click="activeTab = 'rooms'"
        >
          <Icon icon="mdi:view-grid-outline" class="text-lg mr-1" />
          房间
        </button>
        <button
          type="button"
          class="btn btn-xs sm:btn-sm border-none rounded-lg"
          :class="activeTab === 'logs' ? 'btn-primary' : 'btn-ghost text-base-content/70'"
          @click="activeTab = 'logs'"
        >
          <Icon icon="mdi:book-open-variant" class="text-lg mr-1" />
          跑团日志
        </button>
      </div>
    </div>

    <!-- 房间 Tab：搜索和筛选栏 -->
    <div v-if="activeTab === 'rooms'" class="shrink-0 px-4 py-3">
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

    <!-- 房间 Tab：房间列表 -->
    <div v-if="activeTab === 'rooms'" class="flex-1 overflow-y-auto scroll-thin p-4">
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
                'bg-success/10 text-success': room.status === ROOM_STATUS.RECRUITING,
                'bg-base-content/10 text-base-content/60': room.status === ROOM_STATUS.FULL,
                'bg-info/10 text-info': room.status === ROOM_STATUS.STARTED,
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
              {{ formatDate(room.created_at) || '—' }}
            </span>
          </div>

          <div class="flex gap-2  border-t border-base-200/50 mt-auto">
            <template v-if="room.status === ROOM_STATUS.RECRUITING">
              <button v-if="canEnterRoom(room)" type="button" class="flex-1 py-2.5 bg-primary text-primary-content rounded-xl font-medium text-sm active:scale-95 transition-all shadow-sm shadow-primary/20" @click="onEnterRoom(room)">进入房间</button>
              <button v-else-if="room.myApplicationStatus === 'pending'" type="button" class="flex-1 py-2.5 bg-base-200 text-base-content/40 rounded-xl font-medium text-sm" disabled>等待审核</button>
              <button v-else type="button" class="flex-1 py-2.5 bg-primary/10 text-primary rounded-xl font-medium text-sm active:scale-95 transition-all" @click="onApplyToRoom(room.id)">申请加入</button>
            </template>
            <button v-else-if="room.status === ROOM_STATUS.FULL" type="button" class="flex-1 py-2.5 bg-base-200 text-base-content/40 rounded-xl font-medium text-sm" disabled>已满员</button>
            <button v-else-if="room.status === ROOM_STATUS.STARTED" type="button" class="flex-1 py-2.5 bg-base-200 text-base-content/40 rounded-xl font-medium text-sm" disabled>进行中</button>
            
            <button type="button" class="w-10 flex items-center justify-center bg-base-200 text-base-content/60 rounded-xl hover:bg-base-300 active:scale-95 transition-all" title="查看成员" @click="openRoomDetails(room)">
              <Icon icon="mdi:account-group-outline" class="text-xl" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 跑团日志 Tab：以书本形式展示房间小说记录 -->
    <div v-if="activeTab === 'logs'" class="flex-1 overflow-y-auto scroll-thin px-4 pb-4">
      <div class="max-w-3xl mx-auto pt-3 space-y-4">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <Icon icon="mdi:book-open-page-variant-outline" class="text-xl text-primary" />
            <div>
              <div class="text-sm font-semibold text-base-content">跑团日志（小说）</div>
              <div class="text-xs text-base-content/60">由各房间 KP 生成的小说片段，按时间倒序排列</div>
            </div>
          </div>
          <button
            type="button"
            class="btn btn-ghost btn-xs rounded-xl gap-1"
            :disabled="logsLoading"
            @click="fetchRoomLogs"
          >
            <Icon :icon="logsLoading ? 'mdi:loading' : 'mdi:refresh'" :class="logsLoading ? 'animate-spin text-sm' : 'text-sm'" />
            刷新
          </button>
        </div>

        <LoadingSpinner v-if="logsLoading" message="加载跑团日志中…" />
        <div v-else-if="logsError" class="alert alert-error text-xs sm:text-sm">
          {{ logsError }}
        </div>
        <div v-else-if="!roomLogs.length" class="flex flex-col items-center justify-center py-16 text-base-content/60 text-center">
          <Icon icon="mdi:book-outline" class="text-5xl mb-3 opacity-50" />
          <p class="text-sm sm:text-base">暂时还没有任何已生成的小说日志。</p>
          <p class="text-xs mt-1">当各房间 KP 在「日志记录」中生成小说后，会在这里以书本的形式汇总展示。</p>
        </div>
        <div v-else class="space-y-3">
          <article
            v-for="log in roomLogs"
            :key="log.id"
            class="bg-base-100 rounded-2xl border border-base-300/80 shadow-sm hover:shadow-md transition-shadow p-4 sm:p-5"
          >
            <header class="flex items-start justify-between gap-3 mb-3">
              <div class="min-w-0">
                <div class="text-xs font-medium text-primary/80 flex items-center gap-1">
                  <Icon icon="mdi:dice-multiple" class="text-sm" />
                  {{ log.roomTitle || '未知房间' }}
                </div>
                <h2 class="mt-1 text-base sm:text-lg font-semibold text-base-content truncate">
                  {{ log.title }}
                </h2>
                <div class="mt-1 text-[11px] text-base-content/60 flex items-center gap-2">
                  <Icon icon="mdi:calendar-blank-outline" class="text-xs" />
                  <span>{{ log.date }}</span>
                </div>
              </div>
            </header>
            <div class="text-sm text-base-content/80 leading-relaxed whitespace-pre-wrap">
              <span v-if="!log.expanded">
                {{ log.preview }}
                <button
                  v-if="log.hasMore"
                  type="button"
                  class="ml-1 text-xs text-primary hover:underline"
                  @click="toggleLogExpanded(log.id)"
                >
                  展开全文
                </button>
              </span>
              <span v-else>
                {{ log.content }}
                <button
                  type="button"
                  class="ml-1 text-xs text-primary hover:underline"
                  @click="toggleLogExpanded(log.id)"
                >
                  收起
                </button>
              </span>
            </div>
          </article>
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

</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { Menu, MenuButton, MenuItems } from '@headlessui/vue'
import PageHeader from '../components/PageHeader.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import BottomSheet from '../components/BottomSheet.vue'
import { useToast } from '../composables/useToast'
import { formatDate } from '../utils/date'
import { ROOM_STATUS, ROOM_STATUS_LABELS, ROOM_CHARACTER_STATUS } from '../constants/enums'
import { useGameRoomsStore } from '../stores/gameRooms'
import { useAuthStore } from '../stores/auth'
import { useProfileCache } from '../stores/profileCache'
import { supabase } from '../lib/supabase'

const router = useRouter()
const profileCache = useProfileCache()
const { rooms, availableModules, fetchRooms, fetchModules, fetchTags, applyToRoom } = useGameRoomsStore()
const authStore = useAuthStore()
const myId = computed(() => authStore.user?.value?.id)
const toast = useToast()

// 顶部 Tab：'rooms' | 'logs'
const activeTab = ref('rooms')

// 跑团日志（小说）列表
const roomLogs = ref([])
const logsLoading = ref(false)
const logsError = ref('')
const expandedLogIds = ref(new Set())

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
  if (room.status !== ROOM_STATUS.RECRUITING) return false
  if (room.ownerId === myId.value) return true
  return room.myApplicationStatus === ROOM_CHARACTER_STATUS.ACCEPTED
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

watch(activeTab, (tab) => {
  if (tab === 'logs' && !roomLogs.value.length && !logsLoading.value) {
    fetchRoomLogs()
  }
})

// 搜索和筛选
const searchQuery = ref('')
const selectedStatuses = ref([ROOM_STATUS.RECRUITING, ROOM_STATUS.FULL, ROOM_STATUS.STARTED])
const selectedModules = ref([])

const statusFilters = [
  { value: ROOM_STATUS.RECRUITING, label: ROOM_STATUS_LABELS[ROOM_STATUS.RECRUITING] },
  { value: ROOM_STATUS.FULL, label: ROOM_STATUS_LABELS[ROOM_STATUS.FULL] },
  { value: ROOM_STATUS.STARTED, label: ROOM_STATUS_LABELS[ROOM_STATUS.STARTED] },
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
  selectedStatuses.value = [ROOM_STATUS.RECRUITING, ROOM_STATUS.FULL, ROOM_STATUS.STARTED]
  selectedModules.value = []
  searchQuery.value = ''
}

function goCreateRoomPage() {
  router.push({ name: 'game-room-new' })
}

async function onApplyToRoom(roomId) {
  const room = rooms.value.find((r) => r.id === roomId)
  if (!room || room.status !== ROOM_STATUS.RECRUITING) return
  const res = await applyToRoom(roomId)
  if (res?.ok) {
    toast.success(res.message || `已申请加入「${room.title}」，等待 KP 审核`)
  } else {
    toast.error(res?.message || '申请失败，请稍后重试')
  }
}

function getStatusLabel(status) {
  return ROOM_STATUS_LABELS[status] || status
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
      .eq('status', ROOM_CHARACTER_STATUS.ACCEPTED)
    
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

// 跑团日志：从 room_log_novels 汇总为“书本”列表
async function fetchRoomLogs() {
  logsLoading.value = true
  logsError.value = ''
  try {
    const { data, error } = await supabase
      .from('room_log_novels')
      .select('room_id, date, content')
      .order('date', { ascending: false })

    if (error) throw error
    const rows = data || []
    const roomIds = Array.from(new Set(rows.map((r) => r.room_id).filter(Boolean)))
    let roomTitleById = {}
    if (roomIds.length) {
      const { data: roomRows, error: roomErr } = await supabase
        .from('game_rooms')
        .select('id, title')
        .in('id', roomIds)
      if (!roomErr && roomRows) {
        roomTitleById = Object.fromEntries(roomRows.map((r) => [r.id, r.title || '未命名房间']))
      }
    }

    const next = rows.map((r) => {
      const full = r.content || ''
      const preview = full.length > 160 ? `${full.slice(0, 160)}…` : full
      return {
        id: `${r.room_id}-${r.date}`,
        roomId: r.room_id,
        roomTitle: roomTitleById[r.room_id] || '未知房间',
        date: r.date,
        content: full,
        preview,
        hasMore: full.length > 160,
        expanded: expandedLogIds.value.has(`${r.room_id}-${r.date}`),
      }
    })
    roomLogs.value = next
  } catch (e) {
    logsError.value = e.message || '加载跑团日志失败'
  } finally {
    logsLoading.value = false
  }
}

function toggleLogExpanded(id) {
  const next = new Set(expandedLogIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedLogIds.value = next
  roomLogs.value = roomLogs.value.map((log) =>
    log.id === id ? { ...log, expanded: next.has(id) } : log
  )
}
</script>