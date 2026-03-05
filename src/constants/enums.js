/**
 * 集中维护消息类型、房间状态、审核状态等枚举常量
 * 便于统一引用与后续扩展
 */

/** 消息类型 */
export const MESSAGE_TYPES = {
  TEXT: 'text',
  SYSTEM: 'system',
  HIDDEN_ROLL: 'hidden_roll',
  HIDDEN_SKILL: 'hidden_skill',
  CHECK_REQUEST: 'check_request',
  IMAGE: 'image',
}

/** 房间状态 */
export const ROOM_STATUS = {
  RECRUITING: 'recruiting',
  FULL: 'full',
  STARTED: 'started',
}

/** 房间状态标签映射 */
export const ROOM_STATUS_LABELS = {
  [ROOM_STATUS.RECRUITING]: '招募中',
  [ROOM_STATUS.FULL]: '已满员',
  [ROOM_STATUS.STARTED]: '进行中',
}

/** 房间角色/申请审核状态 */
export const ROOM_CHARACTER_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
}

/** 房间角色审核状态标签映射 */
export const ROOM_CHARACTER_STATUS_LABELS = {
  [ROOM_CHARACTER_STATUS.PENDING]: '审核中',
  [ROOM_CHARACTER_STATUS.ACCEPTED]: '已通过',
  [ROOM_CHARACTER_STATUS.REJECTED]: '被拒绝',
}
