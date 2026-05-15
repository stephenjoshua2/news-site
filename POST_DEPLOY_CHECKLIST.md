# Post-Deploy Checklist

Run this after every staging deploy and again after production deploy.

## Environment

- Confirm `NEXT_PUBLIC_SITE_URL` matches the deployed origin.
- Confirm `NEWSROOM_RATE_LIMIT_SALT` is set and not empty.
- Confirm the deployed app points to the intended Supabase project.
- Confirm `MIGRATION_RUNBOOK.md` verification SQL has passed for this environment.

## Public Site

- Open `/`, `/about`, `/contact`, `/privacy`, `/terms`, `/corrections`, and `/editorial-standards`.
- Confirm public navigation does not expose editor/admin login links.
- Confirm Contact page does not claim encrypted or secure-tip functionality.
- Confirm footer legal/editorial links work.

## Comments And Contact

- Post a normal comment and confirm it appears immediately.
- If a normal comment shows "Submission controls are not fully configured yet," stop and apply/verify the durable rate-limit migration before launch.
- Post a normal reply and confirm it appears under the top-level comment.
- Try rapid duplicate comment submissions and confirm throttling blocks repeats.
- Try a link-heavy or banned-term comment and confirm it is blocked before publishing.
- Submit a normal contact message and confirm it succeeds.
- Try rapid duplicate contact submissions and confirm throttling blocks repeats.
- Sign in as admin and remove a test comment; confirm it disappears publicly and the row has `deleted_at`, `deleted_by`, and `moderation_reason`.

## Dashboard

- Sign in with the configured admin account.
- Confirm `/dashboard`, `/dashboard/stories`, `/dashboard/analytics`, and `/dashboard/settings` load.
- Create a draft story, publish it, then confirm the public story page loads.
- Upload a valid test image and confirm invalid file types are rejected.

## SEO And News Metadata

- Open `/robots.txt` and confirm `/dashboard` and `/login` are disallowed.
- Open `/sitemap.xml` and confirm public pages and published stories appear with the production origin.
- Open a story page and confirm canonical metadata points to the production URL.
- Inspect page source for `application/ld+json` with `NewsArticle`.

## Known Manual Checks

- Confirm production storage/media behavior is acceptable for current launch risk.
- Confirm any placeholder newsletter or advertiser copy is acceptable before public announcement.
- Confirm legal/editorial pages have been reviewed by the newsroom owner before launch.
