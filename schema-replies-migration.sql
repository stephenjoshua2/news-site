-- Run this in your Supabase SQL Editor to enable comment replies
-- Adds a parent_id column for 1-level reply threading

ALTER TABLE public.comments
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE;

-- Index for fast reply lookups
CREATE INDEX IF NOT EXISTS comments_parent_id_idx
  ON public.comments (parent_id);
