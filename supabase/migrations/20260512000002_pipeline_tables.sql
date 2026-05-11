-- Phase 4: Pipeline, Tasks, Meetings
-- Tables: deals, tasks, meetings, follow_ups
-- Plus: pipeline stage enum, RLS, indexes

-- =============================================================================
-- 1. Enum types
-- =============================================================================
CREATE TYPE public.deal_status AS ENUM ('open', 'won', 'lost');

CREATE TYPE public.pipeline_stage AS ENUM (
  'imported', 'researched', 'qualified', 'contacted', 'replied',
  'meeting_booked', 'proposal_sent', 'negotiation', 'won', 'lost', 'nurture'
);

CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'done', 'cancelled');
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.meeting_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
CREATE TYPE public.follow_up_status AS ENUM ('pending', 'completed', 'skipped');

-- =============================================================================
-- 2. Deals
-- =============================================================================
CREATE TABLE public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  title text NOT NULL,
  value numeric(12,2),
  stage public.pipeline_stage NOT NULL DEFAULT 'imported',
  probability integer CHECK (probability >= 0 AND probability <= 100),
  expected_close_date date,
  owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status public.deal_status NOT NULL DEFAULT 'open',
  lost_reason text,
  won_at timestamptz,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version integer NOT NULL DEFAULT 1
);

CREATE TRIGGER deals_updated_at BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 3. Tasks
-- =============================================================================
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status public.task_status NOT NULL DEFAULT 'todo',
  priority public.task_priority NOT NULL DEFAULT 'medium',
  due_at timestamptz,
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version integer NOT NULL DEFAULT 1
);

CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 4. Meetings
-- =============================================================================
CREATE TABLE public.meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
  title text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  meeting_url text,
  calendar_event_id text,
  status public.meeting_status NOT NULL DEFAULT 'scheduled',
  notes text,
  ai_summary text,
  next_steps_json jsonb,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER meetings_updated_at BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 5. Follow Ups
-- =============================================================================
CREATE TABLE public.follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
  scheduled_for timestamptz NOT NULL,
  reason text,
  status public.follow_up_status NOT NULL DEFAULT 'pending',
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER follow_ups_updated_at BEFORE UPDATE ON public.follow_ups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 6. Add pipeline_stage to leads table
-- =============================================================================
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS pipeline_stage public.pipeline_stage NOT NULL DEFAULT 'imported';

-- =============================================================================
-- 7. RLS Policies
-- =============================================================================

-- Deals
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deals_select" ON public.deals FOR SELECT
  USING (app.is_member(organization_id));

CREATE POLICY "deals_insert" ON public.deals FOR INSERT
  WITH CHECK (app.is_member(organization_id));

CREATE POLICY "deals_update" ON public.deals FOR UPDATE
  USING (app.is_member(organization_id))
  WITH CHECK (app.is_member(organization_id));

CREATE POLICY "deals_delete" ON public.deals FOR DELETE
  USING (app.is_member(organization_id));

-- Tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select" ON public.tasks FOR SELECT
  USING (app.is_member(organization_id));

CREATE POLICY "tasks_insert" ON public.tasks FOR INSERT
  WITH CHECK (app.is_member(organization_id));

CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE
  USING (app.is_member(organization_id))
  WITH CHECK (app.is_member(organization_id));

CREATE POLICY "tasks_delete" ON public.tasks FOR DELETE
  USING (app.is_member(organization_id));

-- Meetings
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meetings_select" ON public.meetings FOR SELECT
  USING (app.is_member(organization_id));

CREATE POLICY "meetings_insert" ON public.meetings FOR INSERT
  WITH CHECK (app.is_member(organization_id));

CREATE POLICY "meetings_update" ON public.meetings FOR UPDATE
  USING (app.is_member(organization_id))
  WITH CHECK (app.is_member(organization_id));

CREATE POLICY "meetings_delete" ON public.meetings FOR DELETE
  USING (app.is_member(organization_id));

-- Follow Ups
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "follow_ups_select" ON public.follow_ups FOR SELECT
  USING (app.is_member(organization_id));

CREATE POLICY "follow_ups_insert" ON public.follow_ups FOR INSERT
  WITH CHECK (app.is_member(organization_id));

CREATE POLICY "follow_ups_update" ON public.follow_ups FOR UPDATE
  USING (app.is_member(organization_id))
  WITH CHECK (app.is_member(organization_id));

CREATE POLICY "follow_ups_delete" ON public.follow_ups FOR DELETE
  USING (app.is_member(organization_id));

-- =============================================================================
-- 8. Indexes
-- =============================================================================

-- Deals
CREATE INDEX idx_deals_org ON public.deals(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_deals_org_stage ON public.deals(organization_id, stage) WHERE deleted_at IS NULL;
CREATE INDEX idx_deals_org_status ON public.deals(organization_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_deals_lead ON public.deals(lead_id);
CREATE INDEX idx_deals_owner ON public.deals(owner_id) WHERE deleted_at IS NULL;

-- Tasks
CREATE INDEX idx_tasks_org ON public.tasks(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_assigned ON public.tasks(assigned_to, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_due ON public.tasks(organization_id, due_at) WHERE deleted_at IS NULL AND status IN ('todo', 'in_progress');
CREATE INDEX idx_tasks_lead ON public.tasks(lead_id);
CREATE INDEX idx_tasks_deal ON public.tasks(deal_id);

-- Meetings
CREATE INDEX idx_meetings_org ON public.meetings(organization_id);
CREATE INDEX idx_meetings_lead ON public.meetings(lead_id);
CREATE INDEX idx_meetings_deal ON public.meetings(deal_id);
CREATE INDEX idx_meetings_time ON public.meetings(organization_id, start_time);

-- Follow Ups
CREATE INDEX idx_follow_ups_org ON public.follow_ups(organization_id);
CREATE INDEX idx_follow_ups_scheduled ON public.follow_ups(organization_id, scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_follow_ups_lead ON public.follow_ups(lead_id);

-- Leads pipeline stage
CREATE INDEX idx_leads_org_pipeline ON public.leads(organization_id, pipeline_stage) WHERE deleted_at IS NULL;
