# Newsroom Hardening Audit

Audit date: 2026-05-15

## 1. Executive summary

This is a compact Next.js 14 App Router newsroom with Supabase Auth, public story reading, dashboard publishing, storage uploads, comments/replies, contact messages, and simple analytics. It has several good foundations: no runtime service role key was found, `.env.local` is ignored and not tracked, dashboard pages call `requireAdminUser()`, public story queries filter `status = 'published'`, and database writes mostly rely on Supabase RLS.

Several initial trust-boundary risks have now been hardened: public admin links were removed, app-level admin checks verify `public.admin_users`, comment reply integrity is enforced in the database policy, upload validation includes magic-byte checks, view tracking validates UUIDs, comments/contact have automatic filtering plus durable shared throttling, and admin comment removal is soft-delete/audit-friendly.

The remaining launch risks are now more operational and trust-product oriented: migrations must be applied and verified in staging/production, private draft media still needs a careful migration plan, and public credibility needs final ownership/byline/advertising/cookie details.

Product decision: the chosen comment moderation model is **auto-publish with automatic filtering, throttling, and admin removal**, not pending by default. The current implementation now includes cookie-backed throttling plus a Supabase-backed shared rate-limit RPC for comments and contact submissions.

## 2. Critical issues

### Public navigation exposes editor/admin entry points

- Severity: Critical
- Why it matters: A public journalism brand should not advertise its CMS/login surface. This increases credential stuffing attempts and weakens reader trust.
- Exact file path(s): `src/components/Navbar.tsx:74-76`, `src/components/SiteFooter.tsx:70`, `src/app/page.tsx:96`
- Exact code smell or vulnerability: Public chrome renders `Editor Access`, `Editor Login`, and an empty-state `Editor login` link for non-admin readers.
- Likely exploit or failure scenario: Attackers and bots discover `/login` from every public page and repeatedly attack the single admin account. Readers also see operational/admin affordances on a consumer news product.
- Recommended fix: Remove public login/dashboard links from public navigation/footer/empty homepage. Keep `/login` reachable only by direct URL or a non-public bookmark. Keep authenticated admin dashboard links only after server-side admin verification.
- Safe to auto-fix now or needs human review: Implemented.

### App-level admin checks do not verify the database admin role

- Severity: Critical
- Why it matters: Admin authorization should be enforced at mutation time and should match the database's own role source of truth. The app currently checks only `NEWSROOM_ADMIN_EMAIL`, while RLS checks `public.admin_users`.
- Exact file path(s): `src/lib/auth.ts:17-21`, `src/lib/auth.ts:30-38`, `supabase/schema.sql:25-43`
- Exact code smell or vulnerability: `getCurrentAdminSession()` and `requireAdminUser()` use `isAdminEmail(user.email)` but do not query `public.admin_users`.
- Likely exploit or failure scenario: Configuration drift between `NEWSROOM_ADMIN_EMAIL` and `public.admin_users` creates confusing partial access. A future server route using a service role or looser table policy could treat email match as sufficient and bypass the database role model.
- Recommended fix: Add a shared server helper that requires both configured admin email and a readable `public.admin_users` row for the authenticated user. Continue relying on RLS as defense in depth.
- Safe to auto-fix now or needs human review: Implemented.

### Comment reply integrity is not encoded in the database

- Severity: Critical
- Why it matters: The public anon Supabase key is intentionally exposed. Any rule that matters for public writes must be enforced by RLS/constraints, not only by the Next.js server action.
- Exact file path(s): `src/app/story/[id]/actions.ts:68-86`, `schema-replies-migration.sql:5`, `supabase/schema.sql:153-165`
- Exact code smell or vulnerability: The server action checks parent/story consistency, but the DB only has `parent_id uuid references public.comments(id)`. The insert policy checks the submitted `story_id` is published but does not check `parent_id` belongs to the same story or is top-level.
- Likely exploit or failure scenario: A direct anon client can submit orphaned or cross-story replies, pollute moderation queues, and create comments that the UI cannot display consistently.
- Recommended fix: Add a DB trigger or RLS `WITH CHECK` clauses requiring `parent_id is null OR parent.story_id = comments.story_id`, and preferably requiring replies target top-level comments. Update schema and migrations.
- Safe to auto-fix now or needs human review: Implemented for integrity policy; deeper moderation dashboard UX remains optional.

