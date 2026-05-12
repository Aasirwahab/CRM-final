'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { scoreLeadRule } from '@/lib/scoring'

export async function getLeadForms() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const service = createServiceClient()

  const { data: profile } = await service
    .from('profiles')
    .select('id, default_organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.default_organization_id) return { forms: [] }

  const { data } = await service
    .from('lead_forms')
    .select('id, name, slug, is_active, submission_count, created_at')
    .eq('organization_id', profile.default_organization_id)
    .order('created_at', { ascending: false })

  return { forms: data ?? [] }
}

export async function createLeadForm(name: string) {
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

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + crypto.randomUUID().slice(0, 8)

  const { data, error } = await service
    .from('lead_forms')
    .insert({
      organization_id: profile.default_organization_id,
      name: name.trim(),
      slug,
      created_by: profile.id,
    })
    .select('id, slug')
    .single()

  if (error) return { error: error.message }
  return { success: true, id: data.id, slug: data.slug }
}

export async function toggleFormActive(formId: string, isActive: boolean) {
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

  await service
    .from('lead_forms')
    .update({ is_active: isActive })
    .eq('id', formId)
    .eq('organization_id', profile.default_organization_id)

  return { success: true }
}

export async function getFormSubmissions(formId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const service = createServiceClient()

  const { data: profile } = await service
    .from('profiles')
    .select('id, default_organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.default_organization_id) return { submissions: [] }

  const { data } = await service
    .from('lead_form_submissions')
    .select('id, data_json, converted_lead_id, created_at')
    .eq('form_id', formId)
    .eq('organization_id', profile.default_organization_id)
    .order('created_at', { ascending: false })
    .limit(100)

  return { submissions: data ?? [] }
}

export async function convertSubmissionToLead(submissionId: string) {
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

  const orgId = profile.default_organization_id

  const { data: submission } = await service
    .from('lead_form_submissions')
    .select('id, data_json, converted_lead_id')
    .eq('id', submissionId)
    .eq('organization_id', orgId)
    .single()

  if (!submission) return { error: 'Submission not found' }
  if (submission.converted_lead_id) return { error: 'Already converted' }

  const d = submission.data_json as Record<string, string>

  // Create company
  const { data: company } = await service
    .from('companies')
    .insert({
      organization_id: orgId,
      name: d.company_name || d.contact_name || 'Unknown',
      website: d.website || null,
      industry: d.industry || null,
      location: d.location || null,
      created_by: profile.id,
    })
    .select('id')
    .single()

  // Create contact
  const { data: contact } = await service
    .from('contacts')
    .insert({
      organization_id: orgId,
      company_id: company?.id || null,
      full_name: d.contact_name || 'Unknown',
      email: d.email || null,
      phone: d.phone || null,
      job_title: d.job_title || null,
      created_by: profile.id,
    })
    .select('id')
    .single()

  // Score the lead
  const scoreInput = {
    email: d.email,
    phone: d.phone,
    website: d.website,
    jobTitle: d.job_title,
    companyName: d.company_name,
    industry: d.industry,
    location: d.location,
  }
  const { score, quality } = scoreLeadRule(scoreInput)

  // Create lead
  const { data: lead } = await service
    .from('leads')
    .insert({
      organization_id: orgId,
      company_id: company?.id || null,
      contact_id: contact?.id || null,
      source: 'web_form',
      status: 'new',
      lead_score: score,
      lead_quality: quality,
      created_by: profile.id,
    })
    .select('id')
    .single()

  if (!lead) return { error: 'Failed to create lead' }

  // Mark submission as converted
  await service
    .from('lead_form_submissions')
    .update({ converted_lead_id: lead.id })
    .eq('id', submissionId)

  // Activity log
  await service.from('activity_logs').insert({
    organization_id: orgId,
    actor_profile_id: profile.id,
    action: 'created',
    entity_type: 'lead',
    entity_id: lead.id,
    after_json: { source: 'web_form', submission_id: submissionId },
  })

  return { success: true, leadId: lead.id }
}
