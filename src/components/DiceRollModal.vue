<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import { Dialog, DialogOverlay, DialogPanel, DialogTitle } from '@headlessui/vue'
import { rollNotation } from '../utils/dice'

const props = defineProps({
  open: { type: Boolean, default: false },
  /** 一批投掷：{ notation, key, label, multiply }，multiply 默认 1 */
  batch: { type: Array, default: () => [] },
  /** 最多可掷几组并切换选择（仅创建角色属性点时传 5） */
  maxRolls: { type: Number, default: 1 },
  /** 上次投掷结果（关闭后再打开时沿用，不重新掷） */
  initialAllResults: { type: Array, default: () => [] },
})
const emit = defineEmits(['close', 'confirm', 'results'])

const phase = ref('rolling') // 'rolling' | 'result'
const results = ref([])    // 当前这一次掷骰结果
const allResults = ref([]) // 多组时：每组为 [{ key, label, raw, display }, ...]
const currentResultIndex = ref(0)
const rollDuration = 1200
let rollTimer = null

const displayResults = computed(() => {
  if (allResults.value.length) return allResults.value[currentResultIndex.value] || []
  return results.value
})

const canRollMore = computed(() => props.maxRolls > 1 && allResults.value.length < props.maxRolls)

function runRoll() {
  if (!props.batch.length) return
  if (rollTimer) clearTimeout(rollTimer)
  const list = props.batch.map(({ notation, key, label, multiply = 1 }) => {
    const r = rollNotation(notation)
    const display = r.total * multiply
    return { key, label, raw: r.total, display, values: r.values }
  })
  results.value = list
  phase.value = 'rolling'
  rollTimer = setTimeout(() => {
    rollTimer = null
    phase.value = 'result'
    if (props.maxRolls > 1) {
      allResults.value.push(list.map(r => ({ ...r })))
      currentResultIndex.value = allResults.value.length - 1
    } else {
      allResults.value = [list.map(r => ({ ...r }))]
      currentResultIndex.value = 0
    }
    emit('results', allResults.value.map((group) => group.map((r) => ({ ...r }))))
  }, rollDuration)
}

watch(() => props.open, (isOpen) => {
  if (isOpen && props.batch.length) {
    const hasInitial = props.initialAllResults && props.initialAllResults.length > 0
    if (hasInitial) {
      allResults.value = props.initialAllResults.map((group) => group.map((r) => ({ ...r })))
      currentResultIndex.value = 0
      phase.value = 'result'
      results.value = allResults.value[0] || []
    } else {
      allResults.value = []
      currentResultIndex.value = 0
      runRoll()
    }
  }
  if (!isOpen && rollTimer) {
    clearTimeout(rollTimer)
    rollTimer = null
  }
})

onBeforeUnmount(() => {
  if (rollTimer) clearTimeout(rollTimer)
})

function rollAgain() {
  if (!canRollMore.value) return
  runRoll()
}

function prevGroup() {
  if (currentResultIndex.value <= 0) return
  currentResultIndex.value--
}

function nextGroup() {
  if (currentResultIndex.value >= allResults.value.length - 1) return
  currentResultIndex.value++
}

