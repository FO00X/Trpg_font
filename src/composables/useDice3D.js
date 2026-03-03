import { ref, shallowRef } from 'vue'
import DiceBox from '@3d-dice/dice-box'
import { useDiceConfig } from '../stores/diceConfig'

const diceBoxRef = shallowRef(null)
const isInitialized = ref(false)
let clearTimer = null
let pendingConfigUpdate = null

export function useDice3D() {
  const { boxOptions, loadFromServer } = useDiceConfig()

  async function initDiceBox(containerSelector) {
    if (diceBoxRef.value) return
    await loadFromServer()
    const opts = boxOptions.value
    const config = {
      container: containerSelector,
      assetPath: opts.assetPath,
      theme: opts.theme,
      themeColor: opts.themeColor,
      scale: opts.scale,
      spinForce: opts.spinForce,
      throwForce: opts.throwForce,
      startingHeight: opts.startingHeight,
      gravity: opts.gravity,
      mass: opts.mass,
      friction: opts.friction,
      restitution: opts.restitution,
      linearDamping: opts.linearDamping,
      angularDamping: opts.angularDamping,
      lightIntensity: opts.lightIntensity,
      enableShadows: opts.enableShadows,
      delay: opts.delay,
      offscreen: opts.offscreen,
    }
    if (opts.spinForceSpread != null) config.spinForceSpread = opts.spinForceSpread
    if (opts.throwForceSpread != null) config.throwForceSpread = opts.throwForceSpread
    const box = new DiceBox(config)

    await box.init()
    diceBoxRef.value = box
    isInitialized.value = true

    // 若在初始化完成前有人请求更新配置，则在这里补一次
    if (pendingConfigUpdate && typeof diceBoxRef.value?.updateConfig === 'function') {
      try {
        diceBoxRef.value.updateConfig(pendingConfigUpdate)
      } catch (e) {
        console.warn('DiceBox updateConfig failed', e)
      } finally {
        pendingConfigUpdate = null
      }
    }
  }

  /** 临时更新当前 DiceBox 配置（不会写入数据库） */
  function updateConfig(overrides = {}) {
    if (diceBoxRef.value && typeof diceBoxRef.value.updateConfig === 'function') {
      diceBoxRef.value.updateConfig(overrides)
    } else {
      pendingConfigUpdate = { ...(pendingConfigUpdate || {}), ...(overrides || {}) }
    }
  }

  /** 从数据库重新加载并应用配置（用于离开预览后恢复） */
  async function reloadConfigFromServer() {
    await loadFromServer()
    const opts = boxOptions.value
    updateConfig({
      assetPath: opts.assetPath,
      theme: opts.theme,
      themeColor: opts.themeColor,
      scale: opts.scale,
      spinForce: opts.spinForce,
      throwForce: opts.throwForce,
      startingHeight: opts.startingHeight,
      gravity: opts.gravity,
      mass: opts.mass,
      friction: opts.friction,
      restitution: opts.restitution,
      linearDamping: opts.linearDamping,
      angularDamping: opts.angularDamping,
      lightIntensity: opts.lightIntensity,
      enableShadows: opts.enableShadows,
      delay: opts.delay,
      offscreen: opts.offscreen,
      spinForceSpread: opts.spinForceSpread,
      throwForceSpread: opts.throwForceSpread,
    })
  }

  async function roll(notation) {
    if (!diceBoxRef.value) {
      console.warn('DiceBox not initialized')
      return []
    }
    if (clearTimer) {
      clearTimeout(clearTimer)
      clearTimer = null
    }
    diceBoxRef.value.clear()
    const result = await diceBoxRef.value.roll(notation)
    clearTimer = setTimeout(() => {
      if (diceBoxRef.value) {
        diceBoxRef.value.clear()
      }
      clearTimer = null
    }, 1000)
    return result
  }

  return {
    initDiceBox,
    roll,
    isInitialized,
    updateConfig,
    reloadConfigFromServer,
  }
}
