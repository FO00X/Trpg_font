-- TRPG 初始表结构（Supabase）
-- 在 Supabase Dashboard → SQL Editor 中执行，或使用 Supabase CLI 迁移

-- 1. 启用 UUID 扩展（Supabase 默认已启用）
-- create extension if not exists "uuid-ossp";

-- 2. 用户资料（与 auth.users 一对一，用 RLS 保护）
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  avatar text,
  updated_at timestamptz default now()
);

-- 仅允许用户读写自己的 profile
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- 3. 角色卡（COC 表存 jsonb）
create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.characters enable row level security;
create policy "characters_all_own" on public.characters for all using (auth.uid() = user_id);

create index if not exists characters_user_id_idx on public.characters(user_id);

-- 4. 大厅房间
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

-- 5. 房间申请
create table if not exists public.game_room_applications (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(room_id, user_id)
);

alter table public.game_room_applications enable row level security;
create policy "applications_select_room_owner_or_self" on public.game_room_applications for select
  using (
    auth.uid() = user_id or
    exists (select 1 from public.game_rooms g where g.id = room_id and g.owner_id = auth.uid())
  );
create policy "applications_insert_own" on public.game_room_applications for insert with check (auth.uid() = user_id);
create policy "applications_delete_own" on public.game_room_applications for delete using (auth.uid() = user_id);

-- 6. 频道（大厅等公共频道）
create table if not exists public.channels (
  id text primary key,
  name text not null,
  icon text,
  created_at timestamptz default now()
);

alter table public.channels enable row level security;
create policy "channels_select_all" on public.channels for select using (true);

-- 7. 模组（跑团模组，含子频道 jsonb）
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

-- 8. 聊天消息（支持 Realtime 订阅）
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

-- 启用 Realtime 发布（供前端订阅新消息）
alter publication supabase_realtime add table public.messages;

-- 9. 大厅房间可选模组与标签（下拉用）
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

create table if not exists public.game_room_tag_options (
  tag text primary key
);
alter table public.game_room_tag_options enable row level security;
create policy "tag_options_select_all" on public.game_room_tag_options for select using (true);
insert into public.game_room_tag_options (tag) values ('COC'), ('轻松'), ('严肃'), ('新手向') on conflict (tag) do nothing;

-- 10. 插入默认大厅频道
insert into public.channels (id, name, icon) values ('general', '大厅', 'mdi:home') on conflict (id) do nothing;

-- 11. 新用户注册时自动创建 profile（使用 email 前缀作为 username）
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(split_part(new.raw_user_meta_data->>'email', '@', 1), new.id::text));
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
