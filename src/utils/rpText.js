/**
 * 解析跑团文本中的标记。
 *
 * 约定：
 * - () 或 （）: 场外话（OOC），括号外观保持不变，仅内容作斜体展示
 *
 * 返回 token 列表：{ type: 'text' | 'ooc', text: string }
 * 注意：ooc 的 token.text 不含包裹符号本身。
 */
export function parseRpText(input) {
  const s = String(input ?? '')
  const tokens = []

  const push = (type, text) => {
    if (!text) return
    tokens.push({ type, text })
  }

  let i = 0
  while (i < s.length) {
    const ch = s[i]

    // 场外：(...) 或 （...）
    if (ch === '(' || ch === '（') {
      const closeChar = ch === '(' ? ')' : '）'
      const j = s.indexOf(closeChar, i + 1)
      if (j !== -1) {
        push('ooc', s.slice(i + 1, j))
        i = j + 1
        continue
      }
      // 没找到闭合，按普通文本处理
    }

    // 普通文本：吃到下一个标记为止
    let next = s.length
    const idxParen = s.indexOf('(', i)
    const idxParenFull = s.indexOf('（', i)
    for (const v of [idxParen, idxParenFull]) {
      if (v !== -1 && v < next) next = v
    }
    push('text', s.slice(i, next))
    i = next
  }

  return tokens
}

/**
 * 用于渲染的辅助：若未显式使用引号标注对白，且 defaultDialogue 为真，
 * 则把所有普通文本 token 视作对白 token（保持原有“PL 默认是对白”的体验）。
 */
export function toRenderableRpTokens(tokens, { defaultDialogue = false } = {}) {
  const list = Array.isArray(tokens) ? tokens : []
  if (!defaultDialogue) return list
  const hasDialogue = list.some((t) => t.type === 'dialogue')
  if (hasDialogue) return list
  return list.map((t) => (t.type === 'text' ? { ...t, type: 'dialogue' } : t))
}

