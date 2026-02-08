<template>
  <div class="flex flex-col h-full">
    <!-- 频道头部 -->
    <header class="h-14 shrink-0 flex items-center gap-2 px-4 border-b border-chat-border bg-chat-panel">
      <button
        type="button"
        class="p-2 -ml-2 rounded-lg text-accent-muted hover:text-white hover:bg-white/5 transition-colors"
        :title="sidebarOpen ? '收起侧边栏' : '展开侧边栏'"
        :aria-label="sidebarOpen ? '收起侧边栏' : '展开侧边栏'"
        @click="$emit('toggle-sidebar')"
      >
        <Icon :icon="sidebarOpen ? 'mdi:backburger' : 'mdi:menu'" class="text-xl" />
      </button>
      <Icon :icon="currentChannel?.icon || 'mdi:hash'" class="text-xl text-accent" />
      <h1 class="font-semibold text-white">{{ currentChannel?.name || '频道' }}</h1>
    </header>

    <!-- 消息列表 -->
    <MessageList class="flex-1 overflow-y-auto min-h-0" />

    <!-- 输入区 -->
    <MessageInput class="shrink-0" />
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { useChatStore } from '../stores/chat'
import MessageList from './MessageList.vue'
import MessageInput from './MessageInput.vue'

defineProps({
  sidebarOpen: { type: [Boolean, Object], default: true },
})
defineEmits(['toggle-sidebar'])

const { currentChannel } = useChatStore()
</script>