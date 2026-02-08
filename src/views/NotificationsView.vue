<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import PageHeader from '../components/PageHeader.vue'

const notifications = ref([
  { id: '1', type: 'system', title: '系统维护通知', content: '将于本周六 2:00-4:00 进行维护', time: '2024-01-14 10:00', read: false },
  { id: '2', type: 'invite', title: '跑团邀请', content: '熊猫 邀请你加入「星海传说」', time: '2024-01-13 15:30', read: true },
  { id: '3', type: 'friend', title: '好友申请', content: '田中 请求添加你为好友', time: '2024-01-12 09:20', read: true },
])
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="系统通知" icon="mdi:bell-outline" />
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
