-- Phase 3: AI Research & Scoring Tables
-- Tables: research_reports, ai_usage_log, lead_embeddings
-- Plus: RLS policies, indexes, scoring function

-- =============================================================================
-- 1. Enum types
-- =============================================================================
CREATE TYPE public.research_tier AS ENUM ('basic', 'standard', 'deep');
CREATE TYPE public.research_status AS ENUM ('pending', 'running', 'completed', 'failed');
CREATE TYPE public.outreach_channel AS ENUM ('email', 'linkedin', 'sms');
CREATE TYPE public.outreach_status AS ENUM ('draft', 'sent', 'replied');

-- =============================================================================
-- 2. Research Reports
-- =============================================================================
CREATE TABLE public.research_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  company_summary text,
  website_analysis text,
  pain_points_json jsonb,
  recommended_offer text,
  outreach_angle text,
  objections_json jsonb,
  next_best_action text,
  lead_score integer CHECK (lead_score >= 0 AND lead_score <= 100),
  confidence_score numeric(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  model text,
  tier public.research_tier NOT NULL DEFAULT 'basic',
  status public.research_status NOT NULL DEFAULT 'pending',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER research_reports_updated_at BEFORE UPDATE ON public.research_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 3. Outreach Messages
-- =============================================================================
CREATE TABLE public.outreach_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  channel public.outreach_channel NOT NULL DEFAULT 'email',
  subject text,
  body text NOT NULL,
  status public.outreach_status NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER outreach_messages_updated_at BEFORE UPDATE ON public.outreach_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 4. AI Usage Log
-- =============================================================================
CREATE TABLE public.ai_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  model text NOT NULL,
  tier public.research_tier NOT NULL,
  prompt_tokens integer NOT NULL DEFAULT 0,
  completion_tokens integer NOT NULL DEFAULT 0,
  cached_tokens integer NOT NULL DEFAULT 0,
  cost_usd_cents numeric(10,4) NOT NULL DEFAULT 0,
  latency_ms integer,
  status text NOT NULL DEFAULT 'success',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 5. Lead Embeddings (pgvector)
-- =============================================================================
CREATE TABLE public.lead_embeddings (
  lead_id uuid PRIMARY KEY REFERENCES public.leads(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  embedding vector(1536),
  source_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 6. RLS Policies
-- =============================================================================

-- Research Reports
ALTER TABLE public.research_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "research_reports_select" ON public.research_reports FOR SELECT
  USING (app.is_member(organization_id));

CREATE POLICY "research_reports_insert" ON public.research_reports FOR INSERT
  WITH CHECK (app.is_member(organization_id));

CREATE POLICY "research_reports_update" ON public.research_reports FOR UPDATE
  USING (app.is_member(organization_id))
  WITH CHECK (app.is_member(organization_id));

-- Outreach Messages
ALTER TABLE public.outreach_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "outreach_messages_select" ON public.outreach_messages FOR SELECT
  USING (app.is_member(organization_id));

CREATE POLICY "outreach_messages_insert" ON public.outreach_messages FOR INSERT
  WITH CHECK (app.is_member(organization_id));

CREATE POLICY "outreach_messages_update" ON public.outreach_messages FOR UPDATE
  USING (app.is_member(organization_id))
  WITH CHECK (app.is_member(organization_id));

CREATE POLICY "outreach_messages_delete" ON public.outreach_messages FOR DELETE
  USING (app.is_member(organization_id));

-- AI Usage Log
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_usage_log_select" ON public.ai_usage_log FOR SELECT
  USING (app.is_member(organization_id));

CREATE POLICY "ai_usage_log_insert" ON public.ai_usage_log FOR INSERT
  WITH CHECK (app.is_member(organization_id));

-- Lead Embeddings
ALTER TABLE public.lead_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_embeddings_select" ON public.lead_embeddings FOR SELECT
  USING (app.is_member(organization_id));

CREATE POLICY "lead_embeddings_insert" ON public.lead_embeddings FOR INSERT
  WITH CHECK (app.is_member(organization_id));

CREATE POLICY "lead_embeddings_update" ON public.lead_embeddings FOR UPDATE
  USING (app.is_member(organization_id))
  WITH CHECK (app.is_member(organization_id));

-- =============================================================================
-- 7. Indexes
-- =============================================================================
CREATE INDEX idx_research_reports_lead ON public.research_reports(lead_id);
CREATE INDEX idx_research_reports_org ON public.research_reports(organization_id);
CREATE INDEX idx_research_reports_status ON public.research_reports(organization_id, status);

CREATE INDEX idx_outreach_messages_lead ON public.outreach_messages(lead_id);
CREATE INDEX idx_outreach_messages_org ON public.outreach_messages(organization_id);

CREATE INDEX idx_ai_usage_org_date ON public.ai_usage_log(organization_id, created_at DESC);
CREATE INDEX idx_ai_usage_org_day ON public.ai_usage_log(organization_id, created_at);

CREATE INDEX idx_lead_embeddings_org ON public.lead_embeddings(organization_id);

-- =============================================================================
-- 8. Daily AI cost helper function
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_org_ai_spend_today(p_org_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(SUM(cost_usd_cents), 0)
  FROM public.ai_usage_log
  WHERE organization_id = p_org_id
    AND created_at::date = CURRENT_DATE
$$;
