-- Phase 1: Foundation Migration
-- Tables: profiles, organizations, memberships, invitations
-- Plus: extensions, helper functions, RLS, indexes, auth trigger

-- =============================================================================
-- 1. Extensions
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =============================================================================
-- 2. Enum types
-- =============================================================================
CREATE TYPE public.org_plan AS ENUM ('free', 'pro', 'business');
CREATE TYPE public.membership_role AS ENUM ('owner', 'admin', 'sales', 'project_manager', 'viewer', 'client');
CREATE TYPE public.membership_status AS ENUM ('active', 'invited', 'suspended');

-- =============================================================================
-- 3. Tables (must exist before helper functions that reference them)
-- =============================================================================

-- Profiles: one row per auth.users row
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  default_organization_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Organizations: tenant root
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  plan public.org_plan NOT NULL DEFAULT 'free',
  trial_ends_at timestamptz,
  ai_daily_cap_cents integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add FK now that organizations exists
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_default_org_fk
  FOREIGN KEY (default_organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Memberships: links profiles to organizations
CREATE TABLE public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role public.membership_role NOT NULL DEFAULT 'viewer',
  status public.membership_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, organization_id)
);

-- Invitations: pending invites
CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  role public.membership_role NOT NULL DEFAULT 'viewer',
  invited_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Rate limiting table (replaces Upstash Redis)
CREATE TABLE public.api_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  bucket text NOT NULL,
  count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  UNIQUE (key, bucket)
);

-- =============================================================================
-- 4. App schema + helper functions (after tables exist)
-- =============================================================================
CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.active_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT (current_setting('request.jwt.claims', true)::jsonb ->> 'active_org_id')::uuid
$$;

CREATE OR REPLACE FUNCTION app.is_member(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships m
    JOIN public.profiles p ON p.id = m.profile_id
    WHERE m.organization_id = org_id
      AND p.user_id = auth.uid()
      AND m.status = 'active'
  )
$$;

-- =============================================================================
-- 5. Updated_at trigger function (reusable)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER organizations_updated_at BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER memberships_updated_at BEFORE UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 6. Auth trigger: auto-create profile + personal org on signup
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_profile_id uuid;
  new_org_id uuid;
  user_name text;
  org_slug text;
BEGIN
  -- Extract name from metadata or email
  user_name := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    split_part(NEW.email, '@', 1)
  );

  -- Generate a unique slug from email prefix
  org_slug := lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-z0-9]', '-', 'g'));
  org_slug := org_slug || '-' || substr(gen_random_uuid()::text, 1, 8);

  -- Create profile
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, user_name)
  RETURNING id INTO new_profile_id;

  -- Create personal organization
  INSERT INTO public.organizations (name, slug)
  VALUES (user_name || '''s Workspace', org_slug)
  RETURNING id INTO new_org_id;

  -- Create owner membership
  INSERT INTO public.memberships (profile_id, organization_id, role, status)
  VALUES (new_profile_id, new_org_id, 'owner', 'active');

  -- Set default org
  UPDATE public.profiles
  SET default_organization_id = new_org_id
  WHERE id = new_profile_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- 7. Row Level Security
-- =============================================================================

-- Profiles: users can read any profile in their orgs, edit only their own
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT
  USING (
    user_id = auth.uid()
    OR id IN (
      SELECT m2.profile_id FROM public.memberships m1
      JOIN public.memberships m2 ON m1.organization_id = m2.organization_id
      WHERE m1.profile_id = (SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid())
        AND m1.status = 'active' AND m2.status = 'active'
    )
  );

CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Organizations: members can read, owners can update
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organizations_select" ON public.organizations FOR SELECT
  USING (app.is_member(id));

CREATE POLICY "organizations_update" ON public.organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      JOIN public.profiles p ON p.id = m.profile_id
      WHERE m.organization_id = organizations.id
        AND p.user_id = auth.uid()
        AND m.role IN ('owner', 'admin')
        AND m.status = 'active'
    )
  );

-- Memberships: members can read their org's memberships
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "memberships_select" ON public.memberships FOR SELECT
  USING (app.is_member(organization_id));

CREATE POLICY "memberships_insert" ON public.memberships FOR INSERT
  WITH CHECK (
    app.is_member(organization_id)
    AND organization_id = app.active_organization_id()
  );

CREATE POLICY "memberships_update" ON public.memberships FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      JOIN public.profiles p ON p.id = m.profile_id
      WHERE m.organization_id = memberships.organization_id
        AND p.user_id = auth.uid()
        AND m.role IN ('owner', 'admin')
        AND m.status = 'active'
    )
  );

CREATE POLICY "memberships_delete" ON public.memberships FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      JOIN public.profiles p ON p.id = m.profile_id
      WHERE m.organization_id = memberships.organization_id
        AND p.user_id = auth.uid()
        AND m.role IN ('owner', 'admin')
        AND m.status = 'active'
    )
  );

-- Invitations: org members can read, admins+ can create/delete
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invitations_select" ON public.invitations FOR SELECT
  USING (app.is_member(organization_id));

CREATE POLICY "invitations_insert" ON public.invitations FOR INSERT
  WITH CHECK (
    app.is_member(organization_id)
    AND organization_id = app.active_organization_id()
  );

CREATE POLICY "invitations_delete" ON public.invitations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      JOIN public.profiles p ON p.id = m.profile_id
      WHERE m.organization_id = invitations.organization_id
        AND p.user_id = auth.uid()
        AND m.role IN ('owner', 'admin')
        AND m.status = 'active'
    )
  );

-- =============================================================================
-- 8. Indexes
-- =============================================================================
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_memberships_profile_org ON public.memberships(profile_id, organization_id) WHERE status = 'active';
CREATE INDEX idx_memberships_org ON public.memberships(organization_id) WHERE status = 'active';
CREATE INDEX idx_invitations_org ON public.invitations(organization_id);
CREATE INDEX idx_invitations_email ON public.invitations(email);
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_rate_limits_key_bucket ON public.api_rate_limits(key, bucket);

-- =============================================================================
-- 9. Rate limiting function
-- =============================================================================
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key text,
  p_bucket text,
  p_max_count integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  current_count integer;
  window_start_time timestamptz;
BEGIN
  window_start_time := now() - (p_window_seconds || ' seconds')::interval;

  -- Upsert: increment if within window, reset if expired
  INSERT INTO public.api_rate_limits (key, bucket, count, window_start)
  VALUES (p_key, p_bucket, 1, now())
  ON CONFLICT (key, bucket) DO UPDATE
  SET
    count = CASE
      WHEN api_rate_limits.window_start < window_start_time THEN 1
      ELSE api_rate_limits.count + 1
    END,
    window_start = CASE
      WHEN api_rate_limits.window_start < window_start_time THEN now()
      ELSE api_rate_limits.window_start
    END
  RETURNING count INTO current_count;

  RETURN current_count <= p_max_count;
END;
$$;
