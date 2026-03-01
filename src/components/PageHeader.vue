<script setup>
import { inject } from 'vue'
import { Icon } from '@iconify/vue'

defineProps({
  title: { type: String, default: '' },
  icon: { type: String, default: '' },
  showBack: { type: Boolean, default: false },
  backLabel: { type: String, default: '返回' },
  hideSidebar: { type: Boolean, default: false },
})
const emit = defineEmits(['back'])

const sidebarOpen = inject('sidebarOpen')
const toggleSidebar = inject('toggleSidebar')
</script>

<template>
  <header class="navbar h-14 shrink-0 px-4 bg-base-100 rounded-none z-10 relative">
    <div class="flex-none">
    <button 
    v-if="!hideSidebar"
        type="button"
        class="btn btn-square btn-ghost" 
        :title="sidebarOpen ? '收起侧边栏' : '展开侧边栏'"
        @click="toggleSidebar">
        <Icon :icon="sidebarOpen ? 'mdi:backburger' : 'mdi:menu'" class="text-xl" />
      </button>
      <button
        v-if="showBack"
        type="button"
        class="btn btn-ghost btn-square btn-sm"
        :title="backLabel"
        @click="emit('back')"
      >
        <Icon icon="mdi:arrow-left" class="text-xl" />
      </button>
  </div>
  <div class="flex-1 flex items-center gap-2 px-2">
      <Icon v-if="icon" :icon="icon" class="text-xl text-primary shrink-0" />
      <h1 class="font-bold text-lg text-base-content truncate min-w-0">{{ title }}</h1>
    </div>
    <div className="flex-none">
      <slot name="actions" />
    </div>
  </header>
</template>
