<script setup>
import { ref, inject } from 'vue'
import { Icon } from '@iconify/vue'

const sidebarOpen = inject('sidebarOpen')
const toggleSidebar = inject('toggleSidebar')

const notifications = ref([
  { id: '1', type: 'system', title: '系统维护通知', content: '将于本周六 2:00-4:00 进行维护', time: '2024-01-14 10:00', read: false },
  { id: '2', type: 'invite', title: '跑团邀请', content: '熊猫 邀请你加入「星海传说」', time: '2024-01-13 15:30', read: true },
  { id: '3', type: 'friend', title: '好友申请', content: '田中 请求添加你为好友', time: '2024-01-12 09:20', read: true },
])
</script>

<template>
  <div class="flex flex-col h-full">
    <header class="h-14 shrink-0 flex items-center gap-2 px-4 border-b border-chat-border bg-chat-panel">
      <button
        type="button"
        class="p-2 -ml-2 rounded-lg text-accent-muted hover:text-white hover:bg-white/5 transition-colors"
        :title="sidebarOpen ? '收起侧边栏' : '展开侧边栏'"
        @click="toggleSidebar"
      >
        <Icon :icon="sidebarOpen ? 'mdi:backburger' : 'mdi:menu'" class="text-xl" />
      </button>
      <Icon icon="mdi:bell-outline" class="text-xl text-accent" />
      <h1 class="font-semibold text-white">系统通知</h1>
    </header>
    <div class="flex-1 overflow-y-auto scroll-thin p-4">
      <div class="space-y-2">
        <div
          v-for="n in notifications"
          :key="n.id"
          :class="[
            'flex gap-3 p-3 rounded-xl border transition-colors cursor-pointer',
            n.read ? 'bg-chat-panel border-chat-border' : 'bg-accent/5 border-accent/20',
          ]"
        >
          <div class="w-10 h-10 rounded-lg bg-sidebar-active flex items-center justify-center shrink-0">
            <Icon icon="mdi:bell" class="text-xl text-accent" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-white truncate">{{ n.title }}</div>
            <div class="text-sm text-accent-muted truncate">{{ n.content }}</div>
            <div class="text-xs text-accent-muted mt-1">{{ n.time }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
