<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import BottomSheet from './BottomSheet.vue'
import { rollNotation } from '../utils/dice'

const props = defineProps({
  open: { type: Boolean, default: false },
  /** 一批投掷：{ notation, key, label, multiply }，multiply 默认 1 */
  batch: { type: Array, default: () => [] },
  /** 最多可掷几组并切换选择（仅创建角色属性点时传 5） */
  maxRolls: { type: Number, default: 1 },
  /** 上次投掷结果（关闭后再打开时沿用，不重新掷） */
  initialAllResults: { type: Array, default: () => [] },
  /** 请求检定模式：先显示掷骰按钮，点击后再动画+结果+确定，无取消/关闭 */
  requestMode: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'confirm', 'results'])

const phase = ref('idle') // 'idle' | 'rolling' | 'result'（requestMode 下从 idle 开始）
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
    if (props.requestMode) {
      // 请求检定模式：先显示掷骰按钮，不自动掷
      allResults.value = []
      currentResultIndex.value = 0
      phase.value = 'idle'
    } else if (hasInitial) {
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

function startRoll() {
  if (props.requestMode && phase.value === 'idle') {
    runRoll()
  }
}
</script>

<template>
  <BottomSheet
    :open="open"
    @update:open="(val) => { if (!val && !requestMode) handleClose() }"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <Icon icon="mdi:dice-multiple" class="text-2xl text-primary dice-icon" />
        <h3 class="text-lg font-semibold text-base-content">投掷骰子</h3>
      </div>
      <button v-if="!requestMode" type="button" class="btn btn-ghost btn-sm btn-square active:scale-95 transition-all" @click="handleClose">
        <Icon icon="mdi:close" class="text-xl" />
      </button>
      <div v-else class="w-8"></div>
    </template>

    <div class="dice-modal-content">
      <Transition name="dice-phase" mode="out-in">
        <!-- 请求模式：先显示掷骰按钮 -->
        <div v-if="requestMode && phase === 'idle'" key="idle" class="flex flex-col items-center justify-center gap-6 min-h-[200px] py-8">
          <p class="text-sm text-base-content/60">KP 请求你进行检定</p>
          <button type="button" class="btn btn-primary btn-lg gap-2 active:scale-95 transition-all" @click="startRoll">
            <Icon icon="mdi:dice-multiple" class="text-2xl" />
            掷骰
          </button>
        </div>
        <!-- 加载中：固定高度 -->
        <div v-else-if="phase === 'rolling'" key="rolling" class="dice-rolling-placeholder flex flex-col items-center justify-center gap-4 min-h-[200px] py-8">
          <Icon icon="mdi:dice-multiple" class="dice-loading-icon text-5xl text-primary" />
          <div class="flex items-center gap-1.5 text-base-content/50">
            <span class="loading-dot" />
            <span class="loading-dot" />
            <span class="loading-dot" />
          </div>
          <span class="text-sm text-base-content/50">加载中</span>
        </div>
        <!-- 结果列表：不设最小高度，弹窗随内容 -->
        <div v-else key="result" class="space-y-3">
          <!-- 多组时：切换当前查看的组 + 再掷一次 -->
          <div v-if="maxRolls > 1 && allResults.length" class="flex items-center gap-2">
            <div class="flex items-center justify-center gap-2">
              <button type="button" class="btn btn-ghost btn-square btn-sm active:scale-95 transition-all" :disabled="currentResultIndex <= 0" title="上一组" @click="prevGroup">
                <Icon icon="mdi:chevron-left" class="text-xl" />
              </button>
              <span class="text-sm text-base-content/60 min-w-[4rem] text-center">第 {{ currentResultIndex + 1 }}/{{ allResults.length }} 组</span>
              <button type="button" class="btn btn-ghost btn-square btn-sm active:scale-95 transition-all" :disabled="currentResultIndex >= allResults.length - 1" title="下一组" @click="nextGroup">
                <Icon icon="mdi:chevron-right" class="text-xl" />
              </button>
            </div>
            <button v-if="canRollMore" type="button" class="btn btn-outline btn-primary btn-sm ml-auto whitespace-nowrap active:scale-95 transition-all" @click="rollAgain">
              重骰 ({{ allResults.length }}/{{ maxRolls }})
            </button>
          </div>
          <TransitionGroup name="result-item" tag="div" class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div v-for="(r, i) in displayResults" :key="r.key" class="result-card flex items-center justify-between rounded-lg bg-base-200 border border-base-300 px-3 py-2" :style="{ animationDelay: `${i * 0.06}s` }">
              <span class="text-sm text-base-content/60">{{ r.label }}</span>
              <span class="font-mono font-semibold text-primary">{{ r.display }}</span>
            </div>
          </TransitionGroup>
          <div class="flex flex-nowrap items-center justify-end gap-2 pt-4">
            <button v-if="!requestMode" type="button" class="btn btn-ghost btn-sm flex-1 active:scale-95 transition-all" @click="handleClose">取消</button>
            <button type="button" class="btn btn-primary btn-sm flex-1 active:scale-95 transition-all" @click="handleConfirm">确定</button>
          </div>
        </div>
      </Transition>
    </div>
  </BottomSheet>
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
