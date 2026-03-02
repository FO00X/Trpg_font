-- ============================================
-- TRPG 一键建库脚本（推荐）
-- 用途：当你更换/重建数据库时，直接执行本文件即可完成表结构 + RLS + 必要种子数据。
-- 说明：下方包含 Supabase Storage 的 bucket / policy（需要在 Supabase 环境执行）。
-- ============================================

-- 常用扩展（Supabase 默认已启用，写上更稳）
create extension if not exists pgcrypto;

-- ============================================
-- 以下内容基于 supabase/migrations/001_complete_schema.sql
-- 并合并了 002～008 的增量变更。
-- ============================================

-- ---------- 1. 用户资料（与 auth.users 一对一） ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  avatar text,
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- 允许已登录用户读取所有 profiles 的 id、username（好友搜索等）
create policy "profiles_select_authenticated" on public.profiles
  for select using (auth.uid() is not null);

-- 用户权限统一放在 profiles，不另建表：user=普通用户, admin=管理员
alter table public.profiles
  add column if not exists role text not null default 'user'
  check (role in ('user', 'admin'));
comment on column public.profiles.role is 'user=普通用户, admin=管理员';

-- 管理员可修改任意用户的 profile（如用户名）
create policy "profiles_update_admin" on public.profiles
  for update
  using ((select p.role from public.profiles p where p.id = auth.uid()) = 'admin');

-- ---------- 2. 角色卡（COC 表存 jsonb） ----------
create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.characters enable row level security;
create policy "characters_all_own" on public.characters for all using (auth.uid() = user_id);
-- 已提交到房间审核的角色卡可被他人查看
create policy "characters_select_submitted" on public.characters for select
  using (
    auth.uid() = user_id
    or exists (select 1 from public.room_characters rc where rc.character_id = public.characters.id)
  );

create index if not exists characters_user_id_idx on public.characters(user_id);

-- ---------- 3. 大厅房间 ----------
create table if not exists public.game_rooms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  module text,
  tags text[] default '{}',
  status text not null default 'recruiting',
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.game_rooms enable row level security;
create policy "game_rooms_select_all" on public.game_rooms for select using (true);
create policy "game_rooms_insert_own" on public.game_rooms for insert with check (auth.uid() = owner_id);
create policy "game_rooms_update_own" on public.game_rooms for update using (auth.uid() = owner_id);
create policy "game_rooms_delete_own" on public.game_rooms for delete using (auth.uid() = owner_id);

create index if not exists game_rooms_status_idx on public.game_rooms(status);
create index if not exists game_rooms_module_idx on public.game_rooms(module);

-- 房间增强：模组文件、最大人数、背景故事
alter table public.game_rooms add column if not exists module_files jsonb not null default '[]';
alter table public.game_rooms add column if not exists max_players integer not null default 6;
alter table public.game_rooms add column if not exists backstory text;
comment on column public.game_rooms.module_files is '模组文件列表，每项: { id, name, url, type }';
comment on column public.game_rooms.max_players is '房间最大人数，默认 6';
comment on column public.game_rooms.backstory is '房间背景故事，供玩家阅读';

-- ---------- 4. 房间申请 ----------
create table if not exists public.game_room_applications (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now(),
  unique(room_id, user_id)
);

alter table public.game_room_applications enable row level security;
create policy "applications_select_room_owner_or_self" on public.game_room_applications for select
  using (auth.uid() = user_id or exists (select 1 from public.game_rooms g where g.id = room_id and g.owner_id = auth.uid()));
create policy "applications_insert_own" on public.game_room_applications for insert with check (auth.uid() = user_id);
create policy "applications_update_room_owner" on public.game_room_applications for update
  using (exists (select 1 from public.game_rooms g where g.id = room_id and g.owner_id = auth.uid()));
create policy "applications_delete_own" on public.game_room_applications for delete using (auth.uid() = user_id);

-- ---------- 5. 频道（大厅等） ----------
create table if not exists public.channels (
  id text primary key,
  name text not null,
  icon text,
  created_at timestamptz default now()
);

alter table public.channels enable row level security;
create policy "channels_select_all" on public.channels for select using (true);

insert into public.channels (id, name, icon) values ('general', '大厅', 'mdi:home') on conflict (id) do nothing;

