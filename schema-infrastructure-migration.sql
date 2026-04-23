-- Migration: Infrastructure & Integrity Fixes
-- 1. Creates missing tables (site_settings, contact_messages, subscribers)
-- 2. Grants Admins moderation abilities over comments

-- ============================================
-- 1. SITE SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  id integer PRIMARY KEY DEFAULT 1,
  author_bio text,
  social_twitter text,
  social_linkedin text,
  social_instagram text,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT site_settings_single_row CHECK (id = 1)
);

-- Seed initial row
INSERT INTO public.site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Public can read settings
DROP POLICY IF EXISTS "Public can read site settings" ON public.site_settings;
CREATE POLICY "Public can read site settings"
ON public.site_settings
FOR SELECT
USING (true);

-- Admins can update settings
DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;
CREATE POLICY "Admins can update site settings"
ON public.site_settings
FOR UPDATE
TO authenticated
USING (public.is_newsroom_admin())
WITH CHECK (public.is_newsroom_admin());


-- ============================================
-- 2. CONTACT MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  status text NOT NULL DEFAULT 'unread'
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can insert messages
DROP POLICY IF EXISTS "Visitors can submit contact messages" ON public.contact_messages;
CREATE POLICY "Visitors can submit contact messages"
ON public.contact_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Admins can read messages
DROP POLICY IF EXISTS "Admins can read contact messages" ON public.contact_messages;
CREATE POLICY "Admins can read contact messages"
ON public.contact_messages
FOR SELECT
TO authenticated
USING (public.is_newsroom_admin());


-- ============================================
-- 3. COMMENT MODERATION POLICY
-- ============================================
-- Allow Admins to delete toxic comments
DROP POLICY IF EXISTS "Admins can delete comments" ON public.comments;
CREATE POLICY "Admins can delete comments"
ON public.comments
FOR DELETE
TO authenticated
USING (public.is_newsroom_admin());

