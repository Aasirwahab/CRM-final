'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function getTrashedLeads() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const service = createServiceClient()

  const { data: profile } = await service
    .from('profiles')
    .select('id, default_organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.default_organization_id) return { leads: [] }

  const { data } = await service
    .from('leads')
    .select('id, company_name, status, quality, score, deleted_at, contacts(full_name, email)')
    .eq('organization_id', profile.default_organization_id)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
    .limit(100)

  return {
    leads: (data ?? []).map((l: any) => ({
      id: l.id,
      companyName: l.company_name,
      status: l.status,
      quality: l.quality,
      score: l.score,
      deletedAt: l.deleted_at,
      contactName: l.contacts?.[0]?.full_name ?? null,
      contactEmail: l.contacts?.[0]?.email ?? null,
    })),
  }
}

export async function restoreLead(leadId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const service = createServiceClient()

  const { data: profile } = await service
    .from('profiles')
    .select('id, default_organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.default_organization_id) return { error: 'No org' }

  const { error } = await service
    .from('leads')
    .update({ deleted_at: null })
    .eq('id', leadId)
    .eq('organization_id', profile.default_organization_id)

  if (error) return { error: error.message }

  await service.from('activity_logs').insert({
    organization_id: profile.default_organization_id,
    actor_profile_id: profile.id,
    action: 'restored',
    entity_type: 'lead',
    entity_id: leadId,
  })

  return { success: true }
}

export async function softDeleteLead(leadId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const service = createServiceClient()

  const { data: profile } = await service
    .from('profiles')
    .select('id, default_organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.default_organization_id) return { error: 'No org' }

  const { error } = await service
    .from('leads')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', leadId)
    .eq('organization_id', profile.default_organization_id)

  if (error) return { error: error.message }

  await service.from('activity_logs').insert({
    organization_id: profile.default_organization_id,
    actor_profile_id: profile.id,
    action: 'deleted',
    entity_type: 'lead',
    entity_id: leadId,
  })

  return { success: true }
}