-- ---------- 6. 模组（跑团模组） ----------
create table if not exists public.modules (
  id text primary key,
  name text not null,
  icon text,
  owner_id uuid not null references auth.users(id) on delete cascade,
  sub_channels jsonb not null default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.modules enable row level security;
create policy "modules_select_all" on public.modules for select using (true);
create policy "modules_insert_own" on public.modules for insert with check (auth.uid() = owner_id);
create policy "modules_update_own" on public.modules for update using (auth.uid() = owner_id);
create policy "modules_delete_own" on public.modules for delete using (auth.uid() = owner_id);

-- ---------- 7. 聊天消息（支持 Realtime） ----------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  channel_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  user_name text,
  content text not null,
  type text not null default 'text',
  speaker_role text,
  speaker_npc_id text,
  speaker_npc_name text,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;
create policy "messages_select_all" on public.messages for select using (true);
create policy "messages_insert_authenticated" on public.messages for insert with check (auth.uid() is not null);

create index if not exists messages_channel_id_created_at_idx on public.messages(channel_id, created_at desc);
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then
    null;
end
$$;

-- ---------- 8. 房间可选模组与标签 ----------
create table if not exists public.game_room_module_options (
  id text primary key,
  name text not null,
  icon text
);
alter table public.game_room_module_options enable row level security;
create policy "module_options_select_all" on public.game_room_module_options for select using (true);
insert into public.game_room_module_options (id, name, icon) values
  ('wangdie', '亡蝶葬仪', 'mdi:butterfly'),
  ('other', '其他', 'mdi:dots-horizontal')
on conflict (id) do nothing;

-- 移除模组选项中的「其他」，不再在列表中展示
delete from public.game_room_module_options where id = 'other';

-- 允许已登录用户插入自定义模组选项（创建房间时使用）
create policy "module_options_insert_authenticated"
  on public.game_room_module_options
  for insert
  with check (auth.uid() is not null);

create table if not exists public.game_room_tag_options (tag text primary key);
alter table public.game_room_tag_options enable row level security;
create policy "tag_options_select_all" on public.game_room_tag_options for select using (true);
insert into public.game_room_tag_options (tag) values ('COC'), ('轻松'), ('严肃'), ('新手向') on conflict (tag) do nothing;

-- ---------- 9. 新用户自动创建 profile ----------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(split_part(new.raw_user_meta_data->>'email', '@', 1), new.id::text));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- 10. 好友与好友请求 ----------
create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now(),
  unique(from_user_id, to_user_id)
);

alter table public.friend_requests enable row level security;
create policy "friend_requests_select_own" on public.friend_requests for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);
create policy "friend_requests_insert_own" on public.friend_requests for insert with check (auth.uid() = from_user_id);
create policy "friend_requests_update_recipient" on public.friend_requests for update using (auth.uid() = to_user_id);
create policy "friend_requests_delete_own" on public.friend_requests for delete
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create index if not exists friend_requests_to_user_status_idx on public.friend_requests(to_user_id, status);
create index if not exists friend_requests_from_user_status_idx on public.friend_requests(from_user_id, status);

-- ---------- 11. 笔记 ----------
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

-- ---------- 12. 通知 ----------
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

-- 通知决策结果（房间申请同意/拒绝等）
alter table public.notifications add column if not exists decision text check (decision in ('accepted', 'rejected'));
create index if not exists notifications_user_type_decision_idx on public.notifications(user_id, type, decision);

-- ---------- 13. 通知触发器：好友申请 ----------
create or replace function public.notify_friend_request()
returns trigger as $$
begin
  insert into public.notifications (user_id, type, title, content, link)
  select new.to_user_id, 'friend_request', '好友申请',
    (select username from public.profiles where id = new.from_user_id) || ' 请求添加你为好友',
    '/friends'
  from public.profiles where id = new.from_user_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_friend_request_created on public.friend_requests;
create trigger on_friend_request_created
  after insert on public.friend_requests
  for each row when (new.status = 'pending')
  execute function public.notify_friend_request();

-- ---------- 14. 通知触发器：房间申请 ----------
create or replace function public.notify_room_apply()
returns trigger as $$
begin
  insert into public.notifications (user_id, type, title, content, link)
  select g.owner_id, 'room_apply', '房间申请',
    (select username from public.profiles where id = new.user_id) || ' 申请加入你的房间',
    '/game-rooms/' || new.room_id || '?applicant=' || new.user_id
  from public.game_rooms g where g.id = new.room_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_room_application_created on public.game_room_applications;
create trigger on_room_application_created
  after insert on public.game_room_applications
  for each row
  execute function public.notify_room_apply();

-- ---------- 15. 房间线索 ----------
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
create policy "clues_select_room_members" on public.room_clues for select
  using (
    exists (
      select 1 from public.game_rooms g
      where g.id = room_id and (
        g.owner_id = auth.uid()
        or exists (select 1 from public.game_room_applications a where a.room_id = g.id and a.user_id = auth.uid() and a.status = 'accepted')
      )
    )
  );
create policy "clues_insert_room_members" on public.room_clues for insert with check (
  auth.uid() = user_id and exists (
    select 1 from public.game_rooms g where g.id = room_id and (
      g.owner_id = auth.uid()
      or exists (select 1 from public.game_room_applications a where a.room_id = g.id and a.user_id = auth.uid() and a.status = 'accepted')
    )
  )
);
create policy "clues_update_own" on public.room_clues for update using (auth.uid() = user_id);
create policy "clues_delete_own" on public.room_clues for delete using (auth.uid() = user_id);

