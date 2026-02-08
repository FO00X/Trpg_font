<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import { Dialog, DialogOverlay, DialogPanel, DialogTitle } from '@headlessui/vue'
import { rollNotation } from '../utils/dice'

const props = defineProps({
  open: { type: Boolean, default: false },
  /** 一批投掷：{ notation, key, label, multiply }，multiply 默认 1 */
  batch: { type: Array, default: () => [] },
})
const emit = defineEmits(['close', 'confirm'])

const phase = ref('rolling') // 'rolling' | 'result'
const results = ref([])    // { key, label, raw, display, values }
const displayValues = ref([]) // 每个骰子当前显示的数字（动画用）
const rollDuration = 1400
const cycleInterval = 60
let rollTimer = null

function runRoll() {
  if (!props.batch.length) return
  if (rollTimer) clearInterval(rollTimer)
  const list = props.batch.map(({ notation, key, label, multiply = 1 }) => {
    const r = rollNotation(notation)
    const display = r.total * multiply
    return { key, label, raw: r.total, display, values: r.values }
  })
  results.value = list
  displayValues.value = list.map(() => 0)
  phase.value = 'rolling'

  const start = Date.now()
  const maxSides = 20
  rollTimer = setInterval(() => {
    const elapsed = Date.now() - start
    if (elapsed >= rollDuration) {
      clearInterval(rollTimer)
      rollTimer = null
      displayValues.value = list.map(r => r.raw)
      phase.value = 'result'
      return
    }
    displayValues.value = list.map((r, i) => {
      const progress = elapsed / rollDuration
      const stagger = (i / list.length) * 0.3
      if (progress < 0.2 + stagger) return Math.floor(Math.random() * (r.raw + 10)) + 1
      if (progress < 0.9) return Math.floor(Math.random() * maxSides) + 1
      return r.raw
    })
  }, cycleInterval)
}

watch(() => props.open, (isOpen) => {
  if (isOpen && props.batch.length) runRoll()
  if (!isOpen && rollTimer) {
    clearInterval(rollTimer)
    rollTimer = null
  }
})

onBeforeUnmount(() => {
  if (rollTimer) clearInterval(rollTimer)
})

function handleConfirm() {
  const payload = {}
  results.value.forEach(r => { payload[r.key] = r.display })
  emit('confirm', payload)
  emit('close')
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <Dialog :open="open" @close="handleClose" class="relative z-[10000]">
    <DialogOverlay class="fixed inset-0 bg-black/60 backdrop-blur-sm" />
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel class="w-full max-w-md rounded-2xl bg-chat-panel border border-chat-border shadow-xl overflow-hidden focus:outline-none">
        <DialogTitle class="sr-only">投掷骰子</DialogTitle>
        <div class="p-5">
          <div class="flex items-center justify-center gap-2 mb-4">
            <Icon icon="mdi:dice-multiple" class="text-3xl text-accent" />
            <h3 class="text-lg font-semibold text-white">投掷骰子</h3>
          </div>

          <!-- 动画：多个骰子滚动 -->
          <div v-if="phase === 'rolling'" class="dice-rolling flex flex-wrap justify-center gap-3 py-6">
            <div
              v-for="(val, idx) in displayValues"
              :key="idx"
              class="dice-face"
            >
              <span class="dice-number">{{ val }}</span>
            </div>
          </div>

          <!-- 结果列表 -->
          <div v-if="phase === 'result'" class="space-y-3">
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div
                v-for="r in results"
                :key="r.key"
                class="flex items-center justify-between rounded-lg bg-chat-bg border border-chat-border px-3 py-2"
              >
                <span class="text-sm text-accent-muted">{{ r.label }}</span>
                <span class="font-mono font-semibold text-accent">{{ r.display }}</span>
              </div>
            </div>
            <div class="flex gap-2 pt-2">
              <button
                type="button"
                class="flex-1 px-4 py-2.5 rounded-xl bg-accent text-chat-bg font-medium hover:opacity-90"
                @click="handleConfirm"
              >
                应用结果
              </button>
              <button
                type="button"
                class="px-4 py-2.5 rounded-xl border border-chat-border text-accent-muted hover:text-white"
                @click="handleClose"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>

<style scoped>
.dice-face {
  @apply w-12 h-12 rounded-lg bg-chat-bg border-2 border-accent/50 flex items-center justify-center shrink-0;
  transition: transform 0.1s ease-out;
}
.dice-rolling .dice-face {
  animation: dice-shake 0.12s ease-in-out infinite;
}
.dice-number {
  @apply text-lg font-bold text-accent tabular-nums;
}
@keyframes dice-shake {
  0%, 100% { transform: rotate(-3deg) scale(1); }
  25% { transform: rotate(4deg) scale(1.05); }
  50% { transform: rotate(-4deg) scale(0.98); }
  75% { transform: rotate(3deg) scale(1.02); }
}
</style>
