-- ============================================
-- 功能模块：好友、笔记、通知、线索
-- ============================================

-- ========== 好友与好友请求 ==========
create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now(),
  unique(from_user_id, to_user_id)
);

alter table public.friend_requests enable row level security;

-- 只能看自己发出或收到的请求
create policy "friend_requests_select_own" on public.friend_requests for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);
create policy "friend_requests_insert_own" on public.friend_requests for insert
  with check (auth.uid() = from_user_id);
create policy "friend_requests_update_recipient" on public.friend_requests for update
  using (auth.uid() = to_user_id);
create policy "friend_requests_delete_own" on public.friend_requests for delete
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create index if not exists friend_requests_to_user_status_idx on public.friend_requests(to_user_id, status);
create index if not exists friend_requests_from_user_status_idx on public.friend_requests(from_user_id, status);

-- ========== Profiles 搜索权限 ==========
-- 允许已登录用户读取所有 profiles 的 id、username（用于好友搜索）
-- 原有 profiles_select_own 仍保留，多条 SELECT 策略为 OR 关系
create policy "profiles_select_authenticated" on public.profiles
  for select using (auth.uid() is not null);

-- ========== 笔记表 ==========
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  content text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.notes enable row level security;
create policy "notes_all_own" on public.notes for all using (auth.uid() = user_id);
create index if not exists notes_user_id_updated_at_idx on public.notes(user_id, updated_at desc);

-- ========== 消息/通知表 ==========
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'system' check (type in ('system', 'friend_request', 'room_invite', 'room_apply')),
  title text not null default '',
  content text not null default '',
  link text,
  read boolean not null default false,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;
create policy "notifications_all_own" on public.notifications for all using (auth.uid() = user_id);
create index if not exists notifications_user_id_read_created_idx on public.notifications(user_id, read, created_at desc);

-- ========== 通知触发器 ==========
-- 好友申请时给被申请者插入一条通知（需能替对方插入，用 security definer）
create or replace function public.notify_friend_request()
returns trigger as $$
begin
  insert into public.notifications (user_id, type, title, content, link)
  select
    new.to_user_id,
    'friend_request',
    '好友申请',
    (select username from public.profiles where id = new.from_user_id) || ' 请求添加你为好友',
    '/friends'
  from public.profiles where id = new.from_user_id;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_friend_request_created
  after insert on public.friend_requests
  for each row when (new.status = 'pending')
  execute function public.notify_friend_request();

-- 房间有人申请时给房主插入通知
create or replace function public.notify_room_apply()
returns trigger as $$
begin
  insert into public.notifications (user_id, type, title, content, link)
  select
    g.owner_id,
    'room_apply',
    '房间申请',
    (select username from public.profiles where id = new.user_id) || ' 申请加入你的房间',
    '/game-rooms'
  from public.game_rooms g where g.id = new.room_id;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_room_application_created
  after insert on public.game_room_applications
  for each row
  execute function public.notify_room_apply();

-- ========== 房间线索 ==========
create table if not exists public.room_clues (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null default '',
  images text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.room_clues enable row level security;

-- 房间成员可查看该房间的所有线索
create policy "clues_select_room_members" on public.room_clues for select
  using (
    exists (
      select 1 from public.game_rooms g
      where g.id = room_id
      and (
        g.owner_id = auth.uid()
        or exists (
          select 1 from public.game_room_applications a
          where a.room_id = g.id and a.user_id = auth.uid() and a.status = 'accepted'
        )
      )
    )
  );

-- 房间成员可创建线索
create policy "clues_insert_room_members" on public.room_clues for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.game_rooms g
      where g.id = room_id
      and (
        g.owner_id = auth.uid()
        or exists (
          select 1 from public.game_room_applications a
          where a.room_id = g.id and a.user_id = auth.uid() and a.status = 'accepted'
        )
      )
    )
  );

-- 创建者可更新/删除自己的线索
create policy "clues_update_own" on public.room_clues for update
  using (auth.uid() = user_id);
create policy "clues_delete_own" on public.room_clues for delete
  using (auth.uid() = user_id);

create index if not exists room_clues_room_id_created_idx on public.room_clues(room_id, created_at desc);

-- 注意：需要创建 Supabase Storage bucket 用于存储线索图片
-- 在 Supabase Dashboard → Storage 中创建 bucket：
--   - 名称：room-clues-images
--   - 公开：是（或使用 RLS 策略允许房间成员访问）
--   - RLS 策略（如果设为私有）：
--     - SELECT: 允许房间成员查看
--     - INSERT: 允许房间成员上传
--     - UPDATE/DELETE: 允许创建者操作
