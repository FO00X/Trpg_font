/**
 * 日期时间格式化工具
 * 统一使用 zh-CN 区域，便于视图一致调用
 */

/**
 * 完整日期时间：年-月-日 时:分:秒
 * @param {string|number|Date} timestamp - ISO 字符串、时间戳或 Date 对象
 * @returns {string}
 */
export function formatDateTime(timestamp) {
  if (!timestamp) return ''
  const d = new Date(timestamp)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/**
 * 仅日期：年-月-日
 * @param {string|number|Date} timestamp
 * @returns {string}
 */
export function formatDate(timestamp) {
  if (!timestamp) return ''
  const d = new Date(timestamp)
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

/**
 * 仅时间：时:分 或 时:分:秒
 * @param {string|number|Date} timestamp
 * @param {boolean} [includeSeconds=false] - 是否包含秒
 * @returns {string}
 */
export function formatTime(timestamp, includeSeconds = false) {
  if (!timestamp) return ''
  const d = new Date(timestamp)
  return d.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds ? { second: '2-digit' } : {}),
  })
}

/**
 * 短格式：月-日 时:分（用于通知列表等紧凑场景）
 * @param {string|number|Date} timestamp
 * @returns {string}
 */
export function formatShortDateTime(timestamp) {
  if (!timestamp) return ''
  const d = new Date(timestamp)
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) +
    ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

/**
 * 相对短格式：同一天仅显示时:分，否则显示月-日 时:分
 * @param {string|number|Date} timestamp
 * @returns {string}
 */
export function formatRelativeShort(timestamp) {
  if (!timestamp) return ''
  const d = new Date(timestamp)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  return formatShortDateTime(timestamp)
}
