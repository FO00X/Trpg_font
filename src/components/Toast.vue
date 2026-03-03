<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="message"
        class="fixed top-4 left-1/2 -translate-x-1/2 z-10000 pointer-events-none"
      >
        <div
          class="pointer-events-auto max-w-5xl"
        >
          <div
            class="flex items-start gap-3 rounded-2xl border shadow-lg text-sm px-4 py-3 bg-base-100/95 backdrop-blur-md"
            :class="alertClass"
          >
            <div
              class="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full shrink-0"
              :class="iconWrapperClass"
            >
              <Icon
                :icon="iconName"
                class="text-lg"
              />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm leading-snug text-base-content wrap-break-word whitespace-pre-line">
                {{ message }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Teleport, Transition } from 'vue'
import { Icon } from '@iconify/vue'

const message = ref('')
const messageType = ref('info') // 'info' | 'success' | 'error' | 'warning'
const iconName = ref('mdi:information-outline')
let timer = null

const alertClass = computed(() => {
  if (messageType.value === 'success') return 'border-success/40'
  if (messageType.value === 'error') return 'border-error/40'
  if (messageType.value === 'warning') return 'border-warning/40'
  return 'border-base-300/80'
})

const iconWrapperClass = computed(() => {
  if (messageType.value === 'success') return 'bg-success/10 text-success'
  if (messageType.value === 'error') return 'bg-error/10 text-error'
  if (messageType.value === 'warning') return 'bg-warning/10 text-warning'
  return 'bg-primary/5 text-primary'
})

function defaultIconForType(type) {
  if (type === 'success') return 'mdi:checkbox-marked-circle-outline'
  if (type === 'error') return 'mdi:alert-circle-outline'
  if (type === 'warning') return 'mdi:alert-outline'
  return 'mdi:information-outline'
}

/**
 * 显示 Toast
 * @param {string} msg 提示文案
 * @param {{ duration?: number, type?: 'info'|'success'|'error'|'warning', icon?: string }} options
 */
function show(msg, options = {}) {
  const duration = typeof options.duration === 'number' ? options.duration : 3000
  const type = options.type || 'info'

  message.value = msg
  messageType.value = type
  iconName.value = options.icon || defaultIconForType(type)

  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    message.value = ''
    timer = null
  }, duration)
}

defineExpose({ show })
</script>