### Draft media can be public through storage URLs

- Severity: Critical
- Why it matters: Drafts, embargoed reporting, source material, and unpublished video are high-risk journalism assets. Public storage buckets make uploaded draft media publicly fetchable if a URL or object path leaks.
- Exact file path(s): `supabase/schema.sql:167-178`, `src/app/dashboard/actions.ts:90`, `src/app/dashboard/actions.ts:382-388`
- Exact code smell or vulnerability: `story-images` and `story-videos` are created with `public = true`; `getPublicUrl()` is stored for uploads even when the story remains draft.
- Likely exploit or failure scenario: An unpublished investigation's image/video URL is copied, logged, guessed from browser history, or leaked through analytics and becomes accessible before publication.
- Recommended fix: Move draft media to private buckets or keep one private bucket and serve signed URLs only after publication. This requires data migration and product review.
- Safe to auto-fix now or needs human review: Needs human review before changing bucket strategy.

## 3. High issues

### Upload validation trusts client MIME type

- Severity: High
- Why it matters: Browser-provided `File.type` can be forged. Public buckets serving untrusted content are a common source of stored malware, content spoofing, and brand abuse.
- Exact file path(s): `src/app/dashboard/actions.ts:190-204`, `src/lib/media.ts:25-38`
- Exact code smell or vulnerability: Upload checks call `isAllowedImageType(featuredImageFile.type)` and `isAllowedVideoType(videoFile.type)` only.
- Likely exploit or failure scenario: A renamed or forged payload is accepted as an image/video and served from a trusted newsroom storage URL.
- Recommended fix: Keep size/type checks, add magic-byte sniffing for accepted formats, force generated object names, set `upsert: false`, and avoid trusting original filenames as security signals.
- Safe to auto-fix now or needs human review: Implemented.

### Comment deletion server action lacks explicit admin gate

- Severity: High
- Why it matters: RLS blocks most unauthorized deletes, but protected operations should still authorize at the server action entry point.
- Exact file path(s): `src/app/story/[id]/actions.ts:108-121`, `src/components/CommentSection.tsx:65`
- Exact code smell or vulnerability: `deleteCommentAction(commentId, storyId)` deletes directly without `requireAdminUser()`.
- Likely exploit or failure scenario: If a future policy change weakens RLS, the server action becomes an unauthenticated delete endpoint. Today, callers can still probe moderation behavior.
- Recommended fix: Call `requireAdminUser()`, validate UUID inputs, and delete by `id` only after admin verification.
- Safe to auto-fix now or needs human review: Implemented as soft-delete with audit fields.

### Public view tracking endpoint accepts unbounded story IDs

- Severity: High
- Why it matters: Public API routes are hostile input surfaces. Cookie names and RPC arguments should not be built from arbitrary user input.
- Exact file path(s): `src/app/api/views/route.ts:7-14`, `src/app/api/views/route.ts:25-46`, `schema-views-migration.sql:8-22`
- Exact code smell or vulnerability: `storyId` is only checked as a string, then used in a cookie name and passed to a UUID RPC. The `SECURITY DEFINER` function has no explicit `search_path`.
- Likely exploit or failure scenario: Malformed IDs cause noisy 500s, invalid cookies, log pollution, or wasted function work. Security definer functions are safer with explicit search paths.
- Recommended fix: Validate UUID format before use, keep cookie names bounded, and add `set search_path = public` to the function migration.
- Safe to auto-fix now or needs human review: Implemented.

### Settings/social links are stored without server validation

