-- ============================================
-- 房间角色绑定：玩家角色申请与 KP 审核
-- ============================================

create table if not exists public.room_characters (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.room_characters enable row level security;

-- 自己或房主可以查看
create policy "room_characters_select_member_or_owner" on public.room_characters
  for select
  using (
    auth.uid() = user_id
    or exists (select 1 from public.game_rooms r where r.id = room_id and r.owner_id = auth.uid())
  );

-- 玩家为自己提交角色申请
create policy "room_characters_insert_own" on public.room_characters
  for insert
  with check (auth.uid() = user_id);

-- 仅房主可以修改申请状态（通过/拒绝）
create policy "room_characters_update_owner" on public.room_characters
  for update
  using (exists (select 1 from public.game_rooms r where r.id = room_id and r.owner_id = auth.uid()));

-- 玩家可撤回自己的申请，房主可清理
create policy "room_characters_delete_owner_or_own" on public.room_characters
  for delete
  using (
    auth.uid() = user_id
    or exists (select 1 from public.game_rooms r where r.id = room_id and r.owner_id = auth.uid())
  );

