# Launch Blockers Status

Updated: 2026-05-15

## Comment Moderation Model

Chosen model: **auto-publish with automatic filtering, throttling, and admin removal**.

Not chosen: **pending by default**.

New comments should remain live immediately after posting unless blocked by automatic safeguards for clearly abusive or spammy content. Admin delete/removal stays available.

## Implemented

- Added reusable server-side normalization, banned-term filtering, link-heavy checks, repeated-character checks, duplicate-submission checks, and cookie-backed cooldown throttling in `src/lib/abuse-protection.ts`.
- Applied the safeguards to public comment submissions in `src/app/story/[id]/actions.ts`.
- Applied the safeguards to contact form submissions in `src/app/actions/contact.ts`.
- Added optional `NEWSROOM_BANNED_TERMS` configuration in `.env.local.example`.
- Documented the auto-publish moderation model in `README.md` and this status file.
- Added durable Supabase-backed shared rate limiting through `public.submission_rate_limits` and `public.consume_submission_rate_limit(...)`.
- Added comment moderation audit fields: `deleted_at`, `deleted_by`, and `moderation_reason`.
- Changed admin comment removal to soft-delete rows instead of hard-deleting them.
- Added Privacy Policy, Terms of Use, Corrections Policy, and Editorial Standards pages.
- Strengthened About and Contact wording and removed unsupported secure-tip/encrypted-source claims.
- Added `robots.ts`, `sitemap.ts`, canonical metadata, and `NewsArticle` JSON-LD for article pages.
- Created `MIGRATION_RUNBOOK.md` and folded current schema state into `supabase/schema.sql`.
- Added `POST_DEPLOY_CHECKLIST.md` for manual staging/production verification after deploys.

## Still Blocking Public Launch

- Apply the latest SQL migrations in staging, verify, then apply in production and verify the durable rate-limit RPC before launch.
- Current local verification showed normal auto-published comments are blocked with "Submission controls are not fully configured yet. Please try again later." until `public.consume_submission_rate_limit(...)` is present in the connected Supabase project.
- Private draft media: storage buckets are still public and require the documented migration plan before sensitive reporting workflows.
- Trust/product polish: Advertise/Partnership path, stronger author/byline support, Cookie Policy, and real newsroom ownership/contact details remain needed.
- Durable moderation operations: add a dashboard view for removed comments and moderation reasons if the newsroom expects frequent moderation.
- Production SEO values: set `NEXT_PUBLIC_SITE_URL` to the final canonical domain before launch.
- Run `POST_DEPLOY_CHECKLIST.md` successfully against the deployed production URL.

## Current Comment Safeguard Behavior

- Normal comments publish immediately.
- Submissions with configured/prohibited terms are blocked before insert.
- Link-heavy submissions are blocked before insert.
- Repeated-character spam is blocked before insert.
- Duplicate or rapid repeated submissions are throttled through both cookies and the shared Supabase limiter.
- Admins can remove comments with soft-delete audit fields.

## Latest Local Verification Notes

- Signed-out `/dashboard` and `/dashboard/settings` requests redirect to `/login?error=admin-required`.
- Published story media URLs in the public `story-images` bucket are directly readable, which is expected for published media.
- Repeated-character spam and link-heavy comments are blocked before publishing.
- Normal long comments did not publish in the current connected environment because the durable rate-limit RPC migration has not been applied there.
- `/login` while signed in as admin and draft-media upload exposure could not be fully verified without an admin session in this environment.
- Public placeholder scan is clean for known dummy email/domain/newsletter/advertiser/admin-link copy after the latest content fixes.
