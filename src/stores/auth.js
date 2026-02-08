import { ref, computed } from 'vue'

const STORAGE_KEY = 'foxtrpg-auth'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    return data && data.username ? { username: data.username, token: data.token } : null
  } catch {
    return null
  }
}

/** 直接读 localStorage 判断是否已登录，供路由守卫使用，避免与 logout 的时序问题 */
export function hasStoredAuth() {
  return !!loadFromStorage()
}

function saveToStorage(user, token) {
  try {
    if (user && token) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ username: user.username, token }))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch (_) {}
}

const _stored = loadFromStorage()
const user = ref(_stored ? { username: _stored.username } : null)
const token = ref(_stored?.token ?? null)

export function useAuthStore() {
  const isLoggedIn = computed(() => !!user.value)

  /**
   * 登录：请求后端 /api/auth/login，成功后保存 token 与用户信息
   * @returns {Promise<{ ok: boolean, message?: string }>}
   */
  async function login(username, password) {
    const u = (username || '').trim()
    const p = (password || '').trim()
    if (!u) return { ok: false, message: '请输入账号' }
    if (!p) return { ok: false, message: '请输入密码' }
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        return { ok: false, message: data.message || '登录失败' }
      }
      if (!data.ok || !data.token || !data.user) {
        return { ok: false, message: '登录响应异常' }
      }
      user.value = data.user
      token.value = data.token
      saveToStorage(data.user, data.token)
      return { ok: true }
    } catch (err) {
      return { ok: false, message: '网络错误，请检查后端是否已启动' }
    }
  }

  function logout() {
    user.value = null
    token.value = null
    saveToStorage(null)
  }

  /** 获取当前 token，供请求头使用 */
  function getToken() {
    return token.value
  }

  return { user, isLoggedIn, login, logout, getToken }
}
