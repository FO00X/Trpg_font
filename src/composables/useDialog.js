import { ref } from 'vue'

const toastRef = ref(null)
const confirmDialogRef = ref(null)

export function useToast() {
  function show(message, duration = 3000) {
    if (toastRef.value) {
      toastRef.value.show(message, duration)
    } else {
      // 降级到系统 alert（仅用于开发调试）
      console.warn('Toast ref not available, falling back to alert')
      alert(message)
    }
  }
  return { show, toastRef }
}

export function useConfirm() {
  function show(options) {
    return new Promise((resolve) => {
      if (!confirmDialogRef.value) {
        // 降级到系统 confirm（仅用于开发调试）
        console.warn('ConfirmDialog ref not available, falling back to confirm')
        const result = window.confirm(options.message || options.title || '确认操作？')
        resolve(result)
        return
      }
      
      const dialog = confirmDialogRef.value
      dialog.title = options.title || '确认'
      dialog.message = options.message || ''
      dialog.confirmText = options.confirmText || '确定'
      dialog.cancelText = options.cancelText || '取消'
      
      const handleConfirm = () => {
        dialog.visible = false
        resolve(true)
      }
      
      const handleCancel = () => {
        dialog.visible = false
        resolve(false)
      }
      
      dialog.$once('confirm', handleConfirm)
      dialog.$once('cancel', handleCancel)
      dialog.visible = true
    })
  }
  
  return { show, confirmDialogRef }
}
