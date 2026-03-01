import { ref, computed, watch } from 'vue'
import { THEMES, applyTheme } from '../themes/index'

const STORAGE_KEY = 'trpg-theme'

function getInitialThemeId() {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (['dark', 'light'].includes(stored)) return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const currentThemeId = ref(getInitialThemeId())

applyTheme(currentThemeId.value)

watch(
  currentThemeId,
  (id) => {
    applyTheme(id)
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, id)
    }
  },
  { immediate: false }
)

export function useTheme() {
  const isDark = computed(() => currentThemeId.value === 'dark')

  function setTheme(themeId) {
    if (THEMES.some((t) => t.id === themeId)) {
      currentThemeId.value = themeId
    }
  }

  return {
    themes: THEMES,
    currentThemeId,
    isDark,
    setTheme,
  }
}