- Severity: High
- Why it matters: Settings are rendered into public anchors. Client-side `type="url"` is not a security boundary.
- Exact file path(s): `src/app/actions/settings.ts:11-22`, `src/components/SiteFooter.tsx:33-39`, `src/app/about/page.tsx:66-75`
- Exact code smell or vulnerability: Server action writes social URL strings without protocol validation.
- Likely exploit or failure scenario: If an admin session is compromised, a `javascript:` or deceptive URL can be stored and rendered publicly.
- Recommended fix: Trim and validate social URLs server-side, allowing only `https:` and `http:` as a minimal immediate fix.
- Safe to auto-fix now or needs human review: Implemented.

### Contact and comment public writes need stronger abuse controls

- Severity: High
- Why it matters: Public anonymous write endpoints will attract spam and harassment. Journalism sites need moderation and rate controls before launch.
- Exact file path(s): `src/app/actions/contact.ts`, `src/app/story/[id]/actions.ts`, `src/lib/abuse-protection.ts`, `schema-rate-limit-and-moderation-migration.sql`, `supabase/schema.sql`
- Exact code smell or vulnerability: The original implementation had no rate limiting, captcha/turnstile, IP/device throttling, moderation status, or server-side content normalization beyond length. The current implementation normalizes text, blocks configured/prohibited terms, limits link-heavy submissions, throttles repeated submissions with cookies, and adds durable shared Supabase rate limiting while keeping comments instant-publish.
- Likely exploit or failure scenario: Spam floods comments/contact messages, offensive material appears instantly, and storage/database quotas are consumed.
- Recommended fix: Keep the selected auto-publish model, tune thresholds after real traffic, and monitor `public.submission_rate_limits` for false positives or abuse patterns.
- Safe to auto-fix now or needs human review: Implemented; production still requires applying migrations and setting `NEWSROOM_RATE_LIMIT_SALT`.

## 4. Medium issues

### No private preview/draft mode model

- Severity: Medium
- Why it matters: Editors need to preview unpublished stories without exposing them publicly.
- Exact file path(s): `src/app/story/[id]/page.tsx:50-55`, `src/app/dashboard/stories/page.tsx:99`
- Exact code smell or vulnerability: Public article pages always require `status = 'published'`; dashboard only links to live published stories. There is no signed preview route.
- Likely exploit or failure scenario: Editors publish prematurely just to preview layout, increasing editorial mistakes.
- Recommended fix: Add an authenticated `/dashboard/stories/[id]/preview` or signed preview route that never appears in public nav and rechecks admin server-side.
- Safe to auto-fix now or needs human review: Needs product review.

### Contact form source-protection wording needs continued discipline

- Severity: Medium
- Why it matters: Saying the contact desk is "secure" can mislead sources if there is no encryption, secure drop, PGP, or source-protection workflow.
- Exact file path(s): `src/app/contact/page.tsx:34-36`, `src/app/contact/page.tsx:107-110`
- Exact code smell or vulnerability: The earlier copy said "secure communication" and "securely uploads" while the implementation was a normal Supabase insert. The current copy now says the form is not an encrypted secure-drop system.
- Likely exploit or failure scenario: Sensitive sources submit risky information believing they have stronger protections than the app provides.
- Recommended fix: Keep this wording conservative unless a real secure tip workflow exists. Provide Signal/WhatsApp/PGP only when configured and operationally supported.
- Safe to auto-fix now or needs human review: Implemented for current copy; future source-protection claims need editorial/legal review.

### Fallback featured image URLs allow arbitrary remote media

- Severity: Medium
- Why it matters: Remote images can track readers, disappear, change content, or hurt performance.
- Exact file path(s): `src/app/dashboard/actions.ts:118-120`, `src/components/StoryForm.tsx:96-104`, `src/app/page.tsx:138`, `src/app/story/[id]/page.tsx:163`
- Exact code smell or vulnerability: Any http(s) image URL can be stored and rendered.
- Likely exploit or failure scenario: A third-party URL swaps to offensive content or tracks article readers.
- Recommended fix: Prefer uploaded media, allowlist trusted hosts for external URLs, and use `next/image` with configured domains where possible.
- Safe to auto-fix now or needs human review: Needs product review.

### Sitemap, robots, canonical, and NewsArticle structured data need production verification

