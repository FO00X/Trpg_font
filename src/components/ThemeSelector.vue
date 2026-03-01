<template>
  <button
    type="button"
    class="btn btn-ghost btn-square btn-sm"
    :title="`当前：${currentName}，点击切换为${nextName}`"
    aria-label="切换主题"
    @click="toggleTheme"
  >
    <Icon :icon="currentIcon" class="text-xl" />
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useTheme } from '../stores/theme'

defineProps({
  /** 下拉对齐（保留以兼容调用处，实际已改为单按钮切换） */
  align: { type: String, default: 'left' },
})

const { currentThemeId, setTheme } = useTheme()

const currentName = computed(() => (currentThemeId.value === 'dark' ? '暗色' : '亮色'))
const nextName = computed(() => (currentThemeId.value === 'dark' ? '亮色' : '暗色'))

const iconByTheme = {
  light: 'mdi:weather-sunny',
  dark: 'mdi:weather-night',
}
const currentIcon = computed(() => iconByTheme[currentThemeId.value] || 'mdi:weather-sunny')

function toggleTheme() {
  setTheme(currentThemeId.value === 'dark' ? 'light' : 'dark')
}
</script>
