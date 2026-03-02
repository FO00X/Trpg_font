<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { Dialog, DialogOverlay, DialogPanel, DialogTitle } from '@headlessui/vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import PageHeader from '../components/PageHeader.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import { useToast } from '../composables/useToast'
import { formatDateTime, formatRelativeShort } from '../utils/date'
import { ROOM_CHARACTER_STATUS } from '../constants/enums'
import { useNotificationsStore } from '../stores/notifications'
import { useGameRoomsStore } from '../stores/gameRooms'
import { useUpdateLogsStore } from '../stores/updateLogs'
import { useAuthStore } from '../stores/auth'

function renderMarkdown(text) {
  if (!text || typeof text !== 'string') return ''
  const raw = marked.parse(text.trim(), { gfm: true })
  return DOMPurify.sanitize(raw, { ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'code', 'pre', 'h1', 'h2', 'h3', 'blockquote', 'hr'], ALLOWED_ATTR: ['href', 'target', 'rel'] })
}

const router = useRouter()
const notificationsStore = useNotificationsStore()
const gameRoomsStore = useGameRoomsStore()
const updateLogsStore = useUpdateLogsStore()
const authStore = useAuthStore()
const toast = useToast()

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
    toast.error('无法解析房间信息，请稍后重试')
    return
  }
  const res = await gameRoomsStore.updateApplicationStatus(info.roomId, info.applicantId, ROOM_CHARACTER_STATUS.ACCEPTED)
  if (!res.ok) {
    toast.error(res.message || '操作失败')
    return
  }
  await notificationsStore.setDecision(n.id, ROOM_CHARACTER_STATUS.ACCEPTED)
}

