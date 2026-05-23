create table if not exists public.story_media (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  url text not null,
  storage_path text,
  media_type text not null default 'image',
  caption text,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  constraint story_media_media_type_check check (media_type in ('image')),
  constraint story_media_url_not_blank check (char_length(trim(url)) > 0)
);

create index if not exists story_media_story_order_idx
  on public.story_media (story_id, sort_order, created_at);

alter table public.story_media enable row level security;

drop policy if exists "Public can read media for published stories" on public.story_media;
create policy "Public can read media for published stories"
on public.story_media
for select
using (
  exists (
    select 1
    from public.stories
    where stories.id = story_media.story_id
      and stories.status = 'published'
  )
);

drop policy if exists "Admins can read media for their stories" on public.story_media;
create policy "Admins can read media for their stories"
on public.story_media
for select
to authenticated
using (
  exists (
    select 1
    from public.stories
    where stories.id = story_media.story_id
      and stories.author_id = auth.uid()
      and public.is_newsroom_admin()
  )
);

drop policy if exists "Admins can insert media for their stories" on public.story_media;
create policy "Admins can insert media for their stories"
on public.story_media
for insert
to authenticated
with check (
  exists (
    select 1
    from public.stories
    where stories.id = story_media.story_id
      and stories.author_id = auth.uid()
      and public.is_newsroom_admin()
  )
);

drop policy if exists "Admins can update media for their stories" on public.story_media;
create policy "Admins can update media for their stories"
on public.story_media
for update
to authenticated
using (
  exists (
    select 1
    from public.stories
    where stories.id = story_media.story_id
      and stories.author_id = auth.uid()
      and public.is_newsroom_admin()
  )
)
with check (
  exists (
    select 1
    from public.stories
    where stories.id = story_media.story_id
      and stories.author_id = auth.uid()
      and public.is_newsroom_admin()
  )
);

drop policy if exists "Admins can delete media for their stories" on public.story_media;
create policy "Admins can delete media for their stories"
on public.story_media
for delete
to authenticated
using (
  exists (
    select 1
    from public.stories
    where stories.id = story_media.story_id
      and stories.author_id = auth.uid()
      and public.is_newsroom_admin()
  )
);
