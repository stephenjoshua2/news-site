-- Migration: Add basic integrity limits to public contact messages

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'contact_messages_name_length'
      AND conrelid = 'public.contact_messages'::regclass
  ) THEN
    ALTER TABLE public.contact_messages
    ADD CONSTRAINT contact_messages_name_length
    CHECK (char_length(trim(name)) BETWEEN 2 AND 120);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'contact_messages_email_length'
      AND conrelid = 'public.contact_messages'::regclass
  ) THEN
    ALTER TABLE public.contact_messages
    ADD CONSTRAINT contact_messages_email_length
    CHECK (char_length(trim(email)) BETWEEN 5 AND 254);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'contact_messages_message_length'
      AND conrelid = 'public.contact_messages'::regclass
  ) THEN
    ALTER TABLE public.contact_messages
    ADD CONSTRAINT contact_messages_message_length
    CHECK (char_length(trim(message)) BETWEEN 10 AND 4000);
  END IF;
END
$$;
