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

## Local setup

1. Install dependencies with `npm install`.
2. Create `.env.local` from `.env.local.example`.
3. In Supabase, enable the Email provider under Authentication.
4. Run `supabase/schema.sql` in the Supabase SQL editor.
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

Without them, public pages can still render some fallbacks, but Supabase-backed features such as auth, contact submission, analytics tracking, and dashboard access will not work correctly.

## Project structure

- `src/app` contains the App Router pages and server actions.
- `src/components` contains shared UI for auth, stories, comments, and navigation.
- `src/lib` contains shared types, auth helpers, Supabase helpers, and media validation constants.
- `src/middleware.ts` protects `/dashboard` and redirects authenticated admins away from `/login`.
- `supabase/schema.sql` defines the database tables, RLS policies, admin gate, and storage buckets.

## Security notes

- There is no public sign-up interface.
- Runtime admin access is gated by `NEWSROOM_ADMIN_EMAIL`.
- Database and storage write access are also restricted by RLS and `public.admin_users`.
- No service role key is used in runtime code.

## Verification

- `npm run typecheck`
- `npm run build`
