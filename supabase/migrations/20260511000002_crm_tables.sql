-- Phase 2: CRM Core + CSV Import Tables
-- Tables: companies, contacts, leads, tags, lead_tags, notes, attachments,
--         csv_import_batches, csv_import_rows, import_mappings, activity_logs
-- Plus: RLS policies, indexes, triggers

-- =============================================================================
-- 1. Enum types
-- =============================================================================
CREATE TYPE public.lead_status AS ENUM (
  'new', 'contacted', 'qualified', 'unqualified', 'nurture', 'converted', 'lost'
);

CREATE TYPE public.lead_quality AS ENUM ('hot', 'warm', 'cold');

CREATE TYPE public.ai_status AS ENUM ('pending', 'running', 'completed', 'failed');

CREATE TYPE public.import_batch_status AS ENUM (
  'uploading', 'uploaded', 'parsing', 'processing', 'completed', 'failed'
);

CREATE TYPE public.import_row_status AS ENUM (
  'pending', 'imported', 'skipped', 'failed'
);

CREATE TYPE public.activity_action AS ENUM (
  'created', 'updated', 'deleted', 'restored', 'imported', 'scored', 'researched'
);

-- =============================================================================
-- 2. Companies
-- =============================================================================
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  website text,
  industry text,
  size_band text,
  location text,
  ai_summary text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version integer NOT NULL DEFAULT 1
);

CREATE TRIGGER companies_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 3. Contacts
-- =============================================================================
CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text,
  phone text,
  job_title text,
  linkedin_url text,
  is_decision_maker boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version integer NOT NULL DEFAULT 1
);

CREATE TRIGGER contacts_updated_at BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 4. Leads
-- =============================================================================
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  source text,
  status public.lead_status NOT NULL DEFAULT 'new',
  lead_score integer NOT NULL DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
  lead_quality public.lead_quality NOT NULL DEFAULT 'cold',
  ai_status public.ai_status NOT NULL DEFAULT 'pending',
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_contacted_at timestamptz,
  next_follow_up_at timestamptz,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  version integer NOT NULL DEFAULT 1
);

CREATE TRIGGER leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 5. Tags + Lead Tags
-- =============================================================================
CREATE TABLE public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, name)
);

CREATE TABLE public.lead_tags (
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (lead_id, tag_id)
);

-- =============================================================================
-- 6. Notes
-- =============================================================================
CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  content text NOT NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER notes_updated_at BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 7. Attachments
-- =============================================================================
CREATE TABLE public.attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 8. CSV Import Batches
-- =============================================================================
CREATE TABLE public.csv_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  storage_path text NOT NULL,
  total_rows integer NOT NULL DEFAULT 0,
  successful_rows integer NOT NULL DEFAULT 0,
  failed_rows integer NOT NULL DEFAULT 0,
  duplicate_rows integer NOT NULL DEFAULT 0,
  status public.import_batch_status NOT NULL DEFAULT 'uploading',
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  idempotency_key text NOT NULL UNIQUE,
  started_at timestamptz,
  completed_at timestamptz,
  error_summary_json jsonb,
  column_mapping jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER csv_import_batches_updated_at BEFORE UPDATE ON public.csv_import_batches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 9. CSV Import Rows
-- =============================================================================
CREATE TABLE public.csv_import_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.csv_import_batches(id) ON DELETE CASCADE,
  row_number integer NOT NULL,
  raw_data_json jsonb NOT NULL,
  mapped_data_json jsonb,
  status public.import_row_status NOT NULL DEFAULT 'pending',
  error_message text,
  created_lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 10. Import Mappings (saved templates)
-- =============================================================================
CREATE TABLE public.import_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  mapping_config_json jsonb NOT NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER import_mappings_updated_at BEFORE UPDATE ON public.import_mappings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 11. Activity Logs
-- =============================================================================
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action public.activity_action NOT NULL,
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 12. Row Level Security
-- =============================================================================

-- Companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companies_select" ON public.companies FOR SELECT
  USING (app.is_member(organization_id));

CREATE POLICY "companies_insert" ON public.companies FOR INSERT
  WITH CHECK (app.is_member(organization_id));

CREATE POLICY "companies_update" ON public.companies FOR UPDATE
  USING (app.is_member(organization_id))
  WITH CHECK (app.is_member(organization_id));

CREATE POLICY "companies_delete" ON public.companies FOR DELETE
  USING (app.is_member(organization_id));

