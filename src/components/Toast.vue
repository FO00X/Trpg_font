<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="message"
        class="fixed top-4 left-1/2 -translate-x-1/2 z-[10000] pointer-events-none"
      >
        <div class="alert shadow-lg text-sm max-w-md bg-base-200 text-base-content border border-base-300">
          {{ message }}
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import { Teleport, Transition } from 'vue'

const message = ref('')
let timer = null

function show(msg, duration = 3000) {
  message.value = msg
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    message.value = ''
    timer = null
  }, duration)
}

defineExpose({ show })
</script>
