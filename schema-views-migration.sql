-- Run this in your Supabase SQL Editor to add views tracking

-- 1. Add the views column
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0;

-- 2. Create atomic increment function (avoids race conditions)
CREATE OR REPLACE FUNCTION public.increment_views(story_id_input uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.stories
  SET views = views + 1
  WHERE id = story_id_input AND status = 'published';
END;
$$;

-- 3. Grant execute to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.increment_views(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_views(uuid) TO authenticated;