create index if not exists room_clues_room_id_created_idx on public.room_clues(room_id, created_at desc);

-- ---------- 16. 房间角色绑定（玩家角色申请与 KP 审核） ----------
create table if not exists public.room_characters (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.room_characters enable row level security;
create policy "room_characters_select_member_or_owner" on public.room_characters for select
  using (auth.uid() = user_id or exists (select 1 from public.game_rooms r where r.id = room_id and r.owner_id = auth.uid()));
create policy "room_characters_insert_own" on public.room_characters for insert with check (auth.uid() = user_id);
create policy "room_characters_update_owner" on public.room_characters for update
  using (exists (select 1 from public.game_rooms r where r.id = room_id and r.owner_id = auth.uid()));
create policy "room_characters_delete_owner_or_own" on public.room_characters for delete
  using (auth.uid() = user_id or exists (select 1 from public.game_rooms r where r.id = room_id and r.owner_id = auth.uid()));

-- ---------- 17. 管理员：指定邮箱设为 admin ----------
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = '291603856@qq.com' limit 1);

-- ---------- 18. 管理员用户列表 RPC（仅 profiles.role = 'admin' 可调用） ----------
create or replace function public.admin_list_users()
returns table (id uuid, email text, username text, created_at timestamptz)
language plpgsql security definer set search_path = public, auth
as $$
begin
  if (select p.role from public.profiles p where p.id = auth.uid()) <> 'admin' then
    return;
  end if;
  return query
  select u.id, u.email::text, coalesce(p2.username, split_part(u.email::text, '@', 1))::text, u.created_at
  from auth.users u
  left join public.profiles p2 on p2.id = u.id
  order by u.created_at desc;
end;
$$;

comment on function public.admin_list_users() is 'Only callable when profiles.role=admin; returns id, email, username, created_at.';

-- ---------- 19. 更新记录表（所有登录用户可读，仅管理员可写） ----------
create table if not exists public.update_logs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.update_logs is '系统更新记录，时间轴展示，仅管理员可增删改';

alter table public.update_logs enable row level security;
create policy "update_logs_select_authenticated"
  on public.update_logs for select
  using (auth.uid() is not null);
create policy "update_logs_insert_admin"
  on public.update_logs for insert
  with check ((select p.role from public.profiles p where p.id = auth.uid()) = 'admin');
create policy "update_logs_update_admin"
  on public.update_logs for update
  using ((select p.role from public.profiles p where p.id = auth.uid()) = 'admin');
create policy "update_logs_delete_admin"
  on public.update_logs for delete
  using ((select p.role from public.profiles p where p.id = auth.uid()) = 'admin');
create index if not exists update_logs_created_at_idx on public.update_logs(created_at desc);

-- ---------- 20. Storage：avatars bucket（公开读；仅本人目录可写） ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "avatars_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = (auth.uid())::text
);
create policy "avatars_update_own"
on storage.objects for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (auth.uid())::text);
create policy "avatars_delete_own"
on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (auth.uid())::text);
create policy "avatars_select_public"
on storage.objects for select to public
using (bucket_id = 'avatars');

-- ---------- 21. Storage：room-clues-images bucket（公开读；认证用户可写） ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'room-clues-images',
  'room-clues-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "room_clues_images_insert_authenticated"
on storage.objects for insert to authenticated
with check (bucket_id = 'room-clues-images');
create policy "room_clues_images_update_authenticated"
on storage.objects for update to authenticated
using (bucket_id = 'room-clues-images');
create policy "room_clues_images_delete_authenticated"
on storage.objects for delete to authenticated
using (bucket_id = 'room-clues-images');
create policy "room_clues_images_select_public"
on storage.objects for select to public
using (bucket_id = 'room-clues-images');

-- ---------- 22. AI 配置与小说模式存储 ----------
create table if not exists public.system_settings (
  id text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz default now()
);

alter table public.system_settings enable row level security;
create policy "settings_select_auth" on public.system_settings for select using (auth.uid() is not null);
create policy "settings_insert_admin" on public.system_settings for insert with check (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);
create policy "settings_update_admin" on public.system_settings for update using (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);
create policy "settings_delete_admin" on public.system_settings for delete using (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

insert into public.system_settings (id, value) values (
  'ai_config',
  '{"apiUrl": "https://api.openai.com/v1/chat/completions", "apiKey": "", "model": "gpt-4o-mini"}'
) on conflict (id) do nothing;

create table if not exists public.room_log_novels (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  date text not null,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(room_id, date)
);

alter table public.room_log_novels enable row level security;
create policy "room_log_novels_select_all" on public.room_log_novels for select using (auth.uid() is not null);
create policy "room_log_novels_insert_auth" on public.room_log_novels for insert with check (auth.uid() is not null);
create policy "room_log_novels_update_auth" on public.room_log_novels for update using (auth.uid() is not null);
