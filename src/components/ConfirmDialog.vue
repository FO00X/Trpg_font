<template>
  <BottomSheet v-model:open="internalVisible" :title="title">
    <p class="py-2 text-sm text-base-content/70">{{ message }}</p>
    <div class="flex gap-3 mt-4">
      <button type="button" class="btn flex-1 active:scale-95 transition-all" @click="handleCancel">{{ cancelText }}</button>
      <button type="button" class="btn flex-1 active:scale-95 transition-all" @click="handleConfirm">{{ confirmText }}</button>
    </div>
  </BottomSheet>
</template>

<script setup>
import { computed } from 'vue'
import BottomSheet from './BottomSheet.vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '确认' },
  message: { type: String, default: '' },
  confirmText: { type: String, default: '确定' },
  cancelText: { type: String, default: '取消' },
})

const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

const internalVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

function handleConfirm() {
  emit('confirm')
  internalVisible.value = false
}

function handleCancel() {
  emit('cancel')
  internalVisible.value = false
}
</script>
