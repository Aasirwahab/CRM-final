-- Phase 5: Projects, Settings, Polish
-- Tables: projects, project_tasks, project_milestones, project_files, project_updates
-- Plus: RLS, indexes

-- =============================================================================
-- 1. Enum types
-- =============================================================================
CREATE TYPE public.project_status AS ENUM ('active', 'on_hold', 'completed', 'cancelled');
CREATE TYPE public.milestone_status AS ENUM ('pending', 'in_progress', 'completed');

-- =============================================================================
-- 2. Projects
-- =============================================================================
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
  client_company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  name text NOT NULL,
  type text,
  status public.project_status NOT NULL DEFAULT 'active',
  budget numeric(12,2),
  deadline date,
  tech_stack_json jsonb,
  github_repo text,
  staging_url text,
  live_url text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 3. Project Milestones
-- =============================================================================
CREATE TABLE public.project_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  due_date date,
  status public.milestone_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER project_milestones_updated_at BEFORE UPDATE ON public.project_milestones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 4. Project Files
-- =============================================================================
CREATE TABLE public.project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 5. Project Updates (client-visible)
-- =============================================================================
CREATE TABLE public.project_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  is_client_visible boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER project_updates_updated_at BEFORE UPDATE ON public.project_updates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 6. Storage bucket for project files
-- =============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "project_files_member_read" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'project-files'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT m.organization_id FROM public.memberships m
      JOIN public.profiles p ON p.id = m.profile_id
      WHERE p.user_id = auth.uid() AND m.status = 'active'
    )
  );

CREATE POLICY "project_files_member_insert" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-files'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT m.organization_id FROM public.memberships m
      JOIN public.profiles p ON p.id = m.profile_id
      WHERE p.user_id = auth.uid() AND m.status = 'active'
    )
  );

-- =============================================================================
-- 7. RLS Policies
-- =============================================================================

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_select" ON public.projects FOR SELECT USING (app.is_member(organization_id));
CREATE POLICY "projects_insert" ON public.projects FOR INSERT WITH CHECK (app.is_member(organization_id));
CREATE POLICY "projects_update" ON public.projects FOR UPDATE USING (app.is_member(organization_id)) WITH CHECK (app.is_member(organization_id));
CREATE POLICY "projects_delete" ON public.projects FOR DELETE USING (app.is_member(organization_id));

ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_milestones_select" ON public.project_milestones FOR SELECT USING (app.is_member(organization_id));
CREATE POLICY "project_milestones_insert" ON public.project_milestones FOR INSERT WITH CHECK (app.is_member(organization_id));
CREATE POLICY "project_milestones_update" ON public.project_milestones FOR UPDATE USING (app.is_member(organization_id)) WITH CHECK (app.is_member(organization_id));
CREATE POLICY "project_milestones_delete" ON public.project_milestones FOR DELETE USING (app.is_member(organization_id));

ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_files_select" ON public.project_files FOR SELECT USING (app.is_member(organization_id));
CREATE POLICY "project_files_insert" ON public.project_files FOR INSERT WITH CHECK (app.is_member(organization_id));
CREATE POLICY "project_files_delete" ON public.project_files FOR DELETE USING (app.is_member(organization_id));

ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_updates_select" ON public.project_updates FOR SELECT USING (app.is_member(organization_id));
CREATE POLICY "project_updates_insert" ON public.project_updates FOR INSERT WITH CHECK (app.is_member(organization_id));
CREATE POLICY "project_updates_update" ON public.project_updates FOR UPDATE USING (app.is_member(organization_id)) WITH CHECK (app.is_member(organization_id));
CREATE POLICY "project_updates_delete" ON public.project_updates FOR DELETE USING (app.is_member(organization_id));

-- =============================================================================
-- 8. Indexes
-- =============================================================================
CREATE INDEX idx_projects_org ON public.projects(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_deal ON public.projects(deal_id);
CREATE INDEX idx_projects_status ON public.projects(organization_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_milestones_project ON public.project_milestones(project_id);
CREATE INDEX idx_project_files_project ON public.project_files(project_id);
CREATE INDEX idx_project_updates_project ON public.project_updates(project_id);
