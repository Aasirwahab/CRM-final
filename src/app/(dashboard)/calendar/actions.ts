'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export type CalendarTask = {
  id: string
  title: string
  status: string
  priority: string
  due_at: string
  company_name: string | null
}

export type CalendarDeal = {
  id: string
  title: string
  value: number | null
  status: string
  expected_close_date: string
  company_name: string | null
}

export async function getCalendarItems(params: {
  from: string // ISO date string (start of range)
  to: string   // ISO date string (end of range)
}): Promise<{ tasks: CalendarTask[]; deals: CalendarDeal[] }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const service = createServiceClient()

  const { data: profile } = await service
    .from('profiles')
    .select('id, default_organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.default_organization_id) return { tasks: [], deals: [] }

  const orgId = profile.default_organization_id

  // Fetch tasks with due dates in range
  const { data: taskData } = await service
    .from('tasks')
    .select(`id, title, status, priority, due_at, leads(companies(name))`)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .not('due_at', 'is', null)
    .gte('due_at', params.from)
    .lte('due_at', params.to)
    .order('due_at', { ascending: true })

  // Fetch deals with close dates in range
  const { data: dealData } = await service
    .from('deals')
    .select(`id, title, value, status, expected_close_date, leads(companies(name))`)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .not('expected_close_date', 'is', null)
    .gte('expected_close_date', params.from)
    .lte('expected_close_date', params.to)
    .order('expected_close_date', { ascending: true })

  const tasks: CalendarTask[] = (taskData ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    priority: r.priority,
    due_at: r.due_at,
    company_name: r.leads?.companies?.name ?? null,
  }))

  const deals: CalendarDeal[] = (dealData ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    value: r.value,
    status: r.status,
    expected_close_date: r.expected_close_date,
    company_name: r.leads?.companies?.name ?? null,
  }))

  return { tasks, deals }
}
