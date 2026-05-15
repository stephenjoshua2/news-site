# The Newsroom

A complete newsroom web app built in the project root with Next.js 14 App Router, TypeScript, plain CSS, and Supabase.

## Features

- Single-admin login with Supabase Auth
- Protected dashboard with middleware and server-side admin checks
- Create, edit, publish, unpublish, and delete stories
- Featured image uploads or external image URL fallback
- Optional video uploads with captions
- Public homepage that lists real published stories from Supabase
- Story detail pages with comments and optional video playback
- Public visitor comments stored in Supabase

## Required environment variables

Copy `.env.local.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEWSROOM_ADMIN_EMAIL`
- `NEXT_PUBLIC_SITE_URL`
- `NEWSROOM_RATE_LIMIT_SALT`

Optional:

- `NEWSROOM_BANNED_TERMS` - comma-separated extra terms blocked by the lightweight automatic comment/contact filter.
- `NEXT_PUBLIC_SUBSTACK_EMBED_URL` - optional newsletter embed URL. Leave empty to hide the newsletter module.

`NEWSROOM_RATE_LIMIT_SALT` is required for production and preview. It is used to hash requester fingerprints for durable shared rate limiting.

## Local setup

1. Install dependencies with `npm install`.
2. Create `.env.local` from `.env.local.example`.
3. In Supabase, enable the Email provider under Authentication.
4. Follow `MIGRATION_RUNBOOK.md`. For a fresh database, run `supabase/schema.sql`. For an existing database, apply the root migration files in the documented order.
5. In Supabase Auth, manually create the single admin user with the same email as `NEWSROOM_ADMIN_EMAIL`.
6. Add that same email to `public.admin_users`:

```sql
insert into public.admin_users (email)
values ('your-admin-email@example.com')
on conflict (email) do nothing;
```

7. Start the app with `npm run dev`.

## Vercel deployment

Before deploying to Vercel, add these same environment variables in the Vercel project settings for the target environment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEWSROOM_ADMIN_EMAIL`
- `NEXT_PUBLIC_SITE_URL`
- `NEWSROOM_RATE_LIMIT_SALT`

Set `NEXT_PUBLIC_SITE_URL` to the canonical public origin, for example `https://example.com`. Use different Supabase projects or carefully scoped environment variables for production and preview so preview deployments do not mutate production content by accident.

Without them, public pages can still render some fallbacks, but Supabase-backed features such as auth, contact submission, analytics tracking, and dashboard access will not work correctly.

## Project structure

- `src/app` contains the App Router pages and server actions.
- `src/components` contains shared UI for auth, stories, comments, and navigation.
- `src/lib` contains shared types, auth helpers, Supabase helpers, and media validation constants.
- `src/middleware.ts` protects `/dashboard` and redirects authenticated admins away from `/login`.
- `supabase/schema.sql` defines the current fresh database state, including tables, RLS policies, admin gate, storage buckets, rate limiting, and moderation audit fields.
- Root `schema-*-migration.sql` files are incremental migrations for existing databases. Apply them through `MIGRATION_RUNBOOK.md`.

## Security notes

- There is no public sign-up interface.
- Runtime admin access is gated by `NEWSROOM_ADMIN_EMAIL`.
- Database and storage write access are also restricted by RLS and `public.admin_users`.
- No service role key is used in runtime code.
- Public comments auto-publish immediately, with automatic filtering, durable shared throttling, cookie fallback throttling, and admin removal instead of a default pending queue.
- Admin comment removal is soft-delete oriented through `deleted_at`, `deleted_by`, and `moderation_reason`.
- Current story media buckets are public for compatibility. See `MIGRATION_RUNBOOK.md` and `LAUNCH_BLOCKERS_STATUS.md` before changing draft media storage.

## Verification

- `npm run typecheck`
- `npm run build`
- Follow `POST_DEPLOY_CHECKLIST.md` after every staging or production deploy.
