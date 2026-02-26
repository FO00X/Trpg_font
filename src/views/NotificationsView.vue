<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { Dialog, DialogOverlay, DialogPanel, DialogTitle } from '@headlessui/vue'
import PageHeader from '../components/PageHeader.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import { useNotificationsStore } from '../stores/notifications'
import { useGameRoomsStore } from '../stores/gameRooms'
import { useUpdateLogsStore } from '../stores/updateLogs'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const notificationsStore = useNotificationsStore()
const gameRoomsStore = useGameRoomsStore()
const updateLogsStore = useUpdateLogsStore()
const authStore = useAuthStore()

const activeTab = ref('notifications') // 'notifications' | 'updates'
const loading = ref(true)
const error = ref('')
const roomNameById = ref({})
const updateLogsLoading = ref(false)
const isAdmin = computed(() => authStore.user?.value?.role === 'admin')

// 更新记录弹窗
const logDialogOpen = ref(false)
const logDialogMode = ref('add') // 'add' | 'edit'
const logEditId = ref(null)
const logTitle = ref('')
const logContent = ref('')
const logSaveError = ref('')
const logSaving = ref(false)
const deleteConfirmId = ref(null)
const deleteConfirmOpen = ref(false)

async function loadRoomNamesForNotifications() {
  const ids = new Set()
  const list = notificationsStore.list.value || []
  for (const n of list) {
    if (n.type !== 'room_apply') continue
    const info = parseRoomApplyInfo(n)
    if (info?.roomId && !roomNameById.value[info.roomId]) {
      ids.add(info.roomId)
    }
  }
  for (const roomId of ids) {
    let room = gameRoomsStore.getRoomById?.(roomId)
    if (!room && gameRoomsStore.fetchRoom) {
      room = await gameRoomsStore.fetchRoom(roomId)
    }
    if (room?.title) {
      roomNameById.value = { ...roomNameById.value, [roomId]: room.title }
    }
  }
}

async function fetchUpdateLogs() {
  updateLogsLoading.value = true
  await updateLogsStore.fetchList()
  updateLogsLoading.value = false
}

onMounted(async () => {
  const res = await notificationsStore.fetchList()
  if (res.ok) {
    await loadRoomNamesForNotifications()
  } else {
    error.value = res.message || '加载失败'
  }
  loading.value = false
})

watch(activeTab, (tab) => {
  if (tab === 'updates') fetchUpdateLogs()
})

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function iconForType(type) {
  const map = { system: 'mdi:bell', friend_request: 'mdi:account-plus', room_invite: 'mdi:door-open', room_apply: 'mdi:door-open' }
  return map[type] || 'mdi:bell'
}

async function openNotification(n) {
  const requiresAction = n.type === 'room_apply'

  // 需要用户操作的通知，在用户未进行同意/拒绝前不标记为已读
  if (requiresAction && !n.decision) {
    if (n.link) router.push(n.link)
    return
  }

  if (!n.read) await notificationsStore.markAsRead(n.id)
  if (n.link) router.push(n.link)
}

function parseRoomApplyInfo(n) {
  if (n.type !== 'room_apply' || !n.link) return null
  try {
    const url = new URL(n.link, window.location.origin)
    const segments = url.pathname.split('/').filter(Boolean)
    const roomId = segments[1] // /game-rooms/:id
    const applicant = url.searchParams.get('applicant')
    if (!roomId || !applicant) return null
    return { roomId, applicantId: applicant }
  } catch {
    return null
  }
}

async function onApprove(n) {
  console.log('onApprove', n)
  if (n.decision) return
  const info = parseRoomApplyInfo(n)
  if (!info) {
    alert('无法解析房间信息，请稍后重试')
    return
  }
  const res = await gameRoomsStore.updateApplicationStatus(info.roomId, info.applicantId, 'accepted')
  if (!res.ok) {
    alert(res.message || '操作失败')
    return
  }
  await notificationsStore.setDecision(n.id, 'accepted')
}

async function onReject(n) {
  console.log('onReject', n)
  if (n.decision) return
  const info = parseRoomApplyInfo(n)
  if (!info) {
    alert('无法解析房间信息，请稍后重试')
    return
  }
  const res = await gameRoomsStore.updateApplicationStatus(info.roomId, info.applicantId, 'rejected')
  if (!res.ok) {
    alert(res.message || '操作失败')
    return
  }
  await notificationsStore.setDecision(n.id, 'rejected')
}

async function markAllRead() {
  await notificationsStore.markAllRead()
}

