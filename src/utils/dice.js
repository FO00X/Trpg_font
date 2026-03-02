/**
 * 骰子工具：数学兜底 + 统一掷骰（优先 3D，失败用数学）
 * 支持 d4/d6/d8/d10/d12/d20/d100，d10 为 0~9（常用于 d% 十位），其余为 1~n
 */

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
 * 数学投骰（兜底用）
 * @param {string} notation 如 "3d6", "2d6+6", "1d20"
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

// ─── 统一掷骰：优先 3D，失败用数学兜底 ─────────────────────────────────────────

/**
 * 解析并掷骰：优先 3D，失败用数学。仅支持 XdY 如 "1d100"、"3d6"
 */
export async function parseAndRollDice(expr, roll3D, isDice3DInitialized) {
  const m = String(expr || '').trim().match(/^(\d*)d(\d+)$/i)
  if (!m) return null

  const count = m[1] ? Math.max(1, parseInt(m[1], 10)) : 1
  const sides = Math.max(1, parseInt(m[2], 10))
  if (count > 100 || sides > 1000) return null

  let rolls = []
  let sum = 0

  if (isDice3DInitialized?.value && typeof roll3D === 'function') {
    try {
      const res = await roll3D(`${count}d${sides}`)
      if (res && res.length > 0) {
        res.forEach((g) => {
          if (g.rolls) {
            g.rolls.forEach((r) => rolls.push(r.value))
          } else if (typeof g.value === 'number') {
            rolls.push(g.value)
          }
          if (typeof g.value === 'number') sum += g.value
        })
      }
    } catch {
      // 3D 失败，走数学兜底
    }
  }

  if (rolls.length === 0) {
    const r = rollNotation(`${count}d${sides}`)
    rolls = r.values || []
    sum = r.total || 0
  }

  return {
    count,
    sides,
    rolls,
    sum,
    expr: `${count}d${sides}`,
    detail: count > 1 ? ` = ${rolls.join(' + ')} = ${sum}` : ` = ${sum}`,
  }
}

/** 1d100，用于 D100 检定 */
export async function randomD100(roll3D, isDice3DInitialized) {
  const r = await parseAndRollDice('1d100', roll3D, isDice3DInitialized)
  if (r && typeof r.sum === 'number') return r.sum
  const fallback = rollNotation('1d100')
  return fallback.total || (Math.floor(Math.random() * 100) + 1)
}

/**
 * 解析理智损失 / 属性变化等：支持纯数字 "1" 或 "1d4"、"3d6"、"d10"
 */
export async function rollAmount(expr, roll3D, isDice3DInitialized) {
  const raw = String(expr || '').trim().toLowerCase()
  if (!raw) return { total: 0, detail: '0' }

  if (!raw.includes('d')) {
    const n = Number(raw)
    const v = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0
    return { total: v, detail: String(v) }
  }

  const r = await parseAndRollDice(raw, roll3D, isDice3DInitialized)
  if (!r) {
    const n = Number(raw)
    const v = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0
    return { total: v, detail: String(v) }
  }
  return { total: r.sum, detail: r.detail }
}