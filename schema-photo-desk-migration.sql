-- Photo Desk Migration
-- Run this in the Supabase SQL Editor to enable the Photo Desk feature.

-- 1. Add story_type column to distinguish article vs photo_desk
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS story_type text NOT NULL DEFAULT 'article';

-- Add check constraint separately (safe for existing rows)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stories_story_type_check'
  ) THEN
    ALTER TABLE public.stories
      ADD CONSTRAINT stories_story_type_check
      CHECK (story_type IN ('article', 'photo_desk'));
  END IF;
END $$;

-- 2. Add photo_desk_items JSONB column for the photo+caption pairs
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS photo_desk_items jsonb;

-- 3. Safety: drop old length constraints if they still exist
ALTER TABLE public.stories
  DROP CONSTRAINT IF EXISTS stories_content_length,
  DROP CONSTRAINT IF EXISTS stories_excerpt_length;