async function onReject(n) {
  console.log('onReject', n)
  if (n.decision) return
  const info = parseRoomApplyInfo(n)
  if (!info) {
    toast.error('无法解析房间信息，请稍后重试')
    return
  }
  const res = await gameRoomsStore.updateApplicationStatus(info.roomId, info.applicantId, ROOM_CHARACTER_STATUS.REJECTED)
  if (!res.ok) {
    toast.error(res.message || '操作失败')
    return
  }
  await notificationsStore.setDecision(n.id, ROOM_CHARACTER_STATUS.REJECTED)
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

const updateLogsTimeline = computed(() => updateLogsStore.list.value || [])
const expandedLogId = ref(null)


watch(
  updateLogsTimeline,
  (list) => {
    if (list?.length && (!expandedLogId.value || !list.some((i) => i.id === expandedLogId.value))) {
      expandedLogId.value = list[0].id
    }
  },
  { immediate: true }
)

function toggleLogExpand(item) {
  expandedLogId.value = expandedLogId.value === item.id ? null : item.id
}

function isLogExpanded(item) {
  return expandedLogId.value === item.id
}
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="系统通知" icon="mdi:bell-outline">
      <template #actions>
        <button
          v-if="activeTab === 'notifications' && notificationsStore.unreadCount > 0"
          type="button"
          class="px-3 py-1.5 rounded-xl text-sm font-medium text-primary hover:bg-primary/10 active:scale-95 transition-all"
          @click="markAllRead"
        >
          全部已读
        </button>
      </template>
    </PageHeader>

    <!-- 通知 Tab -->
    <div v-show="activeTab === 'notifications'" class="flex-1 min-h-0 overflow-y-auto scroll-thin px-4" style="padding-bottom: calc(1rem + 56px + env(safe-area-inset-bottom, 0px));">
      <!-- 统计摘要 -->
      <div class="sticky top-0 z-10 -mx-4 px-4 py-3 bg-base-200/95 backdrop-blur-sm flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <span class="text-sm text-base-content/70">
            共 <span class="font-semibold text-base-content">{{ notificationsStore.list.value.length }}</span> 条
          </span>
          <span v-if="notificationsStore.unreadCount > 0" class="px-2 py-0.5 rounded-full text-xs font-medium bg-accent/15 text-accent">
            {{ notificationsStore.unreadCount }} 未读
          </span>
        </div>
      </div>

      <LoadingSpinner v-if="loading" message="加载中…" />
      <div v-else-if="error" class="rounded-2xl bg-error/10 text-error px-4 py-3 text-sm">{{ error }}</div>
      <div v-else-if="!notificationsStore.list.value.length" class="flex flex-col items-center justify-center py-16 text-center">
        <div class="w-16 h-16 rounded-2xl bg-base-200 flex items-center justify-center mb-4">
          <Icon icon="mdi:bell-outline" class="text-4xl text-base-content/30" />
        </div>
        <p class="text-base-content/60 font-medium">暂无通知</p>
        <p class="text-sm text-base-content/40 mt-1">有新消息时会出现在这里</p>
      </div>
      <div v-else class="space-y-3 pb-2">
        <button
          v-for="n in notificationsStore.list.value"
          :key="n.id"
          type="button"
          :class="[
            'w-full flex gap-4 p-4 rounded-2xl text-left transition-all active:scale-[0.99]',
            n.read ? 'bg-base-100 shadow-sm' : 'bg-base-100 shadow-sm border-l-4 border-l-primary',
            n.decision ? 'opacity-70 cursor-default' : 'hover:shadow-md',
          ]"
          :disabled="!!n.decision"
          @click="openNotification(n)"
        >
          <div :class="['w-12 h-12 rounded-2xl flex items-center justify-center shrink-0', n.read ? 'bg-base-200' : 'bg-primary/10']">
            <Icon :icon="iconForType(n.type)" :class="['text-xl', n.read ? 'text-base-content/50' : 'text-primary']" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-base-content truncate">{{ n.title }}</div>
            <div class="text-sm text-base-content/70 mt-0.5 line-clamp-2">
              {{ n.content }}
              <span v-if="n.type === 'room_apply' && roomTitle(n)" class="text-primary/80 font-semibold">{{ roomTitle(n) }}</span>
            </div>
            <div class="text-xs text-base-content/40 mt-2">{{ formatRelativeShort(n.created_at) }}</div>
          </div>
          <div v-if="n.type === 'room_apply'" class="flex items-center gap-2 shrink-0 self-center" @click.stop>
            <template v-if="n.decision === ROOM_CHARACTER_STATUS.ACCEPTED">
              <span class="px-2.5 py-1 rounded-xl text-xs font-medium bg-success/10 text-success">已同意</span>
            </template>
            <template v-else-if="n.decision === ROOM_CHARACTER_STATUS.REJECTED">
              <span class="px-2.5 py-1 rounded-xl text-xs font-medium bg-error/10 text-error">已拒绝</span>
            </template>
            <template v-else>
              <button
                type="button"
                class="px-3 py-1.5 rounded-xl text-xs font-medium bg-success/15 text-success hover:bg-success/25 active:scale-95 transition-all"
                @click="onApprove(n)"
              >
                同意
              </button>
              <button
                type="button"
                class="px-3 py-1.5 rounded-xl text-xs font-medium bg-error/10 text-error hover:bg-error/20 active:scale-95 transition-all"
                @click="onReject(n)"
              >
                拒绝
              </button>
            </template>
          </div>
        </button>
      </div>
    </div>

    <!-- 更新记录 Tab -->
    <div v-show="activeTab === 'updates'" class="flex-1 min-h-0 overflow-y-auto scroll-thin px-4" style="padding-bottom: calc(1rem + 56px + env(safe-area-inset-bottom, 0px));">
      <div class="flex items-center justify-between mb-4 pt-2">
        <span class="text-sm text-base-content/60">版本更新与公告</span>
        <button
          v-if="isAdmin"
          type="button"
          class="flex items-center gap-2 p-2 rounded-full text-sm font-medium bg-primary text-primary-content shadow-sm shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all"
          @click="openAddLog"
        >
          <Icon icon="mdi:plus" class="text-xl" />
        </button>
      </div>
      <LoadingSpinner v-if="updateLogsLoading" message="加载中…" />
      <div v-else-if="!updateLogsTimeline.length" class="flex flex-col items-center justify-center py-16 text-center">
        <div class="w-16 h-16 rounded-2xl bg-base-200 flex items-center justify-center mb-4">
          <Icon icon="mdi:history" class="text-4xl text-base-content/30" />
        </div>
        <p class="text-base-content/60 font-medium">暂无更新记录</p>
        <p class="text-sm text-base-content/40 mt-1">版本更新与公告将在此展示</p>
      </div>
      <div v-else class="relative pl-5 pb-4">
        <!-- 时间轴竖线 -->
        <div class="absolute left-0 top-2 bottom-2 w-0.5 bg-base-300 rounded-full" />
        <div v-for="(item, index) in updateLogsTimeline" :key="item.id" class="relative flex gap-4 mb-4">
          <!-- 节点圆点 -->
          <div class="absolute -left-7 w-5 h-5 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center shrink-0 z-10">
            <div class="w-1.5 h-1.5 rounded-full bg-primary" />
          </div>
          <div
            class="flex-1 min-w-0 rounded-2xl bg-base-100 shadow-sm overflow-hidden transition-all"
            :class="isLogExpanded(item) ? '' : 'hover:shadow-md'"
          >
            <div
              class="flex items-start justify-between gap-3 px-4 py-2 cursor-pointer select-none active:scale-[0.99] transition-transform"
              @click="toggleLogExpand(item)"
            >
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-base-content">{{ item.title }}</h3>
                <span class="text-xs text-base-content/50 mt-1 block">{{ formatDateTime(item.created_at) }}</span>
              </div>

              <div v-if="isAdmin" class="flex items-center gap-1 shrink-0 -mr-1" @click.stop>
                <button
                  type="button"
                  class="text-base-content/60 hover:text-primary hover:bg-primary/10 active:scale-95 transition-all"
                  title="编辑"
                  @click="openEditLog(item)"
                >
                  <Icon icon="mdi:pencil-outline" class="text-xl" />
                </button>
                <button
                  type="button"
                  class="text-base-content/60 hover:text-error hover:bg-error/10 active:scale-95 transition-all"
                  title="删除"
                  @click="openDeleteConfirm(item)"
                >
                  <Icon icon="mdi:delete-outline" class="text-xl" />
                </button>
                <Icon
                :icon="isLogExpanded(item) ? 'mdi:chevron-up' : 'mdi:chevron-down'"
                class="text-xl text-base-content/40 shrink-0 transition-transform"
              />
              </div>
            </div>
            <Transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="opacity-0 max-h-0"
              enter-to-class="opacity-100 max-h-[500px]"
              leave-active-class="transition-all duration-150 ease-in"
              leave-from-class="opacity-100 max-h-[500px]"
              leave-to-class="opacity-0 max-h-0"
            >
              <div v-show="isLogExpanded(item)" class="border-t border-base-200">
                <div
                  v-if="item.content"
                  class="markdown-body px-4 py-2 text-sm text-base-content/90 leading-relaxed"
                  v-html="renderMarkdown(item.content)"
                />
                <div v-else class="px-4 py-4 text-sm text-base-content/50">暂无详细说明</div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部 Tab 栏（固定于视口底部） -->
    <div class="fixed bottom-0 left-0 right-0 z-20 bg-base-100/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.06)] flex" style="padding-bottom: env(safe-area-inset-bottom, 0px);">
      <button
        type="button"
        class="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs transition-colors active:scale-95"
        :class="activeTab === 'notifications' ? 'text-primary font-semibold' : 'text-base-content/60 hover:text-base-content'"
        @click="activeTab = 'notifications'"
      >
        <Icon icon="mdi:bell-outline" class="text-lg" />
        <span>通知</span>
      </button>
      <button
        type="button"
        class="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs transition-colors active:scale-95"
        :class="activeTab === 'updates' ? 'text-primary font-semibold' : 'text-base-content/60 hover:text-base-content'"
        @click="activeTab = 'updates'"
      >
        <Icon icon="mdi:history" class="text-lg" />
        <span>更新记录</span>
      </button>
    </div>

    <!-- 新增/编辑更新记录弹窗 -->
    <Dialog v-if="logDialogOpen" :open="true" @close="closeLogDialog" class="relative z-[10000]">
      <DialogOverlay class="fixed inset-0 bg-base-300/50 backdrop-blur-sm transition-opacity" />
      <div class="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel class="w-full max-w-lg rounded-2xl bg-base-100 shadow-2xl overflow-hidden focus:outline-none flex flex-col max-h-[90vh]">
          <!-- 弹窗头部 -->
          <div class="px-6 py-4 border-b border-base-200 flex justify-between items-center bg-base-200/30">
            <DialogTitle class="text-lg font-bold text-base-content">
              {{ logDialogMode === 'add' ? '新增更新记录' : '编辑更新记录' }}
            </DialogTitle>
            <button class="btn btn-ghost btn-sm btn-square" @click="closeLogDialog" title="关闭">
              <Icon icon="mdi:close" class="text-xl" />
            </button>
          </div>
          
          <!-- 表单内容区域 -->
          <div class="p-6 overflow-y-auto space-y-4">
            <div class="form-control w-full">
              <label class="label pt-0">
                <span class="label-text font-medium">标题 <span class="text-error">*</span></span>
              </label>
              <input
                v-model="logTitle"
                type="text"
                class="input input-bordered w-full focus:outline-none"
                placeholder="例如：v1.2.0 功能更新"
              />
            </div>
            
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-medium">内容</span>
                <span class="label-text-alt text-base-content/50 flex items-center gap-1">
                  <Icon icon="mdi:markdown" class="text-lg" />
                  支持 Markdown
                </span>
              </label>
              <textarea
                v-model="logContent"
                class="textarea textarea-bordered w-full h-48 leading-relaxed resize-y focus:outline-none"
                placeholder="在这里输入更新说明… (支持加粗、列表、链接等 Markdown 语法)"
              ></textarea>
            </div>
            
            <div v-if="logSaveError" class="alert alert-error text-sm py-2">
              <Icon icon="mdi:alert-circle-outline" class="text-lg shrink-0" />
              <span>{{ logSaveError }}</span>
            </div>
          </div>
          
          <!-- 底部操作按钮 -->
          <div class="px-6 py-4 border-t border-base-200 bg-base-200/30 flex justify-end gap-3">
            <button
              type="button"
              class="btn btn-ghost"
              @click="closeLogDialog"
            >
              取消
            </button>
            <button
              type="button"
              :disabled="logSaving || !logTitle.trim()"
              class="btn btn-primary px-8"
              @click="saveLog"
            >
              <span v-if="logSaving" class="loading loading-spinner loading-sm"></span>
              {{ logSaving ? '保存中' : '保存' }}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>

    <!-- 删除确认弹窗 -->
    <Dialog v-if="deleteConfirmOpen" :open="true" @close="closeDeleteConfirm" class="relative z-[10000]">
      <DialogOverlay class="fixed inset-0 bg-base-300/50 backdrop-blur-sm transition-opacity" />
      <div class="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel class="w-full max-w-sm rounded-2xl bg-base-100 shadow-2xl overflow-hidden focus:outline-none">
          <div class="p-6">
            <div class="flex items-center gap-3 mb-4 text-error">
              <Icon icon="mdi:alert-circle" class="text-3xl" />
              <DialogTitle class="text-lg font-bold text-base-content">确认删除</DialogTitle>
            </div>
            <p class="text-base-content/70 mb-6 pl-11">确定要删除这条更新记录吗？此操作无法撤销。</p>
            <div class="flex justify-end gap-3">
              <button type="button" class="btn btn-ghost" @click="closeDeleteConfirm">取消</button>
              <button type="button" class="btn btn-error" @click="confirmDelete">删除</button>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>

  </div>
