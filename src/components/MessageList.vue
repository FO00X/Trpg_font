<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import { useChatStore } from '../stores/chat'
import MessageItem from './MessageItem.vue'

const listEl = ref(null)
const { currentMessages, currentChannelId } = useChatStore()

function scrollToBottom() {
  nextTick(() => {
    if (listEl.value) listEl.value.scrollTop = listEl.value.scrollHeight
  })
}

watch(
  () => [currentMessages.value.length, currentChannelId.value],
  () => scrollToBottom(),
  { flush: 'post' }
)
onMounted(() => scrollToBottom())
</script>

<template>
  <div ref="listEl" class="scroll-thin px-4 py-3 space-y-3">
    <MessageItem
      v-for="msg in currentMessages"
      :key="msg.id"
      :message="msg"
    />
  </div>
</template>
