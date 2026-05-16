'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { RATE_LIMITS } from '@/lib/rate-limit'
import { validate, createTaskSchema, taskStatusSchema, uuidSchema } from '@/lib/validate'

export type TaskRow = {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  due_at: string | null
  lead_id: string | null
  deal_id: string | null
  created_at: string
  company_name: string | null
}

export async function getTasks(params: { status?: string }): Promise<{ tasks: TaskRow[] }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const service = createServiceClient()

  const { data: profile } = await service
    .from('profiles')
    .select('id, default_organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.default_organization_id) return { tasks: [] }

  let query = service
    .from('tasks')
    .select(`
      id, title, description, status, priority, due_at, lead_id, deal_id, created_at,
      leads(companies(name))
    `)
    .eq('organization_id', profile.default_organization_id)
    .is('deleted_at', null)

  if (params.status) {
    query = query.eq('status', params.status)
  }

  query = query.order('due_at', { ascending: true, nullsFirst: false })

  const { data } = await query

  const tasks: TaskRow[] = (data ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    status: r.status,
    priority: r.priority,
    due_at: r.due_at,
    lead_id: r.lead_id,
    deal_id: r.deal_id,
    created_at: r.created_at,
    company_name: r.leads?.companies?.name ?? null,
  }))

  return { tasks }
}

export async function createTask(data: {
  title: string
  description?: string
  priority: string
  due_at?: string
  lead_id?: string
  deal_id?: string
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

  const v = validate(createTaskSchema, { title: data.title, description: data.description, priority: data.priority, dueDate: data.due_at, leadId: data.lead_id, dealId: data.deal_id })
  if (v.error) return { error: v.error }
  const valid = v.data!

  const rl = await RATE_LIMITS.write(user.id)
  if (!rl.success) return { error: `Too many requests. Try again in ${rl.resetIn}s.` }

  try {
    const { error } = await service
      .from('tasks')
      .insert({
        organization_id: profile.default_organization_id,
        title: valid.title,
        description: valid.description || null,
        priority: valid.priority,
        due_at: valid.dueDate || null,
        lead_id: valid.leadId || null,
        deal_id: valid.dealId || null,
        assigned_to: profile.id,
        created_by: profile.id,
      })

    if (error) return { error: 'Failed to create task' }
    return { success: true }
  } catch {
    return { error: 'Something went wrong. Please try again.' }
  }
}

export async function updateTaskStatus(taskId: string, status: string) {
  const idCheck = validate(uuidSchema, taskId)
  if (idCheck.error) return { error: 'Invalid task ID' }

  const statusCheck = validate(taskStatusSchema, status)
  if (statusCheck.error) return { error: statusCheck.error }

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

  const { error } = await service
    .from('tasks')
    .update({ status: statusCheck.data })
    .eq('id', taskId)
    .eq('organization_id', profile.default_organization_id)

  if (error) return { error: 'Failed to update task' }
  return { success: true }
}
