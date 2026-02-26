/**
 * 用户资料缓存（username、avatar 等），减少重复请求 profiles 表。
 * 内存缓存 + 可选 sessionStorage，带 TTL。
 */
import { shallowRef } from 'vue'
import { supabase } from '../lib/supabase'

const CACHE_KEY = 'trpg_profile_cache'
const TTL_MS = 5 * 60 * 1000 // 5 分钟

/** 内存缓存：id -> { id, username, avatar, role?, _at } */
const cache = shallowRef(Object.create(null))

function now() {
  return Date.now()
}

function isExpired(entry) {
  return !entry?._at || now() - entry._at > TTL_MS
}

/** 从 sessionStorage 恢复（仅当存在且未过期时合并到内存） */
function loadFromStorage() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return
    const { data = {}, _at = 0 } = JSON.parse(raw)
    if (now() - _at > TTL_MS) return
    const next = { ...cache.value }
    for (const [id, v] of Object.entries(data)) {
      if (v && typeof v === 'object' && v.id) next[id] = { ...v, _at }
    }
    cache.value = next
  } catch {
    // ignore
  }
}

/** 将当前内存缓存写入 sessionStorage */
function saveToStorage() {
  try {
    const data = {}
    const c = cache.value
    for (const [id, entry] of Object.entries(c)) {
      if (entry && !isExpired(entry)) {
        const { _at, ...rest } = entry
        data[id] = rest
      }
    }
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, _at: now() }))
  } catch {
    // ignore
  }
}

/** 从缓存中取未过期的条目，返回 id -> profile；过期的 id 放入 missingIds */
function getFromCache(ids) {
  const result = {}
  const missing = []
  const c = cache.value
  for (const id of ids) {
    if (!id) continue
    const entry = c[id]
    if (entry && !isExpired(entry)) {
      const { _at, ...rest } = entry
      result[id] = rest
    } else {
      missing.push(id)
    }
  }
  return { result, missingIds: missing }
}

/** 写入内存并可选持久化 */
function setInCache(id, profile) {
  if (!id) return
  const entry = { id, username: profile?.username ?? null, avatar: profile?.avatar ?? null, role: profile?.role ?? null, _at: now() }
  cache.value = { ...cache.value, [id]: entry }
  saveToStorage()
}

export function useProfileCache() {
  /** 初始化：从 sessionStorage 恢复（应用启动时调一次即可，不调也可） */
  function init() {
    loadFromStorage()
  }

  /**
   * 获取多个用户的资料（先读缓存，只对未命中或过期的 id 请求接口）
   * @param {string[]} ids - 用户 id 列表
   * @returns {Promise<Map<string, { id, username?, avatar?, role? }>>}
   */
  async function getProfiles(ids) {
    const uniqueIds = [...new Set((ids || []).filter(Boolean))]
    if (uniqueIds.length === 0) return new Map()

    const { result, missingIds } = getFromCache(uniqueIds)
    const map = new Map(Object.entries(result))

    if (missingIds.length === 0) return map

    const { data: rows, error } = await supabase
      .from('profiles')
      .select('id, username, avatar, role')
      .in('id', missingIds)

    if (error) return map

    const c = cache.value
    for (const row of rows || []) {
      if (!row?.id) continue
      const entry = { id: row.id, username: row.username ?? null, avatar: row.avatar ?? null, role: row.role ?? null, _at: now() }
      map.set(row.id, { id: row.id, username: row.username ?? null, avatar: row.avatar ?? null, role: row.role ?? null })
      c[row.id] = entry
    }
    cache.value = { ...c }
    saveToStorage()
    return map
  }

  /**
   * 获取单个用户资料（优先缓存）
   * @param {string} id - 用户 id
   * @returns {Promise<{ id, username?, avatar?, role? } | null>}
   */
  async function getProfile(id) {
    if (!id) return null
    const map = await getProfiles([id])
    return map.get(id) ?? null
  }

  /**
   * 写入/更新缓存（例如登录后写入当前用户、或用户修改昵称/头像后更新）
   * @param {string} id
   * @param {{ username?, avatar?, role? }} profile
   */
  function setProfile(id, profile) {
    setInCache(id, profile)
  }

  /**
   * 使某条缓存失效（下次 get 会重新请求）
   * @param {string} id
   */
  function invalidate(id) {
    if (!id) return
    const c = { ...cache.value }
    delete c[id]
    cache.value = c
    saveToStorage()
  }

  /** 清空缓存（如登出时可选调用） */
  function clear() {
    cache.value = Object.create(null)
    try {
      sessionStorage.removeItem(CACHE_KEY)
    } catch {
      // ignore
    }
  }

  return {
    init,
    getProfiles,
    getProfile,
    setProfile,
    invalidate,
    clear,
  }
}
