-- Run this script in the Supabase SQL Editor to allow Photo Stories 
-- (which have no content or excerpt text).

ALTER TABLE public.stories
  DROP CONSTRAINT IF EXISTS stories_content_length,
  DROP CONSTRAINT IF EXISTS stories_excerpt_length;
