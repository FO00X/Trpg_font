import { supabase } from '../lib/supabase'
import { MESSAGE_TYPES } from '../constants/enums'

/**
 * 将 messages 表的原始行/对象标准化为前端使用的消息结构。
 * 入参可以是 Supabase 返回的 row，也可以是已经半处理过的对象。
 */
export function normalizeMessageRow(row, currentUserId) {
  if (!row) return null

  const userId = row.user_id ?? row.userId ?? 'system'
  const userName =
    row.user_name ??
    row.userName ??
    (userId === 'system' ? '系统' : '未知')

  const createdAt =
    row.created_at ??
    row.time ??
    Date.now()

  return {
    id: row.id,
    userId,
    userName,
    userAvatar: row.user_avatar ?? row.userAvatar ?? null,
    content: row.content,
    time: typeof createdAt === 'number' ? createdAt : new Date(createdAt).getTime(),
    type: row.type || MESSAGE_TYPES.TEXT,
    // 新字段优先，兼容旧字段（speaker_npc_*）
    speakerRole: row.speaker_role ?? row.speakerRole ?? null,
    speakerId: row.speaker_id ?? row.speakerId ?? row.speaker_npc_id ?? row.speakerNpcId ?? null,
    speakerName: row.speaker_name ?? row.speakerName ?? row.speaker_npc_name ?? row.speakerNpcName ?? null,
    speakerPortrait:
      row.speaker_portrait ??
      row.speakerPortrait ??
      row.speaker_npc_portrait ??
      row.speakerNpcPortrait ??
      null,
    isSelf: currentUserId ? currentUserId === userId : false,
  }
}

/**
 * 发送一条普通用户消息，返回标准化后的消息对象。
 */
export async function sendUserMessage({
  channelId,
  userId,
  userName,
  content,
  type = MESSAGE_TYPES.TEXT,
  speakerRole = null,
  speakerId = null,
  speakerName = null,
}) {
  const payload = {
    channel_id: channelId,
    user_id: userId ?? null,
    user_name: userName ?? null,
    content,
    type,
    speaker_role: speakerRole,
    speaker_id: speakerId,
    speaker_name: speakerName,
  }

  const { data, error } = await supabase
    .from('messages')
    .insert(payload)
    .select('id, user_id, user_name, content, type, speaker_role, speaker_id, speaker_name, created_at')
    .single()

  if (error) {
    return { ok: false, error }
  }

  const msg = normalizeMessageRow(data, userId ?? undefined)
  return { ok: true, message: msg }
}

/**
 * 发送系统消息（包括房间内的小说式提示、骰娘文本等）。
 * 为避免重复，由调用方决定是否依赖 Realtime 来追加到本地列表。
 */
export async function sendSystemMessageRaw({
  channelId,
  content,
  type = MESSAGE_TYPES.SYSTEM,
}) {
  const payload = {
    channel_id: channelId,
    user_id: null,
    user_name: '骰娘',
    content,
    type,
  }
  const { error } = await supabase.from('messages').insert(payload)
  if (error) {
    return { ok: false, error }
  }
  return { ok: true }
}

/**
 * 按 channelId 拉取最近的消息列表（仅做原始查询，不做状态管理）。
 */
/**
 * 按 channelId 拉取最近的消息列表（仅做原始查询，不做状态管理）。
 * 注：messages.user_id 引用 auth.users，与 profiles 无直接 FK，故不在此处 join profiles。
 * 头像由调用方通过 profileCache.getProfiles 批量获取后合并。
 */
export async function fetchChannelMessagesRaw(channelId, { limit = 200 } = {}) {
  const { data, error } = await supabase
    .from('messages')
    .select('id, user_id, user_name, content, type, speaker_role, speaker_id, speaker_name, speaker_portrait, created_at')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) {
    return { ok: false, error }
  }

  const rows = data || []
  return { ok: true, rows }
}

