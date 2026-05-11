'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function getLeadDetail(leadId: string) {
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
    return { error: 'No active organization' }
  }

  const orgId = profile.default_organization_id

  const { data: lead } = await service
    .from('leads')
    .select(`
      id, source, status, lead_score, lead_quality, ai_status,
      last_contacted_at, next_follow_up_at,
      created_at, updated_at,
      companies(id, name, website, industry, size_band, location, ai_summary),
      contacts(id, full_name, email, phone, job_title, linkedin_url, is_decision_maker)
    `)
    .eq('id', leadId)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .single()

  if (!lead) {
    return { error: 'Lead not found' }
  }

  // Fetch research report
  const { data: research } = await service
    .from('research_reports')
    .select('*')
    .eq('lead_id', leadId)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Fetch activity logs
  const { data: activities } = await service
    .from('activity_logs')
    .select('id, action, entity_type, before_json, after_json, created_at, actor_profile_id')
    .eq('entity_id', leadId)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(20)

  // Fetch notes
  const { data: notes } = await service
    .from('notes')
    .select('id, content, created_by, created_at')
    .eq('entity_type', 'lead')
    .eq('entity_id', leadId)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  return {
    lead,
    research: research ?? null,
    activities: activities ?? [],
    notes: notes ?? [],
  }
}

export async function updateLeadStatus(leadId: string, status: string) {
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
    return { error: 'No active organization' }
  }

  const { data: current } = await service
    .from('leads')
    .select('status, version')
    .eq('id', leadId)
    .eq('organization_id', profile.default_organization_id)
    .single()

  if (!current) return { error: 'Lead not found' }

  const { error } = await service
    .from('leads')
    .update({ status, version: current.version + 1 })
    .eq('id', leadId)
    .eq('version', current.version)

  if (error) {
    return { error: 'Failed to update — someone else may have edited this lead' }
  }

  await service.from('activity_logs').insert({
    organization_id: profile.default_organization_id,
    actor_profile_id: profile.id,
    entity_type: 'lead',
    entity_id: leadId,
    action: 'updated',
    before_json: { status: current.status },
    after_json: { status },
  })

  return { success: true }
}

export async function addNote(leadId: string, content: string) {
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
    return { error: 'No active organization' }
  }

  const { error } = await service
    .from('notes')
    .insert({
      organization_id: profile.default_organization_id,
      entity_type: 'lead',
      entity_id: leadId,
      content,
      created_by: profile.id,
    })

  if (error) return { error: 'Failed to add note' }

  return { success: true }
}
