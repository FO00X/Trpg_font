-- ============================================
-- 通知表增加决策结果字段（房间申请等）
-- ============================================

alter table if exists public.notifications
  add column if not exists decision text
    check (decision in ('accepted', 'rejected'));

create index if not exists notifications_user_type_decision_idx
  on public.notifications(user_id, type, decision);

