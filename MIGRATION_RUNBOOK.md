# Migration Runbook

Updated: 2026-05-15

This project uses Supabase SQL managed as repo files. Apply changes deliberately per environment. Do not point preview/staging deployments at the production Supabase project unless that is an explicit operational choice.

## Current Schema Status

`supabase/schema.sql` is the current fresh-project target state. It includes the required latest state from the follow-up migrations:

- comment replies and parent integrity
- story views and `public.increment_views(uuid)`
- `site_settings` and `contact_messages`
- contact message constraints
- comment soft-delete moderation audit fields
- durable shared submission rate limiting
- storage buckets and storage object policies

Fresh projects should run `supabase/schema.sql` only, then run the verification SQL below. Existing projects should apply the ordered migration files, then run the same verification SQL. Both paths should converge to the same state.

## Environment Checklist

Required Vercel/Supabase app variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEWSROOM_ADMIN_EMAIL`
- `NEXT_PUBLIC_SITE_URL`
- `NEWSROOM_RATE_LIMIT_SALT`

Optional:

- `NEWSROOM_BANNED_TERMS`

`NEWSROOM_RATE_LIMIT_SALT` should be a secret, stable value per environment. Rotating it resets requester fingerprints for the durable rate limiter.

## Staging First

Apply every database change to staging first, verify the checks below, run the app against staging, and only then repeat the same migration on production.

Pre-production checklist:

- Confirm the production project has a recent backup or PITR available.
- Confirm the exact SQL files and order to run.
- Confirm `NEWSROOM_RATE_LIMIT_SALT` and `NEXT_PUBLIC_SITE_URL` are set in production.
- Confirm the admin user exists in Supabase Auth and `public.admin_users`.
- Run `npm.cmd run typecheck` and `npm.cmd run build`.
- Verify comment auto-publishing still works after automatic filtering/throttling.
- Verify admin comment removal soft-deletes instead of breaking the story page.

## Fresh Supabase Project

1. Create the Supabase project.
2. Enable Email authentication.
3. Run `supabase/schema.sql` once in the Supabase SQL editor.
4. Create the single admin user in Supabase Auth.
5. Add the admin email to `public.admin_users`.
6. Configure the Vercel environment variables above.
7. Run the verification SQL below.
8. Run `npm.cmd run typecheck` and `npm.cmd run build` locally before deploy.

## Existing Supabase Project

Before applying migrations to an existing project, confirm a restorable backup or PITR window exists. Do not proceed on production without backup/PITR confirmation.

Apply these migrations in staging first, then production after verification:

1. `schema-replies-migration.sql`
2. `schema-views-migration.sql`
3. `schema-infrastructure-migration.sql`
4. `schema-migration.sql`
5. `schema-comments-hardening-migration.sql`
6. `schema-contact-hardening-migration.sql`
7. `schema-rate-limit-and-moderation-migration.sql`

The migrations are mostly additive and use `IF NOT EXISTS`, `CREATE OR REPLACE`, or policy replacement where practical. Existing and fresh setups should be identical after this sequence.

## Verification SQL

Run these checks after fresh setup and after existing-project migrations.

### Required tables

```sql
select table_schema, table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'admin_users',
    'site_settings',
    'stories',
    'comments',
    'contact_messages',
    'submission_rate_limits'
  )
order by table_name;
```

Expected: all six tables appear.

### RLS enabled

```sql
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'admin_users',
    'site_settings',
    'stories',
    'comments',
    'contact_messages',
    'submission_rate_limits'
  )
order by c.relname;
```

Expected: `rls_enabled = true` for every listed table.

### Required columns

```sql
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'stories' and column_name in ('views', 'status', 'published_at'))
    or
    (table_name = 'comments' and column_name in (
      'parent_id',
      'deleted_at',
      'deleted_by',
      'moderation_reason'
    ))
    or
    (table_name = 'contact_messages' and column_name in (
      'name',
      'email',
      'message',
      'status'
    ))
    or
    (table_name = 'submission_rate_limits' and column_name in (
      'scope',
      'subject_hash',
      'window_started_at',
      'last_submitted_at',
      'submission_count',
      'last_content_hash'
    ))
  )
order by table_name, column_name;
```

Expected: every named column appears.

### Required functions

```sql
select n.nspname as schema_name,
       p.proname as function_name,
       pg_get_function_arguments(p.oid) as arguments,
       p.prosecdef as security_definer,
       p.proconfig as config
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'is_newsroom_admin',
    'increment_views',
    'consume_submission_rate_limit'
  )
