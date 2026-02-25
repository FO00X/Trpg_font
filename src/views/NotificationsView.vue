<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import PageHeader from '../components/PageHeader.vue'
import { useNotificationsStore } from '../stores/notifications'
import { useGameRoomsStore } from '../stores/gameRooms'

const router = useRouter()
const notificationsStore = useNotificationsStore()
const gameRoomsStore = useGameRoomsStore()
const loading = ref(true)
const error = ref('')
const roomNameById = ref({})

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

onMounted(async () => {
  const res = await notificationsStore.fetchList()
  if (res.ok) {
    await loadRoomNamesForNotifications()
  } else {
    error.value = res.message || '加载失败'
  }
  loading.value = false
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
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="系统通知" icon="mdi:bell-outline">
      <template #actions>
        <button
          v-if="notificationsStore.unreadCount > 0"
          type="button"
          class="px-3 py-1.5 rounded-lg text-sm text-accent hover:bg-white/10"
          @click="markAllRead"
        >
          全部已读
        </button>
      </template>
    </PageHeader>
    <div class="flex-1 overflow-y-auto scroll-thin p-4">
      <div class="mb-2 text-xs text-accent-muted">
        通知总数：{{ notificationsStore.list.value.length }} | 未读数量：{{ notificationsStore.unreadCount }}
      </div>

      <div v-if="loading" class="text-accent-muted">加载中…</div>
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
  </div>
</template>