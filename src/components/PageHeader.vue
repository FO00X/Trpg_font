<script setup>
import { inject } from 'vue'
import { Icon } from '@iconify/vue'

defineProps({
  title: { type: String, default: '' },
  icon: { type: String, default: '' },
  showBack: { type: Boolean, default: false },
  backLabel: { type: String, default: '返回' },
})
const emit = defineEmits(['back'])

const sidebarOpen = inject('sidebarOpen')
const toggleSidebar = inject('toggleSidebar')
</script>

<template>
  <header class="h-14 shrink-0 flex items-center gap-2 px-4 border-b border-chat-border bg-chat-panel">
    <button
      type="button"
      class="p-2 -ml-2 rounded-lg text-accent-muted hover:text-white hover:bg-white/5 transition-colors"
      :title="sidebarOpen ? '收起侧边栏' : '展开侧边栏'"
      @click="toggleSidebar"
    >
      <Icon :icon="sidebarOpen ? 'mdi:backburger' : 'mdi:menu'" class="text-xl" />
    </button>
    <button
      v-if="showBack"
      type="button"
      class="p-1 rounded text-accent-muted hover:text-white"
      :title="backLabel"
      @click="emit('back')"
    >
      <Icon icon="mdi:arrow-left" class="text-xl" />
    </button>
    <Icon v-if="icon" :icon="icon" class="text-xl text-accent shrink-0" />
    <h1 class="font-semibold text-white truncate min-w-0">{{ title }}</h1>
    <div class="ml-auto shrink-0">
      <slot name="actions" />
    </div>
  </header>
</template>
