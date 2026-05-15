-- Migration: Durable submission rate limits and soft-delete moderation audit
-- Keeps comments auto-published; this adds automatic throttling support and admin removal audit fields.

ALTER TABLE public.comments
ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS moderation_reason text;

DROP POLICY IF EXISTS "Comments are public" ON public.comments;
CREATE POLICY "Comments are public"
ON public.comments
FOR SELECT
USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Admins can read all comments" ON public.comments;
CREATE POLICY "Admins can read all comments"
ON public.comments
FOR SELECT
TO authenticated
USING (public.is_newsroom_admin());

DROP POLICY IF EXISTS "Admins can update comments for moderation" ON public.comments;
CREATE POLICY "Admins can update comments for moderation"
ON public.comments
FOR UPDATE
TO authenticated
USING (public.is_newsroom_admin())
WITH CHECK (public.is_newsroom_admin());

DROP POLICY IF EXISTS "Admins can delete comments" ON public.comments;
CREATE POLICY "Admins can delete comments"
ON public.comments
FOR DELETE
TO authenticated
USING (public.is_newsroom_admin());

CREATE TABLE IF NOT EXISTS public.submission_rate_limits (
  scope text NOT NULL,
  subject_hash text NOT NULL,
  window_started_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  last_submitted_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  submission_count integer NOT NULL DEFAULT 1,
  last_content_hash text,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  PRIMARY KEY (scope, subject_hash),
  CONSTRAINT submission_rate_limits_scope_length CHECK (char_length(scope) BETWEEN 2 AND 80),
  CONSTRAINT submission_rate_limits_subject_hash_length CHECK (char_length(subject_hash) BETWEEN 32 AND 128),
  CONSTRAINT submission_rate_limits_submission_count_positive CHECK (submission_count > 0)
);

ALTER TABLE public.submission_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.consume_submission_rate_limit(
  scope_input text,
  subject_hash_input text,
  content_hash_input text,
  cooldown_seconds integer,
  window_seconds integer,
  max_submissions integer
)
RETURNS TABLE (allowed boolean, reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_row public.submission_rate_limits%ROWTYPE;
  now_utc timestamptz := timezone('utc', now());
BEGIN
  IF scope_input IS NULL
    OR subject_hash_input IS NULL
    OR content_hash_input IS NULL
    OR char_length(scope_input) < 2
    OR char_length(subject_hash_input) < 32
    OR cooldown_seconds < 1
    OR window_seconds < 1
    OR max_submissions < 1
  THEN
    allowed := false;
    reason := 'invalid';
    RETURN NEXT;
    RETURN;
  END IF;

  SELECT *
  INTO current_row
  FROM public.submission_rate_limits
  WHERE scope = scope_input
    AND subject_hash = subject_hash_input
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.submission_rate_limits (
      scope,
      subject_hash,
      window_started_at,
      last_submitted_at,
      submission_count,
      last_content_hash,
      updated_at
    )
    VALUES (
      scope_input,
      subject_hash_input,
      now_utc,
      now_utc,
      1,
      content_hash_input,
      now_utc
    );

    allowed := true;
    reason := 'ok';
    RETURN NEXT;
    RETURN;
  END IF;

  IF current_row.last_content_hash = content_hash_input THEN
    allowed := false;
    reason := 'duplicate';
    RETURN NEXT;
    RETURN;
  END IF;

  IF current_row.last_submitted_at > now_utc - make_interval(secs => cooldown_seconds) THEN
    allowed := false;
    reason := 'cooldown';
    RETURN NEXT;
    RETURN;
  END IF;

  IF current_row.window_started_at <= now_utc - make_interval(secs => window_seconds) THEN
    UPDATE public.submission_rate_limits
    SET
      window_started_at = now_utc,
      last_submitted_at = now_utc,
      submission_count = 1,
      last_content_hash = content_hash_input,
      updated_at = now_utc
    WHERE scope = scope_input
      AND subject_hash = subject_hash_input;

    allowed := true;
    reason := 'ok';
    RETURN NEXT;
    RETURN;
  END IF;

  IF current_row.submission_count >= max_submissions THEN
    allowed := false;
    reason := 'rate_limited';
    RETURN NEXT;
    RETURN;
  END IF;

  UPDATE public.submission_rate_limits
  SET
    last_submitted_at = now_utc,
    submission_count = submission_count + 1,
    last_content_hash = content_hash_input,
    updated_at = now_utc
  WHERE scope = scope_input
    AND subject_hash = subject_hash_input;

  allowed := true;
  reason := 'ok';
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_submission_rate_limit(text, text, text, integer, integer, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.consume_submission_rate_limit(text, text, text, integer, integer, integer) TO authenticated;
