-- 成就初始数据：在 Supabase SQL 编辑器中执行，或通过 migration 运行
-- 使用 ON CONFLICT 可重复执行，不会重复插入

INSERT INTO public.achievements (
  id,
  title,
  description,
  category,
  icon,
  stat_key,
  threshold,
  enabled,
  sort_order,
  updated_at
) VALUES
  ('first_message', '开口说话', '在任意房间发送第一条聊天消息', '聊天', 'mdi:chat-processing-outline', 'messagesSent', 1, true, 10, now()),
  ('chatty', '话唠', '累计发送 50 条聊天消息', '聊天', 'mdi:chat-outline', 'messagesSent', 50, true, 20, now()),
  ('chat_enthusiast', '群聊达人', '累计发送 200 条聊天消息', '聊天', 'mdi:forum-outline', 'messagesSent', 200, true, 30, now()),
  ('first_dice', '第一次掷骰', '完成一次公开掷骰', '掷骰', 'mdi:dice-5-outline', 'diceRolls', 1, true, 40, now()),
  ('dice_master', '骰运加护', '累计掷骰 100 次', '掷骰', 'mdi:dice-multiple-outline', 'diceRolls', 100, true, 50, now()),
  ('dice_addict', '骰子成瘾', '累计掷骰 500 次', '掷骰', 'mdi:dice-6-outline', 'diceRolls', 500, true, 60, now()),
  ('first_note', '记录员', '创建第一篇个人笔记', '笔记', 'mdi:note-text-outline', 'notesCreated', 1, true, 70, now()),
  ('note_prolific', '笔耕不辍', '创建 10 篇个人笔记', '笔记', 'mdi:notebook-multiple-outline', 'notesCreated', 10, true, 80, now()),
  ('first_room', '开团者', '成功创建第一个跑团房间', '跑团', 'mdi:dice-multiple', 'roomsCreated', 1, true, 90, now()),
  ('room_host_pro', '多开房主', '成功创建 5 个跑团房间', '跑团', 'mdi:home-group', 'roomsCreated', 5, true, 100, now()),
  ('first_critical_success', '第一次大成功', '掷出一次大成功（骰出 1）', '掷骰', 'mdi:emoticon-cool-outline', 'diceCriticalSuccess', 1, true, 110, now()),
  ('critical_success_10', '大成功达人', '累计掷出 10 次大成功', '掷骰', 'mdi:star-four-points-outline', 'diceCriticalSuccess', 10, true, 120, now()),
  ('first_critical_fail', '第一次大失败', '掷出一次大失败（骰出 100 或 96+ 且目标值低于 50）', '掷骰', 'mdi:emoticon-sad-outline', 'diceCriticalFail', 1, true, 130, now()),
  ('first_dice_success', '成功检定', '完成一次成功的技能/属性/理智检定', '掷骰', 'mdi:check-circle-outline', 'diceSuccess', 1, true, 140, now()),
  ('dice_success_50', '检定熟手', '累计成功检定 50 次', '掷骰', 'mdi:check-decagram-outline', 'diceSuccess', 50, true, 150, now()),
  ('first_dice_fail', '第一次失败', '检定失败一次', '掷骰', 'mdi:close-circle-outline', 'diceFail', 1, true, 160, now()),
  ('dice_fail_10', '屡败屡战', '累计检定失败 10 次', '掷骰', 'mdi:reload', 'diceFail', 10, true, 170, now()),
  ('first_on_the_line', '卡线', '掷出刚好等于目标值（卡线）一次', '掷骰', 'mdi:ray-vertex', 'diceOnTheLine', 1, true, 180, now()),
  ('on_the_line_5', '卡线王', '累计卡线 5 次', '掷骰', 'mdi:target', 'diceOnTheLine', 5, true, 190, now())
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  stat_key = EXCLUDED.stat_key,
  threshold = EXCLUDED.threshold,
  enabled = EXCLUDED.enabled,
  sort_order = EXCLUDED.sort_order,
  updated_at = EXCLUDED.updated_at;
