<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import PageHeader from '../components/PageHeader.vue'

const notes = ref([
  { id: '1', title: '跑团规则备忘', preview: '骰子规则：d20 用于主要判定...', updated: '2024-01-15' },
  { id: '2', title: '剧情线索', preview: '第一章：艾莉娅发现了古老的地图...', updated: '2024-01-12' },
])
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="笔记" icon="mdi:note-text-outline" />
    <div class="flex-1 overflow-y-auto scroll-thin p-4">
      <div class="space-y-2">
        <div
          v-for="n in notes"
          :key="n.id"
          class="flex items-start gap-3 p-3 rounded-xl bg-chat-panel border border-chat-border hover:border-accent/30 transition-colors cursor-pointer"
        >
          <div class="w-10 h-10 rounded-lg bg-sidebar-active flex items-center justify-center shrink-0">
            <Icon icon="mdi:note-text" class="text-xl text-accent" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-white truncate">{{ n.title }}</div>
            <div class="text-sm text-accent-muted line-clamp-2">{{ n.preview }}</div>
            <div class="text-xs text-accent-muted mt-1">{{ n.updated }}</div>
          </div>
          <Icon icon="mdi:chevron-right" class="text-accent-muted shrink-0 mt-1" />
        </div>
      </div>
    </div>
  </div>
</template>
