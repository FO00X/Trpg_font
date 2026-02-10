/**
 * 后端 API 请求封装：统一加鉴权头、解析 JSON、处理 401
 */

import { useAuthStore } from '../stores/auth'

function getToken() {
  try {
    return useAuthStore().getToken()
  } catch {
    return null
  }
}

async function request(path, options = {}) {
  const token = await getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const url = path.startsWith('http') ? path : (path.startsWith('/api') ? path : `/api${path.startsWith('/') ? path : '/' + path}`)
  const res = await fetch(url, {
    ...options,
    headers,
    body: options.body != null && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body,
  })
  const data = await res.json().catch(() => ({}))
  if (res.status === 401) {
    return { ok: false, message: data?.message || '未登录或登录已过期' }
  }
  return data
}

export async function apiGet(path) {
  return request(path, { method: 'GET' })
}

export async function apiPost(path, body) {
  return request(path, { method: 'POST', body })
}

export async function apiPut(path, body) {
  return request(path, { method: 'PUT', body })
}

export async function apiDelete(path) {
  return request(path, { method: 'DELETE' })
}
