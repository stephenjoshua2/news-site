-- Migration: Harden public comment reply integrity
-- Run after schema-replies-migration.sql if that migration has not already been folded into your base schema.

ALTER TABLE public.comments
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS comments_parent_id_idx
  ON public.comments (parent_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'comments_parent_not_self'
      AND conrelid = 'public.comments'::regclass
  ) THEN
    ALTER TABLE public.comments
    ADD CONSTRAINT comments_parent_not_self
    CHECK (parent_id IS NULL OR parent_id <> id);
  END IF;
END
$$;

DROP POLICY IF EXISTS "Visitors can add comments to published stories" ON public.comments;
CREATE POLICY "Visitors can add comments to published stories"
ON public.comments
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.stories
    WHERE stories.id = comments.story_id
      AND stories.status = 'published'
  )
  AND (
    comments.parent_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.comments parent
      WHERE parent.id = comments.parent_id
        AND parent.story_id = comments.story_id
        AND parent.parent_id IS NULL
    )
  )
);
