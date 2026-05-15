-- Phase 7: Custom Tables (LeadFlow Tables Feature)
-- Tables: custom_tables, custom_columns, custom_rows
-- Approach: structured column definitions + JSONB cell storage per row
-- Plus: enums, RLS, indexes, triggers

-- =============================================================================
-- 1. Enum types
-- =============================================================================
CREATE TYPE public.custom_field_type AS ENUM (
  'text', 'number', 'date', 'checkbox',
  'single_select', 'url', 'email', 'phone',
  'link_lead', 'link_company', 'link_deal'
);

CREATE TYPE public.custom_table_role AS ENUM ('admin', 'editor', 'viewer');

-- =============================================================================
-- 2. Custom Tables (table definitions)
-- =============================================================================
CREATE TABLE public.custom_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  icon text,
  color text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  UNIQUE (organization_id, slug)
);

CREATE TRIGGER custom_tables_updated_at BEFORE UPDATE ON public.custom_tables
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 3. Custom Columns (field definitions per table)
-- =============================================================================
CREATE TABLE public.custom_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id uuid NOT NULL REFERENCES public.custom_tables(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  key text NOT NULL,
  field_type public.custom_field_type NOT NULL,
  position integer NOT NULL DEFAULT 0,
  is_required boolean NOT NULL DEFAULT false,
  options jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  UNIQUE (table_id, key)
);

CREATE TRIGGER custom_columns_updated_at BEFORE UPDATE ON public.custom_columns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 4. Custom Rows (data rows with JSONB cell storage)
-- =============================================================================
CREATE TABLE public.custom_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id uuid NOT NULL REFERENCES public.custom_tables(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  cells jsonb NOT NULL DEFAULT '{}',
  linked_lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  linked_company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  linked_deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  version integer NOT NULL DEFAULT 1
);

CREATE TRIGGER custom_rows_updated_at BEFORE UPDATE ON public.custom_rows
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 5. Table Permissions (per-user role overrides)
-- =============================================================================
CREATE TABLE public.custom_table_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id uuid NOT NULL REFERENCES public.custom_tables(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.custom_table_role NOT NULL DEFAULT 'viewer',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (table_id, profile_id)
);

-- =============================================================================
-- 6. Row Level Security
-- =============================================================================

-- Custom Tables: org members can read, admins can manage
ALTER TABLE public.custom_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_tables_select" ON public.custom_tables FOR SELECT
  USING (app.is_member(organization_id));

CREATE POLICY "custom_tables_insert" ON public.custom_tables FOR INSERT
  WITH CHECK (app.is_member(organization_id));

CREATE POLICY "custom_tables_update" ON public.custom_tables FOR UPDATE
  USING (app.is_member(organization_id))
  WITH CHECK (app.is_member(organization_id));

CREATE POLICY "custom_tables_delete" ON public.custom_tables FOR DELETE
  USING (app.is_member(organization_id));

-- Custom Columns: same org-level access
ALTER TABLE public.custom_columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_columns_select" ON public.custom_columns FOR SELECT
  USING (app.is_member(organization_id));

CREATE POLICY "custom_columns_insert" ON public.custom_columns FOR INSERT
  WITH CHECK (app.is_member(organization_id));

CREATE POLICY "custom_columns_update" ON public.custom_columns FOR UPDATE
  USING (app.is_member(organization_id))
  WITH CHECK (app.is_member(organization_id));

CREATE POLICY "custom_columns_delete" ON public.custom_columns FOR DELETE
  USING (app.is_member(organization_id));

-- Custom Rows: org-level access
ALTER TABLE public.custom_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_rows_select" ON public.custom_rows FOR SELECT
  USING (app.is_member(organization_id));

CREATE POLICY "custom_rows_insert" ON public.custom_rows FOR INSERT
  WITH CHECK (app.is_member(organization_id));

CREATE POLICY "custom_rows_update" ON public.custom_rows FOR UPDATE
  USING (app.is_member(organization_id))
  WITH CHECK (app.is_member(organization_id));

CREATE POLICY "custom_rows_delete" ON public.custom_rows FOR DELETE
  USING (app.is_member(organization_id));

-- Custom Table Permissions
ALTER TABLE public.custom_table_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_table_permissions_select" ON public.custom_table_permissions FOR SELECT
  USING (app.is_member(organization_id));

CREATE POLICY "custom_table_permissions_insert" ON public.custom_table_permissions FOR INSERT
  WITH CHECK (app.is_member(organization_id));

CREATE POLICY "custom_table_permissions_update" ON public.custom_table_permissions FOR UPDATE
  USING (app.is_member(organization_id))
  WITH CHECK (app.is_member(organization_id));

CREATE POLICY "custom_table_permissions_delete" ON public.custom_table_permissions FOR DELETE
  USING (app.is_member(organization_id));

-- =============================================================================
-- 7. Indexes
-- =============================================================================

-- Custom Tables
CREATE INDEX idx_custom_tables_org ON public.custom_tables(organization_id) WHERE archived_at IS NULL;
CREATE INDEX idx_custom_tables_org_slug ON public.custom_tables(organization_id, slug) WHERE archived_at IS NULL;

-- Custom Columns
CREATE INDEX idx_custom_columns_table ON public.custom_columns(table_id, position) WHERE archived_at IS NULL;
CREATE INDEX idx_custom_columns_org ON public.custom_columns(organization_id);

-- Custom Rows
CREATE INDEX idx_custom_rows_table ON public.custom_rows(table_id, created_at DESC) WHERE archived_at IS NULL;
CREATE INDEX idx_custom_rows_org ON public.custom_rows(organization_id) WHERE archived_at IS NULL;
CREATE INDEX idx_custom_rows_cells ON public.custom_rows USING gin (cells);
CREATE INDEX idx_custom_rows_linked_lead ON public.custom_rows(linked_lead_id) WHERE linked_lead_id IS NOT NULL;
CREATE INDEX idx_custom_rows_linked_company ON public.custom_rows(linked_company_id) WHERE linked_company_id IS NOT NULL;
CREATE INDEX idx_custom_rows_linked_deal ON public.custom_rows(linked_deal_id) WHERE linked_deal_id IS NOT NULL;

-- Custom Table Permissions
CREATE INDEX idx_custom_table_permissions_table ON public.custom_table_permissions(table_id);
CREATE INDEX idx_custom_table_permissions_profile ON public.custom_table_permissions(profile_id);

-- =============================================================================
-- 8. Helper function: generate stable slug from name
-- =============================================================================
CREATE OR REPLACE FUNCTION public.generate_table_slug(p_name text, p_org_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  base_slug := lower(regexp_replace(trim(p_name), '[^a-z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);

  IF base_slug = '' THEN
    base_slug := 'table';
  END IF;

  final_slug := base_slug;

  WHILE EXISTS (
    SELECT 1 FROM public.custom_tables
    WHERE organization_id = p_org_id AND slug = final_slug
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$;
