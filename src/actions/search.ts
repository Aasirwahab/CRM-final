'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export type LeadSearchResult = {
  id: string
  company: string | null
  contact: string | null
  email: string | null
}

/**
 * Lightweight lead lookup for the command palette. Scoped to the user's
 * active organization. Returns a small capped set of matches.
 */
export async function quickSearchLeads(query: string): Promise<LeadSearchResult[]> {
  const q = query.trim()
  if (q.length < 2) return []

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const service = createServiceClient()

  const { data: profile } = await service
    .from('profiles')
    .select('default_organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.default_organization_id) return []

  const { data, error } = await service.rpc('search_leads', {
    p_org_id: profile.default_organization_id,
    p_search: q,
    p_status: null,
    p_quality: null,
    p_sort_by: 'created_at',
    p_sort_desc: true,
    p_limit: 6,
    p_offset: 0,
  })

  if (error || !data) return []

  return (data as any[]).map((l) => ({
    id: l.id,
    company: l.company_name ?? null,
    contact: l.contact_name ?? null,
    email: l.contact_email ?? null,
  }))
}
