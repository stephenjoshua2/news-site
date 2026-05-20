alter table public.stories
  add column if not exists is_breaking boolean not null default false,
  add column if not exists breaking_label text,
  add column if not exists breaking_expires_at timestamptz;

create index if not exists stories_active_breaking_idx
  on public.stories (breaking_expires_at desc, published_at desc)
  where status = 'published' and is_breaking = true;
