import { ref, computed } from 'vue'

const STORAGE_KEY = 'foxtrpg-auth'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    return data && data.username ? { username: data.username } : null
  } catch {
    return null
  }
}

function saveToStorage(user) {
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify({ username: user.username }))
    else localStorage.removeItem(STORAGE_KEY)
  } catch (_) {}
}

const user = ref(loadFromStorage())

export function useAuthStore() {
  const isLoggedIn = computed(() => !!user.value)

  /**
   * 登录：账号密码非空即通过（无注册、无后端时前端校验）
   * @returns {{ ok: boolean, message?: string }}
   */
  function login(username, password) {
    const u = (username || '').trim()
    const p = (password || '').trim()
    if (!u) return { ok: false, message: '请输入账号' }
    if (!p) return { ok: false, message: '请输入密码' }
    user.value = { username: u }
    saveToStorage(user.value)
    return { ok: true }
  }

  function logout() {
    user.value = null
    saveToStorage(null)
  }

  return { user, isLoggedIn, login, logout }
}
