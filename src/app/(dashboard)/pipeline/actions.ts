'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export type PipelineLead = {
  id: string
  pipeline_stage: string
  lead_score: number
  lead_quality: string
  version: number
  company_name: string | null
  contact_name: string | null
  contact_email: string | null
}

export async function getPipelineLeads(): Promise<{ leads: PipelineLead[] }> {
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
    .select(`
      id, pipeline_stage, lead_score, lead_quality, version,
      companies(name),
      contacts(full_name, email)
    `)
    .eq('organization_id', profile.default_organization_id)
    .is('deleted_at', null)
    .order('lead_score', { ascending: false })

  const leads: PipelineLead[] = (data ?? []).map((r: any) => ({
    id: r.id,
    pipeline_stage: r.pipeline_stage,
    lead_score: r.lead_score,
    lead_quality: r.lead_quality,
    version: r.version,
    company_name: r.companies?.name ?? null,
    contact_name: r.contacts?.full_name ?? null,
    contact_email: r.contacts?.email ?? null,
  }))

  return { leads }
}

export async function moveLeadStage(leadId: string, newStage: string, currentVersion: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const service = createServiceClient()

  const { data: profile } = await service
    .from('profiles')
    .select('id, default_organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.default_organization_id) return { error: 'No active organization' }

  const { data: lead } = await service
    .from('leads')
    .select('pipeline_stage, version')
    .eq('id', leadId)
    .eq('organization_id', profile.default_organization_id)
    .single()

  if (!lead) return { error: 'Lead not found' }

  if (lead.version !== currentVersion) {
    return { error: 'Conflict: This lead was modified by someone else. Please refresh.' }
  }

  const { error } = await service
    .from('leads')
    .update({ pipeline_stage: newStage, version: currentVersion + 1 })
    .eq('id', leadId)
    .eq('version', currentVersion)

  if (error) return { error: 'Failed to update stage' }

  await service.from('activity_logs').insert({
    organization_id: profile.default_organization_id,
    actor_profile_id: profile.id,
    entity_type: 'lead',
    entity_id: leadId,
    action: 'updated',
    before_json: { pipeline_stage: lead.pipeline_stage },
    after_json: { pipeline_stage: newStage },
  })

  return { success: true, newVersion: currentVersion + 1 }
}
