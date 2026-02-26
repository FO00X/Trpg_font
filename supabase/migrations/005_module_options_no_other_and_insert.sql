-- 1. 移除模组选项中的「其他」，不再在列表中展示
delete from public.game_room_module_options where id = 'other';

-- 2. 允许已登录用户向模组选项表插入新行（用户创建房间时使用的自定义模组会加入列表）
create policy "module_options_insert_authenticated"
  on public.game_room_module_options
  for insert
  with check (auth.uid() is not null);