-- Contacts
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contacts_select" ON public.contacts FOR SELECT
  USING (app.is_member(organization_id));

CREATE POLICY "contacts_insert" ON public.contacts FOR INSERT
  WITH CHECK (app.is_member(organization_id));

CREATE POLICY "contacts_update" ON public.contacts FOR UPDATE
  USING (app.is_member(organization_id))
  WITH CHECK (app.is_member(organization_id));

CREATE POLICY "contacts_delete" ON public.contacts FOR DELETE
  USING (app.is_member(organization_id));

-- Leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_select" ON public.leads FOR SELECT
  USING (app.is_member(organization_id));

CREATE POLICY "leads_insert" ON public.leads FOR INSERT
  WITH CHECK (app.is_member(organization_id));

CREATE POLICY "leads_update" ON public.leads FOR UPDATE
  USING (app.is_member(organization_id))
  WITH CHECK (app.is_member(organization_id));

CREATE POLICY "leads_delete" ON public.leads FOR DELETE
  USING (app.is_member(organization_id));

-- Tags
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tags_select" ON public.tags FOR SELECT
  USING (app.is_member(organization_id));

CREATE POLICY "tags_insert" ON public.tags FOR INSERT
  WITH CHECK (app.is_member(organization_id));

CREATE POLICY "tags_update" ON public.tags FOR UPDATE
  USING (app.is_member(organization_id))
  WITH CHECK (app.is_member(organization_id));

CREATE POLICY "tags_delete" ON public.tags FOR DELETE
  USING (app.is_member(organization_id));

-- Lead Tags (inherit access from leads)
ALTER TABLE public.lead_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_tags_select" ON public.lead_tags FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.leads l WHERE l.id = lead_tags.lead_id AND app.is_member(l.organization_id)
  ));

CREATE POLICY "lead_tags_insert" ON public.lead_tags FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.leads l WHERE l.id = lead_tags.lead_id AND app.is_member(l.organization_id)
  ));

CREATE POLICY "lead_tags_delete" ON public.lead_tags FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.leads l WHERE l.id = lead_tags.lead_id AND app.is_member(l.organization_id)
  ));

-- Notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notes_select" ON public.notes FOR SELECT
  USING (app.is_member(organization_id));

CREATE POLICY "notes_insert" ON public.notes FOR INSERT
  WITH CHECK (app.is_member(organization_id));

CREATE POLICY "notes_update" ON public.notes FOR UPDATE
  USING (app.is_member(organization_id))
  WITH CHECK (app.is_member(organization_id));

CREATE POLICY "notes_delete" ON public.notes FOR DELETE
  USING (app.is_member(organization_id));

-- Attachments
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attachments_select" ON public.attachments FOR SELECT
  USING (app.is_member(organization_id));

CREATE POLICY "attachments_insert" ON public.attachments FOR INSERT
  WITH CHECK (app.is_member(organization_id));

CREATE POLICY "attachments_delete" ON public.attachments FOR DELETE
  USING (app.is_member(organization_id));

-- CSV Import Batches
ALTER TABLE public.csv_import_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "csv_import_batches_select" ON public.csv_import_batches FOR SELECT
  USING (app.is_member(organization_id));

CREATE POLICY "csv_import_batches_insert" ON public.csv_import_batches FOR INSERT
  WITH CHECK (app.is_member(organization_id));

CREATE POLICY "csv_import_batches_update" ON public.csv_import_batches FOR UPDATE
  USING (app.is_member(organization_id))
  WITH CHECK (app.is_member(organization_id));

-- CSV Import Rows (inherit access from batch)
ALTER TABLE public.csv_import_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "csv_import_rows_select" ON public.csv_import_rows FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.csv_import_batches b
    WHERE b.id = csv_import_rows.batch_id AND app.is_member(b.organization_id)
  ));

CREATE POLICY "csv_import_rows_insert" ON public.csv_import_rows FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.csv_import_batches b
    WHERE b.id = csv_import_rows.batch_id AND app.is_member(b.organization_id)
  ));

CREATE POLICY "csv_import_rows_update" ON public.csv_import_rows FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.csv_import_batches b
    WHERE b.id = csv_import_rows.batch_id AND app.is_member(b.organization_id)
  ));

-- Import Mappings
ALTER TABLE public.import_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "import_mappings_select" ON public.import_mappings FOR SELECT
  USING (app.is_member(organization_id));

