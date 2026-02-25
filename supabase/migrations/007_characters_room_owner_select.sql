-- ============================================
-- 允许提交到房间审核的角色卡被他人查看
-- ============================================

-- 默认策略仅允许角色拥有者自己访问：
--   create policy "characters_all_own" on public.characters for all using (auth.uid() = user_id);
-- 这里增加一条额外的 SELECT 策略：
-- - 角色拥有者本人：依然可见（与原策略一致）
-- - 只要该角色卡已提交到任意房间（出现在 room_characters 中），
--   则所有已登录用户都可以查看这张卡（用于房间内公开展示）

create policy "characters_select_submitted" on public.characters
  for select
  using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.room_characters rc
      where rc.character_id = public.characters.id
    )
  );

