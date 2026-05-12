-- Phase A: Comments (threaded notes) + Public Lead Forms
-- =====================================================================

-- 1. Add parent_id to notes for threaded replies
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.notes(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_notes_parent ON public.notes(parent_id);

-- 2. Lead forms table — each org can create shareable forms
CREATE TABLE IF NOT EXISTS public.lead_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Default Form',
  slug text NOT NULL UNIQUE,
  fields_json jsonb NOT NULL DEFAULT '["company_name","contact_name","email","phone","message"]'::jsonb,
  welcome_message text DEFAULT 'Submit your information and we will get back to you shortly.',
  thank_you_message text DEFAULT 'Thank you! We have received your submission.',
  is_active boolean NOT NULL DEFAULT true,
  submission_count integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER lead_forms_updated_at BEFORE UPDATE ON public.lead_forms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Lead form submissions (before they become leads)
CREATE TABLE IF NOT EXISTS public.lead_form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.lead_forms(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  data_json jsonb NOT NULL,
  ip_address text,
  converted_lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. RLS
ALTER TABLE public.lead_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lead_forms_select" ON public.lead_forms FOR SELECT USING (app.is_member(organization_id));
CREATE POLICY "lead_forms_insert" ON public.lead_forms FOR INSERT WITH CHECK (app.is_member(organization_id));
CREATE POLICY "lead_forms_update" ON public.lead_forms FOR UPDATE USING (app.is_member(organization_id)) WITH CHECK (app.is_member(organization_id));
CREATE POLICY "lead_forms_delete" ON public.lead_forms FOR DELETE USING (app.is_member(organization_id));

ALTER TABLE public.lead_form_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lead_form_submissions_select" ON public.lead_form_submissions FOR SELECT USING (app.is_member(organization_id));
CREATE POLICY "lead_form_submissions_insert" ON public.lead_form_submissions FOR INSERT WITH CHECK (true); -- public insert allowed
CREATE POLICY "lead_form_submissions_delete" ON public.lead_form_submissions FOR DELETE USING (app.is_member(organization_id));

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_lead_forms_org ON public.lead_forms(organization_id);
CREATE INDEX IF NOT EXISTS idx_lead_forms_slug ON public.lead_forms(slug);
CREATE INDEX IF NOT EXISTS idx_lead_form_submissions_form ON public.lead_form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_lead_form_submissions_org ON public.lead_form_submissions(organization_id);

-- 6. Add 'exported' to activity_logs action recognition (no schema change needed, just a note)
