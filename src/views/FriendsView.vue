<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import PageHeader from '../components/PageHeader.vue'

const friends = ref([
  { id: '1', name: '熊猫', status: 'online', lastMsg: '最近聊了什么' },
  { id: '2', name: '田中', status: 'online', lastMsg: '在吗？' },
  { id: '3', name: '方糕', status: 'offline', lastMsg: '明天见' },
  { id: '4', name: '言安', status: 'offline', lastMsg: '明天见' },
])
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="好友" icon="mdi:account-group" />
    <div class="flex-1 overflow-y-auto scroll-thin p-4">
      <div class="space-y-2">
        <div
          v-for="f in friends"
          :key="f.id"
          class="flex items-center gap-3 p-3 rounded-xl bg-chat-panel border border-chat-border hover:border-accent/30 transition-colors cursor-pointer"
        >
          <div class="w-10 h-10 rounded-full bg-sidebar-active flex items-center justify-center">
            <Icon icon="mdi:account" class="text-xl text-accent" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-white truncate">{{ f.name }}</div>
            <div class="text-sm text-accent-muted truncate">{{ f.lastMsg }}</div>
          </div>
          <span
            class="w-2.5 h-2.5 rounded-full shrink-0"
            :class="f.status === 'online' ? 'bg-green-500' : 'bg-accent-muted'"
          />
        </div>
      </div>
    </div>
  </div>
</template>
