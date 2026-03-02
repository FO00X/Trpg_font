import { ref, shallowRef } from 'vue'
import DiceBox from '@3d-dice/dice-box'

const diceBoxRef = shallowRef(null)
const isInitialized = ref(false)
let clearTimer = null

export function useDice3D() {
  async function initDiceBox(containerSelector) {
    if (diceBoxRef.value) return
    const box = new DiceBox(containerSelector, {
      assetPath: '/assets/',
      theme: 'default',
      themeColor: '#4826F2',
      scale: 3, // 骰子缩放比例
      spinForce: 3, // 骰子旋转力度
      throwForce: 2, // 骰子投掷力度
      startingHeight: 8, // 骰子起始高度
      gravity: 3, // 骰子重力
      mass: 3, // 骰子质量
      friction: 0.4, // 骰子与桌面的摩擦系数
      restitution: 0.3, // 骰子弹性，碰撞后的反弹力度
      linearDamping: 0.5, // 骰子线性阻尼，直线运动的减速速度
      angularDamping: 0.4, // 骰子角阻尼，旋转的减速速度
      spinForceSpread: 3, // 骰子旋转力度分散
      throwForceSpread: 0, // 骰子投掷力度分散
      lightIntensity: 0.8, // 骰子光效强度
      shadows: true, // 骰子阴影
      delay: 50, // 骰子延迟
      offscreen: true // 骰子离屏渲染
    })
    
    await box.init()
    diceBoxRef.value = box
    isInitialized.value = true
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
    isInitialized
  }
}
