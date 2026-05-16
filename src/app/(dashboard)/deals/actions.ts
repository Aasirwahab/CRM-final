'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { RATE_LIMITS } from '@/lib/rate-limit'
import { validate, createDealSchema, uuidSchema } from '@/lib/validate'

export type DealRow = {
  id: string
  title: string
  value: number | null
  stage: string
  probability: number | null
  expected_close_date: string | null
  status: string
  created_at: string
  company_name: string | null
  contact_name: string | null
}

export async function getDeals(params: { status?: string }): Promise<{ deals: DealRow[] }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const service = createServiceClient()

  const { data: profile } = await service
    .from('profiles')
    .select('id, default_organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.default_organization_id) return { deals: [] }

  let query = service
    .from('deals')
    .select(`
      id, title, value, stage, probability, expected_close_date, status, created_at,
      leads(companies(name), contacts(full_name))
    `)
    .eq('organization_id', profile.default_organization_id)
    .is('deleted_at', null)

  if (params.status) query = query.eq('status', params.status)

  query = query.order('created_at', { ascending: false })

  const { data } = await query

  const deals: DealRow[] = (data ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    value: r.value,
    stage: r.stage,
    probability: r.probability,
    expected_close_date: r.expected_close_date,
    status: r.status,
    created_at: r.created_at,
    company_name: r.leads?.companies?.name ?? null,
    contact_name: r.leads?.contacts?.full_name ?? null,
  }))

  return { deals }
}

export async function createDeal(data: {
  title: string
  value?: number
  lead_id?: string
  expected_close_date?: string
}) {
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

  const v = validate(createDealSchema, data)
  if (v.error) return { error: v.error }
  const valid = v.data!

  const rl = await RATE_LIMITS.write(user.id)
  if (!rl.success) return { error: `Too many requests. Try again in ${rl.resetIn}s.` }

  try {
    const { error } = await service
      .from('deals')
      .insert({
        organization_id: profile.default_organization_id,
        title: valid.title,
        value: valid.value ?? null,
        lead_id: valid.leadId || null,
        expected_close_date: data.expected_close_date || null,
        owner_id: profile.id,
        created_by: profile.id,
      })

    if (error) return { error: 'Failed to create deal' }
    return { success: true }
  } catch {
    return { error: 'Something went wrong. Please try again.' }
  }
}

export async function updateDeal(dealId: string, data: {
  title?: string
  value?: number | null
  status?: string
  expected_close_date?: string | null
}) {
  const idCheck = validate(uuidSchema, dealId)
  if (idCheck.error) return { error: 'Invalid deal ID' }

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
    const updateFields: Record<string, unknown> = {}
    if (data.title !== undefined) updateFields.title = data.title
    if (data.value !== undefined) updateFields.value = data.value
    if (data.status !== undefined) {
      updateFields.status = data.status
      if (data.status === 'won') updateFields.won_at = new Date().toISOString()
    }
    if (data.expected_close_date !== undefined) updateFields.expected_close_date = data.expected_close_date

    const { error } = await service
      .from('deals')
      .update(updateFields)
      .eq('id', dealId)
      .eq('organization_id', profile.default_organization_id)

    if (error) return { error: 'Failed to update deal' }
    return { success: true }
  } catch {
    return { error: 'Something went wrong. Please try again.' }
  }
}

export async function deleteDeal(dealId: string) {
  const idCheck = validate(uuidSchema, dealId)
  if (idCheck.error) return { error: 'Invalid deal ID' }

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
    const { data: deal } = await service
      .from('deals')
      .select('id, lead_id')
      .eq('id', dealId)
      .eq('organization_id', profile.default_organization_id)
      .single()

    if (!deal) return { error: 'Deal not found' }

    const { error } = await service
      .from('deals')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', dealId)
      .eq('organization_id', profile.default_organization_id)

    if (error) return { error: 'Failed to delete deal' }

    if (deal.lead_id) {
      await service
        .from('leads')
        .update({ pipeline_stage: 'qualified', status: 'qualified' })
        .eq('id', deal.lead_id)
        .eq('organization_id', profile.default_organization_id)
    }

    return { success: true }
  } catch {
    return { error: 'Something went wrong. Please try again.' }
  }
}
