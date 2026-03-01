<template>
  <div
    :class="[
      'flex items-center gap-2 text-base-content',
      block ? 'w-full justify-center py-12' : '',
      className,
    ]"
  >
    <div
      class="shrink-0 rounded-full border-2 border-current border-t-transparent animate-spin"
      :class="sizeClass[size] || sizeClass.md"
    />
    <span v-if="message" class="text-sm">{{ message }}</span>
  </div>
</template>

<script setup>
defineProps({
  /** 是否占满块、居中（用于整页或大区域加载） */
  block: { type: Boolean, default: true },
  /** 提示文案，如「加载中…」 */
  message: { type: String, default: '加载中…' },
  /** 尺寸：sm / md / lg */
  size: { type: String, default: 'md' },
  /** 额外 class */
  className: { type: String, default: '' },
})

const sizeClass = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
}
</script>