- Severity: Medium
- Why it matters: Public launch and newsroom credibility depend on discoverability, canonical URLs, and rich news metadata.
- Exact file path(s): `src/app/layout.tsx`, `src/app/story/[id]/page.tsx`, `src/app/robots.ts`, `src/app/sitemap.ts`, `src/lib/site.ts`
- Exact code smell or vulnerability: The app now has sitemap, robots, canonical metadata, and `NewsArticle` JSON-LD. The remaining risk is configuration drift if `NEXT_PUBLIC_SITE_URL` is missing or set to the wrong origin.
- Likely exploit or failure scenario: Search engines and social previews index weak metadata or duplicate URLs; advertisers see a less mature publication.
- Recommended fix: Set `NEXT_PUBLIC_SITE_URL` to the final production domain and validate rich results after deploy.
- Safe to auto-fix now or needs human review: Implemented; production domain needs human confirmation.

### Supabase schema files are split and easy to apply out of order

- Severity: Medium
- Why it matters: Launch readiness depends on reproducible infrastructure.
- Exact file path(s): `supabase/schema.sql`, `schema-migration.sql`, `schema-replies-migration.sql`, `schema-views-migration.sql`, `schema-infrastructure-migration.sql`
- Exact code smell or vulnerability: Migrations live as root SQL snippets with manual SQL Editor instructions. `supabase/schema.sql` has now been updated to the current fresh-state schema, and `MIGRATION_RUNBOOK.md` documents existing-database migration order.
- Likely exploit or failure scenario: Preview/prod databases drift; code expects columns/functions that are missing.
- Recommended fix: Apply `MIGRATION_RUNBOOK.md` per environment and later move root SQL snippets into timestamped `supabase/migrations/`.
- Safe to auto-fix now or needs human review: Partially implemented; migration application still needs operator review.

## 5. Low issues

### Admin settings page has unused import

- Severity: Low
- Why it matters: Small cleanliness issue, but it points to AI-generated drift.
- Exact file path(s): `src/app/dashboard/settings/page.tsx:4`
- Exact code smell or vulnerability: `Link` is imported but unused.
- Likely exploit or failure scenario: None security-related; can fail stricter linting later.
- Recommended fix: Remove unused import.
- Safe to auto-fix now or needs human review: Safe to auto-fix now.

### Placeholder newsletter integration is public

- Severity: Low
- Why it matters: Launch credibility suffers when placeholder setup copy is visible to readers.
- Exact file path(s): `src/components/SubscribeForm.tsx:12-21`
- Exact code smell or vulnerability: Public iframe uses `https://yourpublication.substack.com/embed` and displays implementation instructions.
- Likely exploit or failure scenario: Readers see unfinished product copy.
- Recommended fix: Hide newsletter embed until a real provider URL is configured, or move the URL to env/settings.
- Safe to auto-fix now or needs human review: Safe after confirming desired newsletter vendor.

### Some visible text has encoding artifacts

- Severity: Low
- Why it matters: Broken characters reduce editorial polish and trust.
- Exact file path(s): `src/app/page.tsx`, `src/app/dashboard/analytics/page.tsx`, `src/components/CommentSection.tsx`, `src/app/globals.css`
- Exact code smell or vulnerability: Characters such as `â†’`, `ðŸ’¬`, and `Â©` appear in rendered strings/CSS output.
- Likely exploit or failure scenario: Readers and advertisers perceive the site as unfinished.
- Recommended fix: Replace with ASCII text or valid Unicode after verifying source encoding.
- Safe to auto-fix now or needs human review: Safe to auto-fix incrementally.

## 6. Trust/product gaps

- About page exists, but it is generic and lacks ownership, editorial leadership, address/region, corrections process, funding/ads disclosure, and author/editor profiles.
- Contact page exists and no longer claims secure-tip/encrypted-source protection, but it still uses a hardcoded email.
- Privacy Policy, Terms, Corrections Policy, and Editorial Standards pages now exist. Cookie Policy, Advertise/Partnership inquiry path, author pages/bios, and fuller reader comment policy still need product/legal completion.
- Bylines are hardcoded as `Newsroom Desk` in `src/app/story/[id]/page.tsx:194-198`; there is no author profile or editorial accountability model.
- Timestamps are minimal; no updated/corrected marker appears on articles.
- Public structured data, sitemap, robots, and canonical support now exist. Production domain configuration still depends on `NEXT_PUBLIC_SITE_URL`.

