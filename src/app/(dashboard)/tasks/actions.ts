'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

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

  const { error } = await service
    .from('tasks')
    .insert({
      organization_id: profile.default_organization_id,
      title: data.title,
      description: data.description || null,
      priority: data.priority,
      due_at: data.due_at || null,
      lead_id: data.lead_id || null,
      deal_id: data.deal_id || null,
      assigned_to: profile.id,
      created_by: profile.id,
    })

  if (error) return { error: 'Failed to create task' }
  return { success: true }
}

export async function updateTaskStatus(taskId: string, status: string) {
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

  const { error } = await service
    .from('tasks')
    .update({ status })
    .eq('id', taskId)
    .eq('organization_id', profile.default_organization_id)

  if (error) return { error: 'Failed to update task' }
  return { success: true }
}
