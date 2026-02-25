-- ============================================
-- 房间功能增强：申请状态、模组文件、最大人数
-- ============================================

-- ========== 房间申请状态 ==========
-- 房间申请增加状态：pending（待审核）、accepted（已通过）、rejected（已拒绝）
alter table public.game_room_applications
  add column if not exists status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected'));

-- 已有申请视为已通过，避免影响现有用户
update public.game_room_applications set status = 'accepted' where status is null or status = '';

-- 房主可更新申请状态（通过/拒绝）
create policy "applications_update_room_owner" on public.game_room_applications
  for update using (exists (select 1 from public.game_rooms g where g.id = room_id and g.owner_id = auth.uid()));

-- ========== 房间模组文件 ==========
-- 房主可上传/管理 docx、图片等，仅房主可见入口
alter table public.game_rooms
  add column if not exists module_files jsonb not null default '[]';

comment on column public.game_rooms.module_files is '模组文件列表，每项: { id, name, url, type }，type: docx|image|pdf|other';

-- ========== 房间最大人数 ==========
alter table public.game_rooms
  add column if not exists max_players integer not null default 6;

comment on column public.game_rooms.max_players is '房间最大人数，默认 6 人';
