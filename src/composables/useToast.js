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
  function show(message, duration = 3000, type = 'info') {
    if (toastRef.value?.show) {
      toastRef.value.show(message, duration, type)
    } else {
      console.warn('[useToast] Toast ref not available, falling back to alert')
      alert(message)
    }
  }

  function success(message, duration = 3000) {
    show(message, duration, 'success')
  }

  function error(message, duration = 3000) {
    show(message, duration, 'error')
  }

  function info(message, duration = 3000) {
    show(message, duration, 'info')
  }

  return {
    show,
    success,
    error,
    info,
    toastRef,
  }
}
