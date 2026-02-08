<template>
  <div class="p-4 border-t border-chat-border bg-chat-panel">
    <p v-if="isCurrentChannelReadOnly()" class="text-xs text-accent-muted mb-2">
      当前子频道仅可查看，不可发言。
    </p>
    <div class="flex items-end gap-2">
      <div class="flex-1 flex items-end gap-1 rounded-xl bg-chat-bg border border-chat-border focus-within:border-accent/50 transition-colors" :class="{ 'opacity-60': isCurrentChannelReadOnly() }">
        <textarea
          v-model="input"
          :placeholder="isCurrentChannelReadOnly() ? '无发言权限' : '输入消息... (Enter 发送)'"
          rows="1"
          :disabled="isCurrentChannelReadOnly()"
          class="flex-1 min-h-[40px] max-h-32 py-2.5 px-3 bg-transparent resize-none outline-none text-[#cdd6f4] placeholder:text-accent-muted text-sm disabled:cursor-not-allowed"
          @keydown="onKeydown"
        />
        <button
          type="button"
          class="p-2 text-accent-muted hover:text-accent hover:bg-white/5 rounded-lg transition-colors"
          title="表情"
          :disabled="isCurrentChannelReadOnly()"
        >
          <Icon icon="mdi:emoticon-outline" class="text-xl" />
        </button>
      </div>
      <button
        type="button"
        class="p-2.5 rounded-xl bg-accent text-chat-bg hover:opacity-90 transition-opacity shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        title="发送"
        :disabled="isCurrentChannelReadOnly()"
        @click="submit"
      >
        <Icon icon="mdi:send" class="text-xl" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useChatStore } from '../stores/chat'

const input = ref('')
const { sendMessage, isCurrentChannelReadOnly } = useChatStore()

function submit() {
  if (isCurrentChannelReadOnly()) return
  const text = input.value.trim()
  if (!text) return
  sendMessage(text)
  input.value = ''
}

function onKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    submit()
  }
}
</script>