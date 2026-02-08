<template>
  <div
    v-if="isSystem"
    class="flex justify-center"
  >
    <span class="text-xs text-accent-muted bg-chat-panel px-3 py-1 rounded-full">
      {{ message.content }}
    </span>
  </div>
  <div
    v-else
    :class="[
      'flex gap-3',
      isSelf ? 'flex-row-reverse' : 'flex-row',
    ]"
  >
    <div
      class="w-9 h-9 rounded-full bg-sidebar-active flex items-center justify-center shrink-0 text-accent"
    >
      <Icon icon="mdi:account" class="text-lg" />
    </div>
    <div :class="['flex flex-col max-w-[75%]', isSelf ? 'items-end' : 'items-start']">
      <div class="flex items-baseline gap-2">
        <span class="text-sm font-medium text-accent">{{ message.userName }}</span>
        <span class="text-xs text-accent-muted">{{ timeStr }}</span>
      </div>
      <div
        :class="[
          'mt-0.5 px-3 py-2 rounded-2xl text-sm break-words',
          isSelf
            ? 'bg-accent text-chat-bg rounded-br-md'
            : 'bg-chat-panel border border-chat-border rounded-bl-md',
        ]"
      >
        {{ message.content }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { computed } from 'vue'
import { useChatStore } from '../stores/chat'

const props = defineProps({
  message: {
    type: Object,
    required: true,
  },
})

const { currentUser } = useChatStore()
const isSelf = computed(() => props.message.userId === currentUser.value.id)
const timeStr = computed(() => {
  const d = new Date(props.message.time)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
})
const isSystem = computed(() => props.message.type === 'system')
</script>
