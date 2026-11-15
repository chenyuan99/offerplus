-- ============================================================
-- Agent API hardening (MCP phase 1)
--   1. Soft delete for applications (deleted_at)
--   2. application_events: an append-only history of every change,
--      written by trigger so web, mobile and agent writes are all covered
-- ============================================================

-- 1. Soft delete -------------------------------------------------

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS applications_user_live_idx
  ON public.applications (user_id, date_applied DESC)
  WHERE deleted_at IS NULL;

-- Restrictive: ANDed with the per-user SELECT policy, so soft-deleted rows
-- disappear from the web and mobile apps without any client change.
-- The agent API uses the service role and filters deleted_at itself.
DROP POLICY IF EXISTS "Hide soft-deleted applications" ON public.applications;
CREATE POLICY "Hide soft-deleted applications"
  ON public.applications
  AS RESTRICTIVE
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- 2. Change history ----------------------------------------------

CREATE TABLE IF NOT EXISTS public.application_events (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- No FK: history must outlive a hard delete of the application.
  application_id bigint NOT NULL,
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action         text NOT NULL CHECK (action IN ('create', 'update', 'delete', 'restore', 'hard_delete')),
  source         text NOT NULL DEFAULT 'app',
  api_key_id     uuid,
  before         jsonb,
  after          jsonb,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS application_events_app_idx
  ON public.application_events (application_id, created_at DESC);
CREATE INDEX IF NOT EXISTS application_events_user_idx
  ON public.application_events (user_id, created_at DESC);

ALTER TABLE public.application_events ENABLE ROW LEVEL SECURITY;

-- Users can read their own history; only the trigger writes it.
DROP POLICY IF EXISTS "Users can view their own application events" ON public.application_events;
CREATE POLICY "Users can view their own application events"
  ON public.application_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- The agent API tags its PostgREST requests with x-offerplus-source and
-- x-offerplus-key-id; anything else (web, mobile) is recorded as 'app'.
CREATE OR REPLACE FUNCTION public.record_application_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  headers json := nullif(current_setting('request.headers', true), '')::json;
  src     text := coalesce(headers->>'x-offerplus-source', 'app');
  key_id  uuid;
  act     text;
BEGIN
  BEGIN
    key_id := (headers->>'x-offerplus-key-id')::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    key_id := NULL;
  END;

  IF TG_OP = 'INSERT' THEN
    act := 'create';
  ELSIF TG_OP = 'DELETE' THEN
    act := 'hard_delete';
  ELSIF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    act := 'delete';
  ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
    act := 'restore';
  ELSIF (to_jsonb(OLD) - 'updated_at') = (to_jsonb(NEW) - 'updated_at') THEN
    RETURN NEW; -- no real change
  ELSE
    act := 'update';
  END IF;

  INSERT INTO public.application_events (application_id, user_id, action, source, api_key_id, before, after)
  VALUES (
    coalesce(NEW.id, OLD.id),
    coalesce(NEW.user_id, OLD.user_id),
    act,
    src,
    key_id,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
  );

  RETURN coalesce(NEW, OLD);
END;
$$;

REVOKE ALL ON FUNCTION public.record_application_event() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS applications_record_event ON public.applications;
CREATE TRIGGER applications_record_event
  AFTER INSERT OR UPDATE OR DELETE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.record_application_event();