order by p.proname;
```

Expected:

- all three functions appear
- `security_definer = true` for all three
- `increment_views` and `consume_submission_rate_limit` include `search_path=public` in `config`

### Function grants

```sql
select n.nspname as schema_name,
       p.proname as function_name,
       r.rolname as grantee,
       has_function_privilege(
         r.rolname,
         p.oid,
         'EXECUTE'
       ) as can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
cross join pg_roles r
where n.nspname = 'public'
  and p.proname in ('increment_views', 'consume_submission_rate_limit')
  and r.rolname in ('anon', 'authenticated')
order by p.proname, r.rolname;
```

Expected: `can_execute = true` for `anon` and `authenticated` on both functions.

### Required policies

```sql
select schemaname,
       tablename,
       policyname,
       cmd,
       roles,
       qual,
       with_check
from pg_policies
where schemaname = 'public'
  and (
    (tablename = 'comments' and policyname in (
      'Comments are public',
      'Admins can read all comments',
      'Visitors can add comments to published stories',
      'Admins can update comments for moderation',
      'Admins can delete comments'
    ))
    or
    (tablename = 'contact_messages' and policyname in (
      'Visitors can submit contact messages',
      'Admins can read contact messages'
    ))
    or
    (tablename = 'stories' and policyname in (
      'Published stories are public',
      'Admins can insert stories',
      'Admins can update stories',
      'Admins can delete stories'
    ))
  )
order by tablename, policyname;
```

Expected: all listed policies appear.

### Comment policy behavior

These are structural checks for the installed policies.

```sql
select policyname,
       qual,
       with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'comments'
  and policyname in (
    'Comments are public',
    'Visitors can add comments to published stories'
  );
```

Expected:

- `Comments are public` has `deleted_at IS NULL` in `qual`
- `Visitors can add comments to published stories` checks the target story is published
- reply inserts check the parent comment belongs to the same story and has `parent_id IS NULL`

### Contact constraints

```sql
select conname,
       pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.contact_messages'::regclass
  and conname in (
    'contact_messages_name_length',
    'contact_messages_email_length',
    'contact_messages_message_length'
  )
order by conname;
```

Expected: all three constraints appear.

### Rate limiter smoke test

Run this in staging. It should return `allowed = true` once, then a cooldown/duplicate/rate-limit reason on repeated immediate calls with the same hashes.

```sql
select *
from public.consume_submission_rate_limit(
  'comment',
  repeat('a', 64),
  repeat('b', 64),
  45,
  600,
  5
);
```

Expected first result: `allowed = true`, `reason = ok`.

### Storage buckets and policies

```sql
select id, name, public
from storage.buckets
where id in ('story-images', 'story-videos')
order by id;
```

Expected: both buckets appear and are currently `public = true`.

```sql
select schemaname,
       tablename,
       policyname,
       cmd,
       roles,
       qual,
       with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname in (
    'Public can view story images',
    'Public can view story videos',
    'Admins can upload story images',
    'Admins can update story images',
    'Admins can delete story images',
    'Admins can upload story videos',
    'Admins can update story videos',
    'Admins can delete story videos'
  )
order by policyname;
```

Expected: all listed storage policies appear.

## Comment Moderation Model

The selected model is auto-publish with automatic filtering, throttling, and admin removal.

Do not migrate to pending-by-default comments unless the product decision changes. New comments should remain live immediately after passing automatic safeguards.

## Private Draft Media Recommendation

Current behavior keeps `story-images` and `story-videos` public to avoid breaking existing story media URLs. This is compatible with current publishing but is not ideal for sensitive draft reporting.

Recommended migration design:

1. Add private draft buckets, for example `draft-story-images` and `draft-story-videos`.
2. Upload draft media to private buckets while a story is in `draft`.
3. Serve dashboard previews through signed URLs with short expirations.
4. On publish, either copy approved media to the public buckets or switch public story rendering to a signed/public delivery route.
5. Backfill existing draft media paths carefully; public URLs already stored on stories should be audited before moving objects.
6. Only change bucket policies after a tested migration plan exists, because making the current buckets private will break existing public media URLs.

## Rollback Notes

- App-level changes can be reverted through Git.
- SQL changes that add columns/tables/functions are mostly additive. Avoid dropping audit/rate-limit tables during rollback unless data retention has been reviewed.
- If rate limiting blocks valid submissions after deploy, inspect `public.submission_rate_limits`, verify `NEWSROOM_RATE_LIMIT_SALT`, and confirm the RPC grant exists before disabling safeguards.
