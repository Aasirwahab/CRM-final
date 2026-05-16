'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { RATE_LIMITS } from '@/lib/rate-limit'
import { validate, uuidSchema, pipelineStageSchema } from '@/lib/validate'

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

const STAGE_TO_STATUS: Record<string, string> = {
  imported: 'new',
  researched: 'new',
  qualified: 'qualified',
  contacted: 'contacted',
  replied: 'contacted',
  meeting_booked: 'contacted',
  proposal_sent: 'contacted',
  negotiation: 'contacted',
  won: 'converted',
  lost: 'lost',
  nurture: 'nurture',
}

export async function moveLeadStage(leadId: string, newStage: string, currentVersion: number, dealDetails?: { value?: number; closeDate?: string }) {
  const idCheck = validate(uuidSchema, leadId)
  if (idCheck.error) return { error: 'Invalid lead ID' }

  const stageCheck = validate(pipelineStageSchema, newStage)
  if (stageCheck.error) return { error: stageCheck.error }

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

  const rl = await RATE_LIMITS.write(user.id)
  if (!rl.success) return { error: `Too many requests. Try again in ${rl.resetIn}s.` }

  try {
    const { data: lead } = await service
      .from('leads')
      .select('pipeline_stage, status, version, companies(name)')
      .eq('id', leadId)
      .eq('organization_id', profile.default_organization_id)
      .single()

    if (!lead) return { error: 'Lead not found' }

    if (lead.version !== currentVersion) {
      return { error: 'Conflict: This lead was modified by someone else. Please refresh.' }
    }

    const newStatus = STAGE_TO_STATUS[newStage]
    const updateFields: Record<string, unknown> = {
      pipeline_stage: newStage,
      version: currentVersion + 1,
    }
    if (newStatus) updateFields.status = newStatus

    const { error } = await service
      .from('leads')
      .update(updateFields)
      .eq('id', leadId)
      .eq('version', currentVersion)

    if (error) return { error: 'Failed to update stage' }

    await service.from('activity_logs').insert({
      organization_id: profile.default_organization_id,
      actor_profile_id: profile.id,
      entity_type: 'lead',
      entity_id: leadId,
      action: 'updated',
      before_json: { pipeline_stage: lead.pipeline_stage, status: lead.status },
      after_json: { pipeline_stage: newStage, ...(newStatus ? { status: newStatus } : {}) },
    })

    const AUTO_DEAL_STAGES = ['proposal_sent', 'negotiation']
    if (AUTO_DEAL_STAGES.includes(newStage) && !AUTO_DEAL_STAGES.includes(lead.pipeline_stage)) {
      const { data: existingDeal } = await service
        .from('deals')
        .select('id')
        .eq('lead_id', leadId)
        .eq('organization_id', profile.default_organization_id)
        .is('deleted_at', null)
        .maybeSingle()

      if (!existingDeal) {
        const companyName = (lead as any).companies?.name ?? 'Untitled'
        await service.from('deals').insert({
          organization_id: profile.default_organization_id,
          lead_id: leadId,
          title: `${companyName} — Deal`,
          stage: newStage,
          value: dealDetails?.value ?? null,
          expected_close_date: dealDetails?.closeDate ?? null,
          owner_id: profile.id,
          created_by: profile.id,
        })
      }
    }

    return { success: true, newVersion: currentVersion + 1 }
  } catch {
    return { error: 'Something went wrong. Please try again.' }
  }
}

export async function syncLeadStatuses() {
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

  const { data: leads } = await service
    .from('leads')
    .select('id, pipeline_stage, status')
    .eq('organization_id', profile.default_organization_id)
    .is('deleted_at', null)

  if (!leads?.length) return { updated: 0 }

  let updated = 0
  for (const lead of leads) {
    const expectedStatus = STAGE_TO_STATUS[lead.pipeline_stage]
    if (expectedStatus && lead.status !== expectedStatus) {
      await service
        .from('leads')
        .update({ status: expectedStatus })
        .eq('id', lead.id)
      updated++
    }
  }

  return { updated }
}
