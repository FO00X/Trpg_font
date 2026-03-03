import { ref } from 'vue'

const toastRef = ref(null)

/**
 * 注册全局 Toast 组件 ref（由 App.vue 在挂载时调用）
 * @param {import('vue').ComponentPublicInstance} instance
 */
export function registerToastRef(instance) {
  toastRef.value = instance
}

/**
 * 全局 Toast composable
 * 提供 success / error / info / show 方法，内部挂接全局 Toast 容器
 */
export function useToast() {
  /**
   * 显示 Toast
   * 兼容老调用方式：
   * - show(message)
   * - show(message, duration)
   * - show(message, duration, type)
   * 新推荐方式：
   * - show(message, { duration, type, icon })
   */
  function show(message, optionsOrDuration, maybeType) {
    if (!toastRef.value?.show) {
      console.warn('[useToast] Toast ref not available, falling back to alert')
      // eslint-disable-next-line no-alert
      alert(message)
      return
    }

    let options = {}

    if (typeof optionsOrDuration === 'object' && optionsOrDuration !== null) {
      options = optionsOrDuration
    } else {
      const duration = typeof optionsOrDuration === 'number' ? optionsOrDuration : 3000
      const type = typeof maybeType === 'string' ? maybeType : 'info'
      options = { duration, type }
    }

    toastRef.value.show(message, options)
  }

  function success(message, duration = 3000) {
    show(message, { duration, type: 'success' })
  }

  function error(message, duration = 3000) {
    show(message, { duration, type: 'error' })
  }

  function info(message, duration = 3000) {
    show(message, { duration, type: 'info' })
  }

  return {
    show,
    success,
    error,
    info,
    toastRef,
  }
}
