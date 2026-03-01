<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 bg-black/60 z-[9998] transition-opacity"
        @click="close"
      ></div>
    </Transition>
    <Transition name="slide-up">
      <div
        v-if="open"
        ref="sheetRef"
        class="fixed bottom-0 left-0 right-0 z-[9999] w-full bg-base-100 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col max-h-[85vh] safe-area-bottom"
      >
        <!-- 顶部拖拽把手指示器 -->
        <div class="w-full pt-4 pb-2 flex justify-center shrink-0 touch-none">
          <div class="w-12 h-1.5 bg-base-300 rounded-full"></div>
        </div>
        
        <!-- 标题区域 -->
        <div v-if="title || $slots.header" class="px-5 pb-3 pt-1 flex items-center justify-between shrink-0">
          <slot name="header">
            <h3 class="text-lg font-bold text-base-content tracking-tight">{{ title }}</h3>
            <button class="w-8 h-8 flex items-center justify-center rounded-xl bg-base-200 text-base-content/60 hover:bg-base-300 hover:text-base-content active:scale-95 transition-all" @click="close">
              <Icon icon="mdi:close" class="text-xl" />
            </button>
          </slot>
        </div>

        <!-- 内容区域 -->
        <div class="flex-1 overflow-y-auto scroll-thin px-5 pb-6 pt-2">
          <slot></slot>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useSwipe } from '@vueuse/core'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
})

const emit = defineEmits(['update:open', 'close'])

const sheetRef = ref(null)

function close() {
  emit('update:open', false)
  emit('close')
}

const { isSwiping, direction, lengthY } = useSwipe(sheetRef)

watch(isSwiping, (swiping) => {
  if (!swiping && props.open) {
    if (direction.value === 'down' && lengthY.value < -40) {
      close()
    }
  }
})

// 锁定底层滚动
watch(() => props.open, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  will-change: transform;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