function handleConfirm() {
  const list = displayResults.value
  const payload = {}
  list.forEach(r => { payload[r.key] = r.display })
  emit('confirm', payload)
  emit('close')
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <Dialog :open="open" @close="handleClose" class="relative z-[10000]">
    <DialogOverlay class="dice-modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm" />
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel class="dice-modal-panel w-full max-w-md rounded-2xl bg-chat-panel border border-chat-border shadow-xl overflow-hidden focus:outline-none">
        <DialogTitle class="sr-only">投掷骰子</DialogTitle>
        <div class="p-5">
          <div class="flex items-center justify-center gap-2 mb-4">
            <Icon icon="mdi:dice-multiple" class="text-3xl text-accent dice-icon" />
            <h3 class="text-lg font-semibold text-white">投掷骰子</h3>
          </div>

          <!-- 加载动画固定高度；结果区随内容高度 -->
          <div class="dice-modal-content">
            <Transition name="dice-phase" mode="out-in">
              <!-- 加载中：固定高度 -->
              <div v-if="phase === 'rolling'" key="rolling" class="dice-rolling-placeholder flex flex-col items-center justify-center gap-4 min-h-[200px] py-8">
                <Icon icon="mdi:dice-multiple" class="dice-loading-icon text-5xl text-accent" />
                <div class="flex items-center gap-1.5 text-accent-muted">
                  <span class="loading-dot" />
                  <span class="loading-dot" />
                  <span class="loading-dot" />
                </div>
                <span class="text-sm text-accent-muted">加载中</span>
              </div>
              <!-- 结果列表：不设最小高度，弹窗随内容 -->
              <div v-else-if="phase === 'result'" key="result" class="space-y-3">
              <!-- 多组时：切换当前查看的组 + 再掷一次 -->
              <div v-if="maxRolls > 1 && allResults.length" class="flex items-center gap-2">
                <div class="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    class="p-1.5 rounded-lg text-accent-muted hover:text-white hover:bg-white/5 disabled:opacity-30"
                    :disabled="currentResultIndex <= 0"
                    title="上一组"
                    @click="prevGroup"
                  >
                    <Icon icon="mdi:chevron-left" class="text-xl" />
                  </button>
                  <span class="text-sm text-accent-muted min-w-[4rem] text-center">
                    第 {{ currentResultIndex + 1 }}/{{ allResults.length }} 组
                  </span>
                  <button
                    type="button"
                    class="p-1.5 rounded-lg text-accent-muted hover:text-white hover:bg-white/5 disabled:opacity-30"
                    :disabled="currentResultIndex >= allResults.length - 1"
                    title="下一组"
                    @click="nextGroup"
                  >
                    <Icon icon="mdi:chevron-right" class="text-xl" />
                  </button>
                </div>
                <button
                  v-if="canRollMore"
                  type="button"
                  class="ml-auto shrink-0 px-3 py-2 rounded-xl border border-accent/50 text-accent hover:bg-accent/10 transition-colors text-sm whitespace-nowrap"
                  @click="rollAgain"
                >
                  重骰 ({{ allResults.length }}/{{ maxRolls }})
                </button>
              </div>
              <TransitionGroup name="result-item" tag="div" class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div
                  v-for="(r, i) in displayResults"
                  :key="r.key"
                  class="result-card flex items-center justify-between rounded-lg bg-chat-bg border border-chat-border px-3 py-2"
                  :style="{ animationDelay: `${i * 0.06}s` }"
                >
                  <span class="text-sm text-accent-muted">{{ r.label }}</span>
                  <span class="font-mono font-semibold text-accent">{{ r.display }}</span>
                </div>
              </TransitionGroup>
              <div class="flex flex-nowrap items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  class="shrink-0 px-5 py-2.5 rounded-xl border border-chat-border text-accent-muted hover:text-white transition-colors"
                  @click="handleClose"
                >
                  取消
                </button>
                <button
                  type="button"
                  class="shrink-0 px-5 py-2.5 rounded-xl bg-accent text-chat-bg font-medium hover:opacity-90 transition-opacity"
                  @click="handleConfirm"
                >
                  确定
                </button>
              </div>
            </div>
          </Transition>
          </div>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>

<style scoped>
.dice-modal-overlay {
  animation: overlay-in 0.25s ease-out;
}
.dice-modal-panel {
  animation: panel-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.dice-loading-icon {
  animation: dice-spin 1.2s ease-in-out infinite;
}
.loading-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background-color: #89b4fa;
  animation: loading-bounce 0.6s ease-in-out infinite both;
}
.loading-dot:nth-child(1) { animation-delay: 0s; }
.loading-dot:nth-child(2) { animation-delay: 0.1s; }
.loading-dot:nth-child(3) { animation-delay: 0.2s; }

/* 阶段切换 */
.dice-phase-enter-active,
.dice-phase-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.dice-phase-enter-from {
  opacity: 0;
  transform: scale(0.95);
}
.dice-phase-leave-to {
  opacity: 0;
  transform: scale(1.02);
}
.dice-phase-enter-to,
.dice-phase-leave-from {
  opacity: 1;
  transform: scale(1);
}

.result-card {
  opacity: 0;
  transform: translateY(8px);
  animation: result-in 0.4s ease-out forwards;
}
.result-item-enter-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.result-item-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

@keyframes overlay-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes panel-in {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
@keyframes dice-spin {
  0% { transform: rotate(0deg) scale(1); opacity: 1; }
  50% { transform: rotate(180deg) scale(1.1); opacity: 0.9; }
  100% { transform: rotate(360deg) scale(1); opacity: 1; }
}
@keyframes loading-bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-6px); }
}
@keyframes result-in {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
