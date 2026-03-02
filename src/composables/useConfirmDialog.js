import { reactive } from 'vue'

const state = reactive({
  visible: false,
  title: '确认',
  message: '',
  confirmText: '确定',
  cancelText: '取消',
  _resolve: null,
})

/**
 * 全局确认对话框 composable
 * 提供 Promise 风格的 confirm(message, options)
 */
export function useConfirmDialog() {
  function confirm(messageOrOptions, options = {}) {
    const opts = typeof messageOrOptions === 'string'
      ? { message: messageOrOptions, ...options }
      : { ...messageOrOptions, ...options }

    return new Promise((resolve) => {
      state.title = opts.title ?? '确认'
      state.message = opts.message ?? ''
      state.confirmText = opts.confirmText ?? '确定'
      state.cancelText = opts.cancelText ?? '取消'
      state._resolve = resolve
      state.visible = true
    })
  }

  function onConfirm() {
    state.visible = false
    if (state._resolve) state._resolve(true)
    state._resolve = null
  }

  function onCancel() {
    state.visible = false
    if (state._resolve) state._resolve(false)
    state._resolve = null
  }

  return {
    confirm,
    state,
    onConfirm,
    onCancel,
  }
}
