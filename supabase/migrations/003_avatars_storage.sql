-- 头像存储桶：公开读，仅允许用户上传/覆盖/删除自己目录下的文件
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

-- 仅允许认证用户向自己的目录上传（路径首段为 auth.uid()）
create policy "avatars_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = (auth.uid())::text
);

-- 仅允许用户更新自己目录下的文件
create policy "avatars_update_own"
on storage.objects for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (auth.uid())::text);

-- 仅允许用户删除自己目录下的文件
create policy "avatars_delete_own"
on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (auth.uid())::text);

-- 公开读（与 bucket public 配合，便于前端直接使用 URL 显示头像）
create policy "avatars_select_public"
on storage.objects for select to public
using (bucket_id = 'avatars');
