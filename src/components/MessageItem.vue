<template>
  <div
    v-if="isSystem"
    class="flex justify-center"
  >
    <span class="text-xs text-accent-muted bg-chat-panel px-3 py-1 rounded-full">
      {{ message.content }}
    </span>
  </div>
  <div v-else :class="['flex gap-3', isSelf ? 'flex-row-reverse' : 'flex-row']">
    <div
      class="w-9 h-9 rounded-full bg-sidebar-active flex items-center justify-center shrink-0 text-accent"
    >
      <Icon icon="mdi:account" class="text-lg" />
    </div>
    <div :class="['flex flex-col max-w-[75%]', isSelf ? 'items-end' : 'items-start']">
      <div class="flex items-baseline gap-2 mb-0.5">
        <span
          v-if="!isDirectChannel"
          class="px-2 py-0.5 rounded text-xs font-medium"
          :class="speakerBadge.class"
        >
          {{ speakerBadge.text }}
        </span>
        <span class="text-sm font-medium text-accent">{{ speakerName }}</span>
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

const { currentUser, currentChannelId } = useChatStore()
const isSelf = computed(() => props.message.userId === currentUser.value?.id)
const isDirectChannel = computed(() => (currentChannelId.value || '').startsWith('dm:'))
const timeStr = computed(() => {
  const d = new Date(props.message.time)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
})
const isSystem = computed(() => props.message.type === 'system')

const speakerName = computed(() => {
  const msg = props.message
  if (msg.type === 'system') return '骰娘'
  if (msg.speakerRole === 'kp') return 'KP'
  if (msg.speakerRole === 'npc' && msg.speakerNpcName) return msg.speakerNpcName
  return msg.userName || '未知'
})

const speakerBadge = computed(() => {
  const msg = props.message
  if (msg.type === 'system') return { text: '骰娘', class: 'bg-accent-muted/20 text-accent-muted' }
  if (msg.speakerRole === 'kp') return { text: 'KP', class: 'bg-blue-500/20 text-blue-400' }
  if (msg.speakerRole === 'npc') return { text: 'NPC', class: 'bg-purple-500/20 text-purple-400' }
  return { text: 'PL', class: 'bg-green-500/20 text-green-400' }
})
</script>