</template>

<style scoped>
.markdown-body :deep(p) { margin: 0.35em 0; }
.markdown-body :deep(p:first-child) { margin-top: 0; }
.markdown-body :deep(p:last-child) { margin-bottom: 0; }
.markdown-body :deep(h1), .markdown-body :deep(h2), .markdown-body :deep(h3) { font-weight: 600; margin: 0.6em 0 0.3em; color: var(--color-primary); }
.markdown-body :deep(h1) { font-size: 1.15em; }
.markdown-body :deep(h2) { font-size: 1.08em; }
.markdown-body :deep(h3) { font-size: 1em; }
.markdown-body :deep(ul), .markdown-body :deep(ol) { margin: 0.3em 0; padding-left: 1.5em; }
.markdown-body :deep(li) { margin: 0.15em 0; }
.markdown-body :deep(a) { color: var(--color-primary); text-decoration: underline; }
.markdown-body :deep(a:hover) { opacity: 0.85; }
.markdown-body :deep(code) { background: var(--color-base-200); padding: 0.15em 0.4em; border-radius: 0.375rem; font-size: 0.9em; }
.markdown-body :deep(pre) { margin: 0.5em 0; padding: 0.75em; border-radius: 0.75rem; background: var(--color-base-200); overflow-x: auto; }
.markdown-body :deep(pre code) { background: none; padding: 0; }
.markdown-body :deep(blockquote) { margin: 0.4em 0; padding-left: 1em; border-left: 3px solid var(--color-primary); opacity: 0.9; }
.markdown-body :deep(hr) { border: none; border-top: 1px solid var(--color-base-300); margin: 0.6em 0; }
</style>