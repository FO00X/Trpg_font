-- ============================================
-- 房间申请通知函数与触发器
-- ============================================

-- 函数：当有人对房间发起申请时，给房主插入一条通知
create or replace function public.notify_room_apply()
returns trigger as $$
begin
  insert into public.notifications (user_id, type, title, content, link)
  select
    g.owner_id,
    'room_apply',
    '房间申请',
    (select username from public.profiles where id = new.user_id) || ' 申请加入你的房间',
    '/game-rooms/' || new.room_id || '?applicant=' || new.user_id
  from public.game_rooms g
  where g.id = new.room_id;

  return new;
end;
$$ language plpgsql security definer;

-- 触发器：在房间申请表插入记录后调用上面的函数
drop trigger if exists on_room_application_created on public.game_room_applications;

create trigger on_room_application_created
  after insert on public.game_room_applications
  for each row
  execute function public.notify_room_apply();

