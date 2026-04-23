-- Migration: Fix Supabase Storage zero-byte placeholder folder upload blocker
-- The previous policies aggressively checked for `[2]` (story ID) against public.stories
-- which fails silently when Supabase implicitly tries to create placeholder parent folders (e.g., `user_id/`)

drop policy if exists "Admins can upload story images" on storage.objects;
create policy "Admins can upload story images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'story-images'
  and public.is_newsroom_admin()
  and (storage.foldername(name))[1] = auth.uid()::text
  and (
    array_length(storage.foldername(name), 1) < 2
    or exists (
      select 1
      from public.stories
      where stories.id::text = (storage.foldername(name))[2]
        and stories.author_id = auth.uid()
    )
  )
);

drop policy if exists "Admins can update story images" on storage.objects;
create policy "Admins can update story images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'story-images'
  and public.is_newsroom_admin()
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'story-images'
  and public.is_newsroom_admin()
  and (storage.foldername(name))[1] = auth.uid()::text
  and (
    array_length(storage.foldername(name), 1) < 2
    or exists (
      select 1
      from public.stories
      where stories.id::text = (storage.foldername(name))[2]
        and stories.author_id = auth.uid()
    )
  )
);

drop policy if exists "Admins can upload story videos" on storage.objects;
create policy "Admins can upload story videos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'story-videos'
  and public.is_newsroom_admin()
  and (storage.foldername(name))[1] = auth.uid()::text
  and (
    array_length(storage.foldername(name), 1) < 2
    or exists (
      select 1
      from public.stories
      where stories.id::text = (storage.foldername(name))[2]
        and stories.author_id = auth.uid()
    )
  )
);

drop policy if exists "Admins can update story videos" on storage.objects;
create policy "Admins can update story videos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'story-videos'
  and public.is_newsroom_admin()
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'story-videos'
  and public.is_newsroom_admin()
  and (storage.foldername(name))[1] = auth.uid()::text
  and (
    array_length(storage.foldername(name), 1) < 2
    or exists (
      select 1
      from public.stories
      where stories.id::text = (storage.foldername(name))[2]
        and stories.author_id = auth.uid()
    )
  )
);
