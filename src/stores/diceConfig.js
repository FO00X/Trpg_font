import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'trpg-dice-config'
const SETTINGS_ID = 'dice_config'

export const DICE_DEFAULTS = {
  assetPath: '/trpg/assets/',
  theme: 'default',
  themeColor: '#4826F2',
  scale: 3,
  spinForce: 3,
  throwForce: 2,
  startingHeight: 8,
  gravity: 3,
  mass: 3,
  friction: 0.4,
  restitution: 0.3,
  linearDamping: 0.5,
  angularDamping: 0.4,
  spinForceSpread: 3,
  throwForceSpread: 0,
  lightIntensity: 0.8,
  shadows: true,
  delay: 50,
  offscreen: true,
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return { ...DICE_DEFAULTS, ...parsed }
  } catch {
    return null
  }
}

function persistToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config.value))
  } catch (e) {
    console.warn('diceConfig persistToStorage failed', e)
  }
}

const stored = loadFromStorage()
const config = ref(stored || { ...DICE_DEFAULTS })

export function useDiceConfig() {
  const num = (v, d) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : d
  }

  const boxOptions = computed(() => ({
    assetPath: config.value.assetPath ?? DICE_DEFAULTS.assetPath,
    theme: config.value.theme ?? DICE_DEFAULTS.theme,
    themeColor: config.value.themeColor ?? DICE_DEFAULTS.themeColor,
    scale: num(config.value.scale, DICE_DEFAULTS.scale),
    spinForce: num(config.value.spinForce, DICE_DEFAULTS.spinForce),
    throwForce: num(config.value.throwForce, DICE_DEFAULTS.throwForce),
    startingHeight: num(config.value.startingHeight, DICE_DEFAULTS.startingHeight),
    gravity: num(config.value.gravity, DICE_DEFAULTS.gravity),
    mass: num(config.value.mass, DICE_DEFAULTS.mass),
    friction: num(config.value.friction, DICE_DEFAULTS.friction),
    restitution: num(config.value.restitution, DICE_DEFAULTS.restitution),
    linearDamping: num(config.value.linearDamping, DICE_DEFAULTS.linearDamping),
    angularDamping: num(config.value.angularDamping, DICE_DEFAULTS.angularDamping),
    spinForceSpread: num(config.value.spinForceSpread, DICE_DEFAULTS.spinForceSpread),
    throwForceSpread: num(config.value.throwForceSpread, DICE_DEFAULTS.throwForceSpread),
    lightIntensity: num(config.value.lightIntensity, DICE_DEFAULTS.lightIntensity),
    enableShadows: Boolean(config.value.shadows ?? DICE_DEFAULTS.shadows),
    delay: num(config.value.delay, DICE_DEFAULTS.delay),
    offscreen: Boolean(config.value.offscreen ?? DICE_DEFAULTS.offscreen),
  }))

  /** 从数据库加载配置（优先），失败则保留当前内存/本地缓存 */
  async function loadFromServer() {
    try {
      const { data, error: err } = await supabase
        .from('system_settings')
        .select('value')
        .eq('id', SETTINGS_ID)
        .maybeSingle()
      if (err) throw err
      if (data?.value && typeof data.value === 'object') {
        config.value = { ...DICE_DEFAULTS, ...data.value }
        persistToStorage()
      }
    } catch (e) {
      console.warn('diceConfig loadFromServer failed (使用本地/默认配置)', e)
    }
  }

  /** 保存到内存、localStorage 并写入数据库 */
  async function save(updates) {
    config.value = { ...config.value, ...updates }
    persistToStorage()
    try {
      const { error: err } = await supabase
        .from('system_settings')
        .upsert({
          id: SETTINGS_ID,
          value: config.value,
        })
      if (err) throw err
    } catch (e) {
      console.warn('diceConfig save to server failed', e)
      throw e
    }
  }

  function reset() {
    config.value = { ...DICE_DEFAULTS }
    persistToStorage()
  }

  /** 恢复默认并写入数据库 */
  async function resetAndSave() {
    config.value = { ...DICE_DEFAULTS }
    persistToStorage()
    try {
      const { error: err } = await supabase
        .from('system_settings')
        .upsert({
          id: SETTINGS_ID,
          value: config.value,
        })
      if (err) throw err
    } catch (e) {
      console.warn('diceConfig resetAndSave failed', e)
      throw e
    }
  }

  return {
    config,
    boxOptions,
    loadFromServer,
    save,
    reset,
    resetAndSave,
    defaults: DICE_DEFAULTS,
  }
}
