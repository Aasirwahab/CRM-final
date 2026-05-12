'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export type LeadRow = {
  id: string
  source: string | null
  status: string
  lead_score: number
  lead_quality: string
  ai_status: string
  created_at: string
  company_name: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
}

export async function getLeads(params: {
  page: number
  pageSize: number
  search?: string
  status?: string
  quality?: string
  sortBy?: string
  sortDesc?: boolean
}): Promise<{ leads: LeadRow[]; total: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const service = createServiceClient()

  const { data: profile } = await service
    .from('profiles')
    .select('id, default_organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.default_organization_id) {
    return { leads: [], total: 0 }
  }

  const orgId = profile.default_organization_id
  const { page, pageSize, search, status, quality, sortBy = 'created_at', sortDesc = true } = params

  // Count query
  let countQuery = service
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .is('deleted_at', null)

  if (status) countQuery = countQuery.eq('status', status)
  if (quality) countQuery = countQuery.eq('lead_quality', quality)

  const { count } = await countQuery

  // Data query with joins
  let query = service
    .from('leads')
    .select(`
      id,
      source,
      status,
      lead_score,
      lead_quality,
      ai_status,
      created_at,
      companies(name),
      contacts(full_name, email, phone)
    `)
    .eq('organization_id', orgId)
    .is('deleted_at', null)

  if (status) query = query.eq('status', status)
  if (quality) query = query.eq('lead_quality', quality)

  // Sort
  const validSortColumns = ['created_at', 'lead_score', 'status', 'lead_quality']
  const col = validSortColumns.includes(sortBy) ? sortBy : 'created_at'
  query = query.order(col, { ascending: !sortDesc })

  // Pagination
  const from = page * pageSize
  query = query.range(from, from + pageSize - 1)

  const { data, error } = await query

  if (error) {
    return { leads: [], total: 0 }
  }

  const leads: LeadRow[] = (data ?? []).map((row: any) => ({
    id: row.id,
    source: row.source,
    status: row.status,
    lead_score: row.lead_score,
    lead_quality: row.lead_quality,
    ai_status: row.ai_status,
    created_at: row.created_at,
    company_name: row.companies?.name ?? null,
    contact_name: row.contacts?.full_name ?? null,
    contact_email: row.contacts?.email ?? null,
    contact_phone: row.contacts?.phone ?? null,
  }))

  // Client-side search filter (for now — upgrade to full-text search later)
  let filtered = leads
  if (search) {
    const s = search.toLowerCase()
    filtered = leads.filter(l =>
      l.company_name?.toLowerCase().includes(s) ||
      l.contact_name?.toLowerCase().includes(s) ||
      l.contact_email?.toLowerCase().includes(s)
    )
  }

  return { leads: filtered, total: count ?? 0 }
}

export async function exportLeadsCSV(params: {
  search?: string
  status?: string
  quality?: string
}): Promise<{ csv: string; count: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const service = createServiceClient()

  const { data: profile } = await service
    .from('profiles')
    .select('id, default_organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.default_organization_id) return { csv: '', count: 0 }

  const orgId = profile.default_organization_id

  let query = service
    .from('leads')
    .select(`
      id, source, status, lead_score, lead_quality, ai_status,
      pipeline_stage, last_contacted_at, next_follow_up_at,
      created_at, updated_at,
      companies(name, website, industry, size_band, location),
      contacts(full_name, email, phone, job_title, linkedin_url, is_decision_maker)
    `)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(5000)

  if (params.status) query = query.eq('status', params.status)
  if (params.quality) query = query.eq('lead_quality', params.quality)

  const { data } = await query

  if (!data || data.length === 0) return { csv: '', count: 0 }

  // Build CSV
  const headers = [
    'Company Name', 'Website', 'Industry', 'Size', 'Location',
    'Contact Name', 'Email', 'Phone', 'Job Title', 'LinkedIn',
    'Decision Maker', 'Source', 'Status', 'Quality', 'Score',
    'AI Status', 'Pipeline Stage', 'Last Contacted', 'Next Follow-up',
    'Created', 'Updated',
  ]

  const rows = data.map((r: any) => {
    const co = r.companies
    const ct = r.contacts
    return [
      co?.name ?? '', co?.website ?? '', co?.industry ?? '', co?.size_band ?? '', co?.location ?? '',
      ct?.full_name ?? '', ct?.email ?? '', ct?.phone ?? '', ct?.job_title ?? '', ct?.linkedin_url ?? '',
      ct?.is_decision_maker ? 'Yes' : 'No',
      r.source ?? '', r.status, r.lead_quality, r.lead_score,
      r.ai_status, r.pipeline_stage ?? '',
      r.last_contacted_at ? new Date(r.last_contacted_at).toLocaleDateString() : '',
      r.next_follow_up_at ? new Date(r.next_follow_up_at).toLocaleDateString() : '',
      new Date(r.created_at).toLocaleDateString(),
      new Date(r.updated_at).toLocaleDateString(),
    ].map(v => {
      const s = String(v)
      // Escape CSV: quote fields containing commas, quotes, or newlines
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`
      }
      return s
    })
  })

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

  // Log export activity
  await service.from('activity_logs').insert({
    organization_id: orgId,
    actor_profile_id: profile.id,
    action: 'exported',
    entity_type: 'leads',
    after_json: { count: data.length, filters: params },
  })

  return { csv, count: data.length }
}