function roomTitle(n) {
  if (n.type !== 'room_apply') return ''
  const info = parseRoomApplyInfo(n)
  if (!info) return ''
  return roomNameById.value[info.roomId] || ''
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function openAddLog() {
  logDialogMode.value = 'add'
  logEditId.value = null
  logTitle.value = ''
  logContent.value = ''
  logSaveError.value = ''
  logDialogOpen.value = true
}

function openEditLog(item) {
  logDialogMode.value = 'edit'
  logEditId.value = item.id
  logTitle.value = item.title || ''
  logContent.value = item.content || ''
  logSaveError.value = ''
  logDialogOpen.value = true
}

async function saveLog() {
  if (!logTitle.value.trim()) {
    logSaveError.value = '请输入标题'
    return
  }
  logSaving.value = true
  logSaveError.value = ''
  const res = logDialogMode.value === 'add'
    ? await updateLogsStore.create({ title: logTitle.value, content: logContent.value })
    : await updateLogsStore.update(logEditId.value, { title: logTitle.value, content: logContent.value })
  logSaving.value = false
  if (res.ok) {
    logDialogOpen.value = false
  } else {
    logSaveError.value = res.message || '保存失败'
  }
}

function openDeleteConfirm(item) {
  deleteConfirmId.value = item.id
  deleteConfirmOpen.value = true
}

async function confirmDelete() {
  if (!deleteConfirmId.value) return
  await updateLogsStore.remove(deleteConfirmId.value)
  deleteConfirmId.value = null
  deleteConfirmOpen.value = false
}

function closeLogDialog() {
  logDialogOpen.value = false
}

function closeDeleteConfirm() {
  deleteConfirmOpen.value = false
}

// 时间轴：最新在上（与接口 order 一致）
const updateLogsTimeline = computed(() => updateLogsStore.list.value || [])
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="系统通知" icon="mdi:bell-outline">
      <template #actions>
        <button
          v-if="activeTab === 'notifications' && notificationsStore.unreadCount > 0"
          type="button"
          class="px-3 py-1.5 rounded-lg text-sm text-accent hover:bg-white/10"
          @click="markAllRead"
        >
          全部已读
        </button>
      </template>
    </PageHeader>

    <!-- Tab 切换 -->
    <div class="flex border-b border-chat-border shrink-0">
      <button
        type="button"
        :class="[
          'flex-1 py-3 text-sm font-medium transition-colors',
          activeTab === 'notifications' ? 'text-accent border-b-2 border-accent' : 'text-accent-muted hover:text-white',
        ]"
        @click="activeTab = 'notifications'"
      >
        通知
      </button>
      <button
        type="button"
        :class="[
          'flex-1 py-3 text-sm font-medium transition-colors',
          activeTab === 'updates' ? 'text-accent border-b-2 border-accent' : 'text-accent-muted hover:text-white',
        ]"
        @click="activeTab = 'updates'"
      >
        更新记录
      </button>
    </div>

    <!-- 通知 Tab -->
    <div v-show="activeTab === 'notifications'" class="flex-1 overflow-y-auto scroll-thin p-4">
      <div class="mb-2 text-xs text-accent-muted">
        通知总数：{{ notificationsStore.list.value.length }} | 未读数量：{{ notificationsStore.unreadCount }}
      </div>

      <LoadingSpinner v-if="loading" message="加载中…" />
      <div v-else-if="error" class="text-red-400">{{ error }}</div>
      <div v-else-if="!notificationsStore.list.value.length" class="text-accent-muted text-center py-8">
        暂无通知
      </div>
      <div v-else class="space-y-2">
        <button
          v-for="n in notificationsStore.list.value"
          :key="n.id"
          type="button"
          :class="[
            'w-full flex gap-3 p-3 rounded-xl border transition-colors text-left',
            n.read ? 'bg-chat-panel border-chat-border' : 'bg-accent/5 border-accent/20',
            n.decision ? 'opacity-60 cursor-default' : '',
          ]"
          :disabled="!!n.decision"
          @click="openNotification(n)"
        >
          <div class="w-10 h-10 rounded-lg bg-sidebar-active flex items-center justify-center shrink-0">
            <Icon :icon="iconForType(n.type)" class="text-xl text-accent" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-white truncate">{{ n.title }}</div>
            <div class="text-sm text-accent-muted">
              {{ n.content }}
              <span
                v-if="n.type === 'room_apply' && roomTitle(n)"
                class="ml-1 text-xs text-accent"
              >
                （房间：{{ roomTitle(n) }}）
              </span>
            </div>
            <div class="text-xs text-accent-muted mt-1">{{ formatTime(n.created_at) }}</div>
          </div>
          <div
            v-if="n.type === 'room_apply'"
            class="flex items-center gap-2 shrink-0"
            @click.stop
          >
            <template v-if="n.decision === 'accepted'">
              <span class="px-2 py-1 rounded-lg border border-green-500/30 text-xs text-accent-muted bg-green-500/5">
                已同意
              </span>
            </template>
            <template v-else-if="n.decision === 'rejected'">
              <span class="px-2 py-1 rounded-lg border border-red-500/30 text-xs text-accent-muted bg-red-500/5">
                已拒绝
              </span>
            </template>
            <template v-else>
              <button
                type="button"
                class="px-2 py-1 rounded-lg bg-green-500/20 border border-green-500/40 text-xs text-green-300 hover:bg-green-500/30"
                @click="onApprove(n)"
              >
                同意
              </button>
              <button
                type="button"
                class="px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/40 text-xs text-red-300 hover:bg-red-500/20"
                @click="onReject(n)"
              >
                拒绝
              </button>
            </template>
          </div>
        </button>
      </div>
    </div>

    <!-- 更新记录 Tab：时间轴 -->
    <div v-show="activeTab === 'updates'" class="flex-1 overflow-y-auto scroll-thin p-4">
      <div class="flex items-center justify-between mb-4">
        <span class="text-xs text-accent-muted">最新在上</span>
        <button
          v-if="isAdmin"
          type="button"
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-accent/20 text-accent border border-accent/40 hover:bg-accent/30"
          @click="openAddLog"
        >
          <Icon icon="mdi:plus" class="text-lg" />
          新增
        </button>
      </div>
      <LoadingSpinner v-if="updateLogsLoading" message="加载中…" />
      <div v-else-if="!updateLogsTimeline.length" class="text-accent-muted text-center py-12">
        暂无更新记录
      </div>
      <div v-else class="relative pl-6 border-l-2 border-chat-border border-opacity-60 space-y-0">
        <div
          v-for="(item, index) in updateLogsTimeline"
          :key="item.id"
          class="relative flex gap-4 pb-8"
          :class="{ 'pb-8': index < updateLogsTimeline.length - 1 }"
        >
          <!-- 时间轴节点 -->
          <div class="absolute left-0 -translate-x-[calc(1.5rem+3px)] w-3 h-3 rounded-full bg-accent border-2 border-chat-bg shrink-0 mt-1.5" />
          <div class="flex-1 min-w-0 rounded-xl bg-chat-panel border border-chat-border p-4">
            <div class="flex items-start justify-between gap-2 mb-1">
              <h3 class="font-medium text-white">{{ item.title }}</h3>
              <div v-if="isAdmin" class="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  class="p-1.5 rounded-lg text-accent-muted hover:text-accent hover:bg-white/10"
                  title="编辑"
                  @click="openEditLog(item)"
                >
                  <Icon icon="mdi:pencil" class="text-base" />
                </button>
                <button
                  type="button"
                  class="p-1.5 rounded-lg text-accent-muted hover:text-red-400 hover:bg-red-500/10"
                  title="删除"
                  @click="openDeleteConfirm(item)"
                >
                  <Icon icon="mdi:delete-outline" class="text-base" />
                </button>
              </div>
            </div>
            <p v-if="item.content" class="text-sm text-accent-muted whitespace-pre-wrap mb-2">{{ item.content }}</p>
            <div class="text-xs text-accent-muted">{{ formatDate(item.created_at) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/编辑更新记录弹窗 -->
    <Dialog v-if="logDialogOpen" :open="true" @close="closeLogDialog" class="relative z-[10000]">
      <DialogOverlay class="fixed inset-0 bg-black/50" />
      <div class="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel class="w-full max-w-md rounded-xl bg-sidebar border border-chat-border shadow-xl p-4 focus:outline-none">
          <DialogTitle class="text-sm font-medium text-accent-muted uppercase tracking-wider mb-3">
            {{ logDialogMode === 'add' ? '新增更新记录' : '编辑更新记录' }}
          </DialogTitle>
          <div class="space-y-3 mb-4">
            <div>
              <label class="block text-xs text-accent-muted mb-1">标题 *</label>
              <input
                v-model="logTitle"
                type="text"
                class="w-full px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-white placeholder-accent-muted focus:border-accent outline-none"
                placeholder="例如：v1.2.0 功能更新"
              />
            </div>
            <div>
              <label class="block text-xs text-accent-muted mb-1">内容（可选）</label>
              <textarea
                v-model="logContent"
                rows="4"
                class="w-full px-3 py-2 rounded-lg bg-chat-bg border border-chat-border text-white placeholder-accent-muted focus:border-accent outline-none resize-y"
                placeholder="更新说明…"
              />
            </div>
            <p v-if="logSaveError" class="text-sm text-red-400">{{ logSaveError }}</p>
          </div>
          <div class="flex justify-end gap-2">
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg text-accent-muted hover:text-white text-sm"
              @click="closeLogDialog"
            >
              取消
            </button>
            <button
              type="button"
              :disabled="logSaving"
              class="px-4 py-2 rounded-lg bg-accent text-chat-bg font-medium hover:opacity-90 text-sm disabled:opacity-50"
              @click="saveLog"
            >
              {{ logSaving ? '保存中…' : '保存' }}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>

    <!-- 删除确认弹窗 -->
    <Dialog v-if="deleteConfirmOpen" :open="true" @close="closeDeleteConfirm" class="relative z-[10000]">
      <DialogOverlay class="fixed inset-0 bg-black/50" />
      <div class="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel class="w-full max-w-sm rounded-xl bg-sidebar border border-chat-border shadow-xl p-4 focus:outline-none">
          <DialogTitle class="text-sm font-medium text-accent-muted uppercase tracking-wider mb-3">确认删除</DialogTitle>
          <p class="text-sm text-[#a6adc8] mb-4">确定要删除这条更新记录吗？</p>
          <div class="flex justify-end gap-2">
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg text-accent-muted hover:text-white text-sm"
              @click="closeDeleteConfirm"
            >
              取消
            </button>
            <button
              type="button"
              class="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 text-sm"
              @click="confirmDelete"
            >
              删除
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  </div>
</template>