## 7. Accessibility gaps

- Comment forms in `src/components/CommentSection.tsx` rely on placeholders instead of visible labels for name/body fields.
- The mobile nav button in `src/components/Navbar.tsx:42-48` lacks `aria-expanded` and `aria-controls`.
- The dashboard story list uses `<details>/<summary>` with custom visual toggles; keyboard behavior is native, but visible state text and focus styling should be reviewed on mobile.
- Several icon-only SVG buttons lack visible labels or tooltips beyond `aria-label`.
- Some tap targets and dense dashboard controls may be tight on Android devices with weak bandwidth.
- Article images use raw `<img>` without dimensions, increasing layout shift on mobile networks.
- External iframe newsletter has no `title` attribute.

## 8. Comments system redesign recommendations

- Store comments as an adjacency list with `parent_id`, but enforce one visible nesting layer. If a user replies to a reply, store `parent_id` as the top-level ancestor and add an optional `reply_to_comment_id` for context.
- Add columns later as needed: `status`, `ip_hash`, `user_agent_hash`, and optionally `reply_to_author_name_snapshot`. `deleted_at`, `deleted_by`, and `moderation_reason` have been added for admin removal auditability.
- Default launch setting is auto-publish with automatic filtering, throttling, and admin removal. Do not make new comments pending by default.
- Render top-level comments newest or most relevant, with a single indented replies block. Deeper replies should be visually flattened under the parent with "Replying to X" context.
- Soft-delete comments so replies remain readable: replace body with "Comment removed by moderator" while preserving thread structure.
- Make the mobile view compact: avatar, author, time, body, Reply, report/moderate action. Avoid deep indenting beyond one layer.
- Keep the banned/prohibited term list configurable via `NEWSROOM_BANNED_TERMS`, and treat it as a first-pass safety net rather than a full moderation system. Durable throttling now uses hashed requester fingerprints in Supabase; set `NEWSROOM_RATE_LIMIT_SALT` in production.

## 9. Nigerian launch/compliance considerations

- Add a Privacy Policy aligned with the Nigeria Data Protection Act (NDPA) and NDPR expectations: data controller identity, lawful basis/consent, retention, data subject rights, contact details, processors, cross-border transfers, cookies/analytics, and security measures.
- Add Terms and a comment policy covering moderation, defamation, hate speech, impersonation, election misinformation, and takedown/correction requests.
- Add a Corrections Policy and Editorial Standards page. Nigerian readers, advertisers, and investors will look for accountability on political and investigative reporting.
- Avoid calling the contact form "secure" unless there is a true source-protection channel. Provide a clearly labeled Signal/WhatsApp/PGP route if sensitive tips are supported.
- Add advertiser/partnership inquiry path and disclose ad/editorial separation.
- Keep audit logs for publishing, unpublishing, deleting, and moderating comments before launch.

## 10. Recommended fix order

1. Remove public editor/admin links from public chrome and empty homepage.
2. Require both configured admin email and `public.admin_users` membership in `requireAdminUser()` and admin session display logic.
3. Add explicit admin gate and UUID validation to comment deletion.
4. Add comment parent/story integrity checks in SQL policies/triggers.
5. Harden public view tracking input and the `increment_views` security definer function.
6. Add upload magic-byte validation, generated object names, and `upsert: false`.
7. Validate settings/social URLs server-side.
8. Apply and verify the durable rate-limit/moderation SQL migration in production.
9. Decide private draft media design and migrate storage.
10. Confirm production domain metadata, validate rich results, and complete remaining trust pages such as Cookie Policy and Advertise/Partnership.
11. Improve accessibility for comments, nav, forms, iframe title, image dimensions, and mobile dashboard controls.
