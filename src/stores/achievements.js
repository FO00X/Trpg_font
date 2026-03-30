import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './auth'
import { useToast } from '../composables/useToast'

// 成就配置仅从数据库 achievements 表加载
const configs = ref([])

// 用户已解锁成就列表：[{ id, unlockedAt }]
const unlockedList = ref([])

// 简单的计数型统计，用于阈值成就
const stats = ref({
  messagesSent: 0,
  diceRolls: 0,
  notesCreated: 0,
  roomsCreated: 0,
  diceCriticalSuccess: 0,
  diceCriticalFail: 0,
  diceSuccess: 0,
  diceFail: 0,
  diceOnTheLine: 0,
})

const initialized = ref(false)
let initPromise = null

export function useAchievementsStore() {
  const auth = useAuthStore()
  const toast = useToast()

  const allAchievements = computed(() => {
    const unlockedSet = new Set(unlockedList.value.map((a) => a.id))
    return configs.value
      .filter((cfg) => cfg.enabled !== false)
      .map((cfg) => {
      const unlocked = unlockedList.value.find((a) => a.id === cfg.id) || null
      return {
        ...cfg,
        unlocked: !!unlocked,
        unlockedAt: unlocked?.unlockedAt || null,
      }
    })
  })

  const unlockedCount = computed(() => unlockedList.value.length)
  const totalCount = computed(() => configs.value.filter((cfg) => cfg.enabled !== false).length)

  async function ensureInitialized() {
    if (initialized.value) return
    if (initPromise) return initPromise
    initPromise = (async () => {
      await Promise.all([loadConfigsFromServer(), loadFromServer()])
      initialized.value = true
    })()
    return initPromise
  }

  async function ensureUid() {
    let uid = auth.user?.value?.id
    if (uid) return uid
    const { data } = await supabase.auth.getUser()
    uid = data?.user?.id
    if (uid && !auth.user?.value && data?.user) {
      auth.user.value = {
        id: uid,
        email: data.user.email,
        username: data.user.email?.split('@')[0] || uid,
      }
    }
    return uid
  }

  async function loadFromServer() {
    const uid = await ensureUid()
    if (!uid) return
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', uid)

      if (error) {
        // 若表尚未创建，则直接忽略，不影响前端使用
        if (
          error.code === 'PGRST204' ||
          (error.message && /user_achievements|relation .* does not exist/i.test(error.message))
        ) {
          return
        }
        console.warn('[achievements] loadFromServer error', error)
        return
      }

      const rows = Array.isArray(data) ? data : []
      const seen = new Set()
      const normalized = []
      for (const r of rows) {
        const id = r?.achievement_id
        if (!id || seen.has(id)) continue
        seen.add(id)
        normalized.push({
          id,
          unlockedAt: r.unlocked_at,
        })
      }
      unlockedList.value = normalized
    } catch (err) {
      console.warn('[achievements] loadFromServer exception', err)
    }
  }

  // 从数据库 achievements 表加载成就配置
  async function loadConfigsFromServer() {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('id, title, description, category, icon, stat_key, threshold, enabled, sort_order, created_at')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) {
        if (error.code === 'PGRST204' || (error.message && /achievements|relation .* does not exist/i.test(error.message))) {
          configs.value = []
          return
        }
        console.warn('[achievements] loadConfigsFromServer error', error)
        return
      }

      const rows = Array.isArray(data) ? data : []
      configs.value = rows.map((r) => ({
        id: r.id,
        title: r.title || '',
        description: r.description || '',
        category: r.category || '其他',
        icon: r.icon || 'mdi:trophy-outline',
        statKey: r.stat_key || '',
        threshold: typeof r.threshold === 'number' ? r.threshold : 1,
        enabled: r.enabled !== false,
      }))
    } catch (err) {
      console.warn('[achievements] loadConfigsFromServer exception', err)
    }
  }

  async function persistUnlock(id) {
    const uid = await ensureUid()
    if (!uid) return
    try {
      const { error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: uid,
          achievement_id: id,
          unlocked_at: new Date().toISOString(),
        })
      if (error) {
        console.warn('[achievements] persistUnlock error', error)
      }
    } catch (err) {
      console.warn('[achievements] persistUnlock exception', err)
    }
  }

  function hasAchievement(id) {
    return unlockedList.value.some((a) => a.id === id)
  }

  async function unlock(id) {
    if (hasAchievement(id)) return
    const cfg = configs.value.find((a) => a.id === id && a.enabled !== false)
    if (!cfg) return

    const now = new Date().toISOString()
    unlockedList.value = [...unlockedList.value, { id, unlockedAt: now }]

    // 轻量提示：使用全局 Toast
    toast.success(`解锁成就：「${cfg.title}」`)

    // 后台持久化，不阻塞 UI
    persistUnlock(id).catch(() => {})
  }

  function increaseStat(key, delta = 1) {
    if (!key || typeof delta !== 'number') return
    const current = stats.value[key] ?? 0
    const next = current + delta
    stats.value = {
      ...stats.value,
      [key]: next,
    }

    for (const cfg of configs.value) {
      if (!cfg.statKey || cfg.statKey !== key) continue
      if (cfg.enabled === false) continue
      if (hasAchievement(cfg.id)) continue
      if (next >= (cfg.threshold ?? 1)) {
        unlock(cfg.id)
      }
    }
  }

  // 提供给业务代码的便捷事件接口
  function onMessageSent() {
    increaseStat('messagesSent', 1)
  }

  function onDiceRolled() {
    increaseStat('diceRolls', 1)
  }

  function onNoteCreated() {
    increaseStat('notesCreated', 1)
  }

  function onRoomCreated() {
    increaseStat('roomsCreated', 1)
  }

  /**
   * 掷骰检定结果上报（技能/属性/理智等 1d100 检定后调用）
   * @param {string} result - '大成功' | '大失败' | '极难成功' | '困难成功' | '成功' | '失败'
   * @param {number} [value] - 骰面值，用于卡线判定
   * @param {number} [target] - 目标值，用于卡线判定（value === target 即卡线）
   */
  function reportDiceResult(result, value, target) {
    if (result === '大成功') {
      increaseStat('diceCriticalSuccess', 1)
      increaseStat('diceSuccess', 1)
      return
    }
    if (result === '大失败') {
      increaseStat('diceCriticalFail', 1)
      increaseStat('diceFail', 1)
      return
    }
    if (result === '极难成功' || result === '困难成功' || result === '成功') {
      increaseStat('diceSuccess', 1)
      if (typeof value === 'number' && typeof target === 'number' && value === target) {
        increaseStat('diceOnTheLine', 1)
      }
      return
    }
    if (result === '失败') {
      increaseStat('diceFail', 1)
      if (typeof value === 'number' && typeof target === 'number' && value === target) {
        increaseStat('diceOnTheLine', 1)
      }
    }
  }

  // 默认在首次使用时尝试同步一次历史成就
  ensureInitialized().catch(() => {})

  /** 从 user_achievements 表刷新当前用户已解锁成就（进入成就页时调用，保证与后端一致） */
  async function refreshUserAchievements() {
    await loadFromServer()
  }

  return {
    allAchievements,
    unlockedCount,
    totalCount,
    ensureInitialized,
    refreshUserAchievements,
    hasAchievement,
    onMessageSent,
    onDiceRolled,
    onNoteCreated,
    onRoomCreated,
    reportDiceResult,
  }
}

