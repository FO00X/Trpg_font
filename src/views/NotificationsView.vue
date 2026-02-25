<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import PageHeader from '../components/PageHeader.vue'
import { useNotificationsStore } from '../stores/notifications'

const router = useRouter()
const notificationsStore = useNotificationsStore()
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  const res = await notificationsStore.fetchList()
  loading.value = false
  if (!res.ok) error.value = res.message || '加载失败'
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
  if (!n.read) await notificationsStore.markAsRead(n.id)
  if (n.link) router.push(n.link)
}

async function markAllRead() {
  await notificationsStore.markAllRead()
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
      <div v-if="loading" class="text-accent-muted">加载中…</div>
      <div v-else-if="error" class="text-red-400">{{ error }}</div>
      <div v-else-if="!notificationsStore.list.length" class="text-accent-muted text-center py-8">
        暂无通知
      </div>
      <div v-else class="space-y-2">
        <button
          v-for="n in notificationsStore.list"
          :key="n.id"
          type="button"
          :class="[
            'w-full flex gap-3 p-3 rounded-xl border transition-colors text-left',
            n.read ? 'bg-chat-panel border-chat-border' : 'bg-accent/5 border-accent/20',
          ]"
          @click="openNotification(n)"
        >
          <div class="w-10 h-10 rounded-lg bg-sidebar-active flex items-center justify-center shrink-0">
            <Icon :icon="iconForType(n.type)" class="text-xl text-accent" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-white truncate">{{ n.title }}</div>
            <div class="text-sm text-accent-muted truncate">{{ n.content }}</div>
            <div class="text-xs text-accent-muted mt-1">{{ formatTime(n.created_at) }}</div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>
