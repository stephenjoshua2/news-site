create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'story_status'
  ) then
    create type public.story_status as enum ('draft', 'published');
  end if;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.admin_users (
  email text primary key,
  created_at timestamptz not null default timezone('utc', now()),
  constraint admin_users_email_lowercase check (email = lower(email))
);

create or replace function public.is_newsroom_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null,
  location text,
  excerpt text not null,
  content text not null,
  status public.story_status not null default 'draft',
  featured_image_url text,
  featured_image_path text,
  video_url text,
  video_path text,
  video_caption text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  published_at timestamptz,
  constraint stories_title_length check (char_length(trim(title)) >= 3),
  constraint stories_excerpt_length check (char_length(trim(excerpt)) >= 10),
  constraint stories_content_length check (char_length(trim(content)) >= 20),
  constraint stories_publish_state check (
    (status = 'draft' and published_at is null)
    or
    (status = 'published' and published_at is not null)
  )
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  author_name text not null,
  body text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint comments_author_name_length check (
    char_length(trim(author_name)) between 2 and 80
  ),
  constraint comments_body_length check (
    char_length(trim(body)) between 2 and 1000
  )
);

create index if not exists stories_status_published_idx
  on public.stories (status, published_at desc, created_at desc);

create index if not exists stories_author_updated_idx
  on public.stories (author_id, updated_at desc);

create index if not exists comments_story_created_idx
  on public.comments (story_id, created_at desc);

drop trigger if exists stories_set_updated_at on public.stories;
create trigger stories_set_updated_at
before update on public.stories
for each row
execute function public.set_updated_at();

alter table public.admin_users enable row level security;
alter table public.stories enable row level security;
alter table public.comments enable row level security;

drop policy if exists "Admin users can view their admin row" on public.admin_users;
create policy "Admin users can view their admin row"
on public.admin_users
for select
to authenticated
using (email = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "Published stories are public" on public.stories;
create policy "Published stories are public"
on public.stories
for select
using (status = 'published');

drop policy if exists "Admins can read their own stories" on public.stories;
create policy "Admins can read their own stories"
on public.stories
for select
to authenticated
using (author_id = auth.uid() and public.is_newsroom_admin());

drop policy if exists "Admins can insert stories" on public.stories;
create policy "Admins can insert stories"
on public.stories
for insert
to authenticated
with check (author_id = auth.uid() and public.is_newsroom_admin());

drop policy if exists "Admins can update stories" on public.stories;
create policy "Admins can update stories"
on public.stories
for update
to authenticated
using (author_id = auth.uid() and public.is_newsroom_admin())
with check (author_id = auth.uid() and public.is_newsroom_admin());

drop policy if exists "Admins can delete stories" on public.stories;
create policy "Admins can delete stories"
on public.stories
for delete
to authenticated
using (author_id = auth.uid() and public.is_newsroom_admin());

drop policy if exists "Comments are public" on public.comments;
create policy "Comments are public"
on public.comments
for select
using (true);

drop policy if exists "Visitors can add comments to published stories" on public.comments;
create policy "Visitors can add comments to published stories"
on public.comments
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.stories
    where stories.id = comments.story_id
      and stories.status = 'published'
  )
);

insert into storage.buckets (id, name, public)
values ('story-images', 'story-images', true)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public;

insert into storage.buckets (id, name, public)
values ('story-videos', 'story-videos', true)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public;

drop policy if exists "Public can view story images" on storage.objects;
create policy "Public can view story images"
on storage.objects
for select
using (bucket_id = 'story-images');

drop policy if exists "Public can view story videos" on storage.objects;
create policy "Public can view story videos"
on storage.objects
for select
using (bucket_id = 'story-videos');

drop policy if exists "Admins can upload story images" on storage.objects;
create policy "Admins can upload story images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'story-images'
  and public.is_newsroom_admin()
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1
    from public.stories
    where stories.id::text = (storage.foldername(name))[2]
      and stories.author_id = auth.uid()
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
  and exists (
    select 1
    from public.stories
    where stories.id::text = (storage.foldername(name))[2]
      and stories.author_id = auth.uid()
  )
);

drop policy if exists "Admins can delete story images" on storage.objects;
create policy "Admins can delete story images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'story-images'
  and public.is_newsroom_admin()
  and (storage.foldername(name))[1] = auth.uid()::text
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
  and exists (
    select 1
    from public.stories
    where stories.id::text = (storage.foldername(name))[2]
      and stories.author_id = auth.uid()
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
  and exists (
    select 1
    from public.stories
    where stories.id::text = (storage.foldername(name))[2]
      and stories.author_id = auth.uid()
  )
);

drop policy if exists "Admins can delete story videos" on storage.objects;
create policy "Admins can delete story videos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'story-videos'
  and public.is_newsroom_admin()
  and (storage.foldername(name))[1] = auth.uid()::text
);
