-- ============================================
-- 管理员可修改任意用户的 profile（如用户名）
-- ============================================

create policy "profiles_update_admin" on public.profiles
  for update
  using ((select p.role from public.profiles p where p.id = auth.uid()) = 'admin');
