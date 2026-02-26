-- ============================================
-- 更新记录表：所有人可查看，仅管理员可增删改
-- ============================================

create table if not exists public.update_logs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.update_logs is '系统更新记录，时间轴展示，仅管理员可增删改';

alter table public.update_logs enable row level security;

-- 已登录用户均可查看
create policy "update_logs_select_authenticated"
  on public.update_logs for select
  using (auth.uid() is not null);

-- 仅管理员可插入
create policy "update_logs_insert_admin"
  on public.update_logs for insert
  with check ((select p.role from public.profiles p where p.id = auth.uid()) = 'admin');

-- 仅管理员可更新
create policy "update_logs_update_admin"
  on public.update_logs for update
  using ((select p.role from public.profiles p where p.id = auth.uid()) = 'admin');

-- 仅管理员可删除
create policy "update_logs_delete_admin"
  on public.update_logs for delete
  using ((select p.role from public.profiles p where p.id = auth.uid()) = 'admin');

create index if not exists update_logs_created_at_idx on public.update_logs(created_at desc);
