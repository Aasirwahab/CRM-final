-- Booking System: booking_settings, google_oauth_tokens
-- Supports Cal.com-style public booking pages with Google Calendar integration

-- =============================================================================
-- 1. Google OAuth tokens (per-user calendar connection)
-- =============================================================================
CREATE TABLE public.google_oauth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expires_at timestamptz NOT NULL,
  calendar_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, organization_id)
);

CREATE TRIGGER google_oauth_tokens_updated_at BEFORE UPDATE ON public.google_oauth_tokens
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.google_oauth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "google_oauth_tokens_select" ON public.google_oauth_tokens FOR SELECT
  USING (app.is_member(organization_id));

CREATE POLICY "google_oauth_tokens_insert" ON public.google_oauth_tokens FOR INSERT
  WITH CHECK (app.is_member(organization_id));

CREATE POLICY "google_oauth_tokens_update" ON public.google_oauth_tokens FOR UPDATE
  USING (app.is_member(organization_id))
  WITH CHECK (app.is_member(organization_id));

CREATE POLICY "google_oauth_tokens_delete" ON public.google_oauth_tokens FOR DELETE
  USING (app.is_member(organization_id));

-- =============================================================================
-- 2. Booking settings (per-organization booking page config)
-- =============================================================================
CREATE TABLE public.booking_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  is_enabled boolean NOT NULL DEFAULT false,
  meeting_duration integer NOT NULL DEFAULT 30,
  buffer_minutes integer NOT NULL DEFAULT 10,
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  available_days integer[] NOT NULL DEFAULT '{1,2,3,4,5}',
  start_hour integer NOT NULL DEFAULT 9,
  end_hour integer NOT NULL DEFAULT 17,
  booking_title text NOT NULL DEFAULT 'Book a Meeting',
  booking_description text,
  owner_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER booking_settings_updated_at BEFORE UPDATE ON public.booking_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.booking_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "booking_settings_select" ON public.booking_settings FOR SELECT
  USING (app.is_member(organization_id));

CREATE POLICY "booking_settings_insert" ON public.booking_settings FOR INSERT
  WITH CHECK (app.is_member(organization_id));

CREATE POLICY "booking_settings_update" ON public.booking_settings FOR UPDATE
  USING (app.is_member(organization_id))
  WITH CHECK (app.is_member(organization_id));

-- Public read access for booking pages (visitors need to see settings)
CREATE POLICY "booking_settings_public_read" ON public.booking_settings FOR SELECT
  USING (is_enabled = true);

-- =============================================================================
-- 3. Add booking_answers_json to leads for storing form responses
-- =============================================================================
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS booking_answers_json jsonb;

-- =============================================================================
-- 4. Indexes
-- =============================================================================
CREATE INDEX idx_google_oauth_profile_org ON public.google_oauth_tokens(profile_id, organization_id);
CREATE INDEX idx_booking_settings_org ON public.booking_settings(organization_id);
