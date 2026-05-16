CREATE OR REPLACE FUNCTION public.search_leads(
  p_org_id uuid,
  p_search text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_quality text DEFAULT NULL,
  p_sort_by text DEFAULT 'created_at',
  p_sort_desc boolean DEFAULT true,
  p_limit integer DEFAULT 25,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  source text,
  status public.lead_status,
  lead_score integer,
  lead_quality public.lead_quality,
  ai_status public.ai_status,
  created_at timestamptz,
  company_name text,
  contact_name text,
  contact_email text,
  contact_phone text,
  total_count bigint
)
LANGUAGE sql STABLE
AS $$
  WITH filtered AS (
    SELECT
      l.id,
      l.source,
      l.status,
      l.lead_score,
      l.lead_quality,
      l.ai_status,
      l.created_at,
      c.name AS company_name,
      ct.full_name AS contact_name,
      ct.email AS contact_email,
      ct.phone AS contact_phone
    FROM public.leads l
    LEFT JOIN public.companies c ON c.id = l.company_id
    LEFT JOIN public.contacts ct ON ct.id = l.contact_id
    WHERE l.organization_id = p_org_id
      AND l.deleted_at IS NULL
      AND (p_status IS NULL OR l.status::text = p_status)
      AND (p_quality IS NULL OR l.lead_quality::text = p_quality)
      AND (
        p_search IS NULL
        OR c.name ILIKE '%' || p_search || '%'
        OR ct.full_name ILIKE '%' || p_search || '%'
        OR ct.email ILIKE '%' || p_search || '%'
      )
  )
  SELECT
    f.*,
    count(*) OVER () AS total_count
  FROM filtered f
  ORDER BY
    CASE WHEN p_sort_by = 'lead_score' AND p_sort_desc THEN f.lead_score END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'lead_score' AND NOT p_sort_desc THEN f.lead_score END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'status' AND p_sort_desc THEN f.status::text END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'status' AND NOT p_sort_desc THEN f.status::text END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'lead_quality' AND p_sort_desc THEN f.lead_quality::text END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'lead_quality' AND NOT p_sort_desc THEN f.lead_quality::text END ASC NULLS LAST,
    CASE WHEN (p_sort_by = 'created_at' OR p_sort_by IS NULL) AND p_sort_desc THEN f.created_at END DESC NULLS LAST,
    CASE WHEN (p_sort_by = 'created_at' OR p_sort_by IS NULL) AND NOT p_sort_desc THEN f.created_at END ASC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
$$;
