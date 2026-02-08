/**
 * 骰子工具：支持 d4/d6/d8/d10/d12/d20/d100
 * d10 为 0~9（常用于 d% 十位）；其余为 1~n
 */

export const DICE_SIDES = {
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,   // 0-9
  d12: 12,
  d20: 20,
  d100: 100,
}

/** 投一枚 n 面骰：1~n；d10 特殊为 0~9 */
export function rollDie(sides) {
  if (sides === 10) return Math.floor(Math.random() * 10) // 0~9
  return Math.floor(Math.random() * sides) + 1 // 1~n
}

/**
 * 解析骰子表达式：3d6、2d6+6、1d20、d%
 * @returns { count, sides, modifier } 或 null
 */
export function parseNotation(notation) {
  const s = String(notation).trim().toLowerCase()
  // d% 或 d100
  if (s === 'd%' || s === 'd100') return { count: 1, sides: 100, modifier: 0 }
  const match = s.match(/^(\d*)d(\d+)(?:\s*\+\s*(\d+))?$/)
  if (!match) return null
  const count = match[1] ? parseInt(match[1], 10) : 1
  const sides = parseInt(match[2], 10)
  const modifier = match[3] ? parseInt(match[3], 10) : 0
  if (count < 1 || sides < 2) return null
  return { count, sides, modifier }
}

/**
 * 按表达式投骰
 * @param {string} notation 如 "3d6", "2d6+6", "1d20"
 * @returns {{ values: number[], total: number, modifier: number, notation: string }}
 */
export function rollNotation(notation) {
  const parsed = parseNotation(notation)
  if (!parsed) return { values: [], total: 0, modifier: 0, notation }
  const { count, sides, modifier } = parsed
  const values = []
  for (let i = 0; i < count; i++) values.push(rollDie(sides))
  const sum = values.reduce((a, b) => a + b, 0)
  const total = sum + modifier
  return { values, total, modifier, notation }
}

/** 获取某面数的骰子显示用范围（用于动画逐格） */
export function getFaceRange(sides) {
  if (sides === 10) return { min: 0, max: 9 } // d10: 0~9
  return { min: 1, max: sides }
}