CREATE POLICY "import_mappings_insert" ON public.import_mappings FOR INSERT
  WITH CHECK (app.is_member(organization_id));

CREATE POLICY "import_mappings_update" ON public.import_mappings FOR UPDATE
  USING (app.is_member(organization_id))
  WITH CHECK (app.is_member(organization_id));

CREATE POLICY "import_mappings_delete" ON public.import_mappings FOR DELETE
  USING (app.is_member(organization_id));

-- Activity Logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_logs_select" ON public.activity_logs FOR SELECT
  USING (app.is_member(organization_id));

CREATE POLICY "activity_logs_insert" ON public.activity_logs FOR INSERT
  WITH CHECK (app.is_member(organization_id));

-- =============================================================================
-- 13. Indexes
-- =============================================================================

-- Companies
CREATE INDEX idx_companies_org ON public.companies(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_companies_org_website ON public.companies(organization_id, lower(website)) WHERE deleted_at IS NULL;
CREATE INDEX idx_companies_org_name_trgm ON public.companies USING gin (name gin_trgm_ops);

-- Contacts
CREATE INDEX idx_contacts_org ON public.contacts(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_org_email ON public.contacts(organization_id, lower(email)) WHERE deleted_at IS NULL AND email IS NOT NULL;
CREATE INDEX idx_contacts_company ON public.contacts(company_id) WHERE deleted_at IS NULL;

-- Leads
CREATE INDEX idx_leads_org ON public.leads(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_org_status ON public.leads(organization_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_org_quality ON public.leads(organization_id, lead_quality) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_org_assigned ON public.leads(organization_id, assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_org_followup ON public.leads(organization_id, next_follow_up_at) WHERE deleted_at IS NULL AND next_follow_up_at IS NOT NULL;
CREATE INDEX idx_leads_org_created ON public.leads(organization_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_company ON public.leads(company_id);
CREATE INDEX idx_leads_contact ON public.leads(contact_id);

-- Tags
CREATE INDEX idx_tags_org ON public.tags(organization_id);

-- Notes
CREATE INDEX idx_notes_entity ON public.notes(entity_type, entity_id);
CREATE INDEX idx_notes_org ON public.notes(organization_id);

-- Attachments
CREATE INDEX idx_attachments_entity ON public.attachments(entity_type, entity_id);
CREATE INDEX idx_attachments_org ON public.attachments(organization_id);

-- CSV Import
CREATE INDEX idx_csv_batches_org ON public.csv_import_batches(organization_id);
CREATE INDEX idx_csv_batches_status ON public.csv_import_batches(organization_id, status);
CREATE INDEX idx_csv_rows_batch_status ON public.csv_import_rows(batch_id, status);
CREATE INDEX idx_csv_rows_batch_row ON public.csv_import_rows(batch_id, row_number);

-- Import Mappings
CREATE INDEX idx_import_mappings_org ON public.import_mappings(organization_id);

-- Activity Logs
CREATE INDEX idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_org ON public.activity_logs(organization_id, created_at DESC);
CREATE INDEX idx_activity_logs_actor ON public.activity_logs(actor_profile_id);

-- =============================================================================
-- 14. Storage Buckets
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('csv-imports', 'csv-imports', false),
  ('lead-attachments', 'lead-attachments', false),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: csv-imports bucket
CREATE POLICY "csv_imports_member_read" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'csv-imports'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT m.organization_id FROM public.memberships m
      JOIN public.profiles p ON p.id = m.profile_id
      WHERE p.user_id = auth.uid() AND m.status = 'active'
    )
  );

CREATE POLICY "csv_imports_member_insert" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'csv-imports'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT m.organization_id FROM public.memberships m
      JOIN public.profiles p ON p.id = m.profile_id
      WHERE p.user_id = auth.uid() AND m.status = 'active'
    )
  );

-- Storage RLS: lead-attachments bucket
CREATE POLICY "lead_attachments_member_read" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'lead-attachments'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT m.organization_id FROM public.memberships m
      JOIN public.profiles p ON p.id = m.profile_id
      WHERE p.user_id = auth.uid() AND m.status = 'active'
    )
  );

CREATE POLICY "lead_attachments_member_insert" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'lead-attachments'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT m.organization_id FROM public.memberships m
      JOIN public.profiles p ON p.id = m.profile_id
      WHERE p.user_id = auth.uid() AND m.status = 'active'
    )
  );

-- Storage RLS: avatars bucket (public read, auth insert)
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_auth_insert" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
  );
