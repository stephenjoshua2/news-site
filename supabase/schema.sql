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

create table if not exists public.site_settings (
  id integer primary key default 1,
  author_bio text,
  social_twitter text,
  social_linkedin text,
  social_instagram text,
  updated_at timestamptz not null default timezone('utc', now()),
  constraint site_settings_single_row check (id = 1)
);

insert into public.site_settings (id)
values (1)
on conflict (id) do nothing;

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
  views integer not null default 0,
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
  parent_id uuid references public.comments(id) on delete cascade,
  author_name text not null,
  body text not null,
  created_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id) on delete set null,
  moderation_reason text,
  constraint comments_parent_not_self check (
    parent_id is null or parent_id <> id
  ),
  constraint comments_author_name_length check (
    char_length(trim(author_name)) between 2 and 80
  ),
  constraint comments_body_length check (
    char_length(trim(body)) between 2 and 1000
  )
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default timezone('utc', now()),
  status text not null default 'unread',
  constraint contact_messages_name_length check (char_length(trim(name)) between 2 and 120),
  constraint contact_messages_email_length check (char_length(trim(email)) between 5 and 254),
  constraint contact_messages_message_length check (char_length(trim(message)) between 10 and 4000)
);

create index if not exists stories_status_published_idx
  on public.stories (status, published_at desc, created_at desc);

create index if not exists stories_author_updated_idx
  on public.stories (author_id, updated_at desc);

create index if not exists comments_story_created_idx
  on public.comments (story_id, created_at desc);

create index if not exists comments_parent_id_idx
  on public.comments (parent_id);

drop trigger if exists stories_set_updated_at on public.stories;
create trigger stories_set_updated_at
before update on public.stories
for each row
execute function public.set_updated_at();

alter table public.admin_users enable row level security;
alter table public.site_settings enable row level security;
alter table public.stories enable row level security;
alter table public.comments enable row level security;
alter table public.contact_messages enable row level security;

drop policy if exists "Admin users can view their admin row" on public.admin_users;
create policy "Admin users can view their admin row"
on public.admin_users
for select
to authenticated
using (email = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
on public.site_settings
for select
using (true);

drop policy if exists "Admins can update site settings" on public.site_settings;
create policy "Admins can update site settings"
on public.site_settings
for update
to authenticated
using (public.is_newsroom_admin())
with check (public.is_newsroom_admin());

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
using (deleted_at is null);

drop policy if exists "Admins can read all comments" on public.comments;
create policy "Admins can read all comments"
on public.comments
for select
to authenticated
using (public.is_newsroom_admin());

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
  and (
    comments.parent_id is null
    or exists (
      select 1
      from public.comments parent
      where parent.id = comments.parent_id
        and parent.story_id = comments.story_id
        and parent.parent_id is null
    )
  )
);

drop policy if exists "Admins can update comments for moderation" on public.comments;
create policy "Admins can update comments for moderation"
on public.comments
for update
to authenticated
using (public.is_newsroom_admin())
with check (public.is_newsroom_admin());

drop policy if exists "Admins can delete comments" on public.comments;
create policy "Admins can delete comments"
on public.comments
for delete
to authenticated
using (public.is_newsroom_admin());

drop policy if exists "Visitors can submit contact messages" on public.contact_messages;
create policy "Visitors can submit contact messages"
on public.contact_messages
for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can read contact messages" on public.contact_messages;
create policy "Admins can read contact messages"
on public.contact_messages
for select
to authenticated
using (public.is_newsroom_admin());

create or replace function public.increment_views(story_id_input uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.stories
  set views = views + 1
  where id = story_id_input
    and status = 'published';
end;
$$;

grant execute on function public.increment_views(uuid) to anon;
grant execute on function public.increment_views(uuid) to authenticated;

create table if not exists public.submission_rate_limits (
  scope text not null,
  subject_hash text not null,
  window_started_at timestamptz not null default timezone('utc', now()),
  last_submitted_at timestamptz not null default timezone('utc', now()),
  submission_count integer not null default 1,
  last_content_hash text,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (scope, subject_hash),
  constraint submission_rate_limits_scope_length check (char_length(scope) between 2 and 80),
  constraint submission_rate_limits_subject_hash_length check (char_length(subject_hash) between 32 and 128),
  constraint submission_rate_limits_submission_count_positive check (submission_count > 0)
);

alter table public.submission_rate_limits enable row level security;

create or replace function public.consume_submission_rate_limit(
  scope_input text,
  subject_hash_input text,
  content_hash_input text,
  cooldown_seconds integer,
  window_seconds integer,
  max_submissions integer
)
returns table (allowed boolean, reason text)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_row public.submission_rate_limits%rowtype;
  now_utc timestamptz := timezone('utc', now());
begin
  if scope_input is null
    or subject_hash_input is null
    or content_hash_input is null
    or char_length(scope_input) < 2
    or char_length(subject_hash_input) < 32
    or cooldown_seconds < 1
    or window_seconds < 1
    or max_submissions < 1
  then
    allowed := false;
    reason := 'invalid';
    return next;
    return;
  end if;

  select *
  into current_row
  from public.submission_rate_limits
  where scope = scope_input
    and subject_hash = subject_hash_input
  for update;

  if not found then
    insert into public.submission_rate_limits (
      scope,
      subject_hash,
      window_started_at,
      last_submitted_at,
      submission_count,
      last_content_hash,
      updated_at
    )
    values (
      scope_input,
      subject_hash_input,
      now_utc,
      now_utc,
      1,
      content_hash_input,
      now_utc
    );

    allowed := true;
    reason := 'ok';
    return next;
    return;
  end if;

  if current_row.last_content_hash = content_hash_input then
    allowed := false;
    reason := 'duplicate';
    return next;
    return;
  end if;

  if current_row.last_submitted_at > now_utc - make_interval(secs => cooldown_seconds) then
    allowed := false;
    reason := 'cooldown';
    return next;
    return;
  end if;

  if current_row.window_started_at <= now_utc - make_interval(secs => window_seconds) then
    update public.submission_rate_limits
    set
      window_started_at = now_utc,
      last_submitted_at = now_utc,
      submission_count = 1,
      last_content_hash = content_hash_input,
      updated_at = now_utc
    where scope = scope_input
      and subject_hash = subject_hash_input;

    allowed := true;
    reason := 'ok';
    return next;
    return;
  end if;

  if current_row.submission_count >= max_submissions then
    allowed := false;
    reason := 'rate_limited';
    return next;
    return;
  end if;

  update public.submission_rate_limits
  set
    last_submitted_at = now_utc,
    submission_count = submission_count + 1,
    last_content_hash = content_hash_input,
    updated_at = now_utc
  where scope = scope_input
    and subject_hash = subject_hash_input;

  allowed := true;
  reason := 'ok';
  return next;
end;
$$;

grant execute on function public.consume_submission_rate_limit(text, text, text, integer, integer, integer) to anon;
grant execute on function public.consume_submission_rate_limit(text, text, text, integer, integer, integer) to authenticated;

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
