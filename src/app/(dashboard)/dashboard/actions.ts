'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function getDashboardStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const service = createServiceClient()

  const { data: profile } = await service
    .from('profiles')
    .select('id, full_name, default_organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.default_organization_id) {
    return {
      userName: profile?.full_name ?? null,
      totalLeads: 0,
      newLeadsThisWeek: 0,
      qualifiedLeads: 0,
      hotLeads: 0,
      activeDeals: 0,
      dealsValue: 0,
      tasksDue: 0,
      tasksCompleted: 0,
      aiSpendToday: 0,
      pipelineBreakdown: [],
      qualityBreakdown: [],
      recentActivity: [],
      leadTrend: [],
    }
  }

  const orgId = profile.default_organization_id
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString()

  // Total leads
  const { count: totalLeads } = await service
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .is('deleted_at', null)

  // New leads this week
  const { count: newLeadsThisWeek } = await service
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .gte('created_at', weekAgo)

  // Qualified leads
  const { count: qualifiedLeads } = await service
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .eq('status', 'qualified')

  // Hot leads
  const { count: hotLeads } = await service
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .eq('lead_quality', 'hot')

  // Active deals + total value
  const { data: dealsData } = await service
    .from('deals')
    .select('value')
    .eq('organization_id', orgId)
    .eq('status', 'open')
    .is('deleted_at', null)

  const activeDeals = dealsData?.length ?? 0
  const dealsValue = (dealsData ?? []).reduce((sum: number, d: any) => sum + (Number(d.value) || 0), 0)

  // Tasks due
  const { count: tasksDue } = await service
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .in('status', ['todo', 'in_progress'])
    .lte('due_at', new Date().toISOString())
    .is('deleted_at', null)

  // Tasks completed this week
  const { count: tasksCompleted } = await service
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'done')
    .is('deleted_at', null)
    .gte('updated_at', weekAgo)

  // AI spend today
  const { data: spendRows } = await service
    .from('ai_usage_log')
    .select('cost_usd_cents')
    .eq('organization_id', orgId)
    .gte('created_at', todayStart)

  const aiSpendToday = (spendRows ?? []).reduce((sum: number, r: any) => sum + Number(r.cost_usd_cents), 0)

  // Pipeline stage breakdown
  const { data: pipelineData } = await service
    .from('leads')
    .select('pipeline_stage')
    .eq('organization_id', orgId)
    .is('deleted_at', null)

  const stageCounts: Record<string, number> = {}
  ;(pipelineData ?? []).forEach((r: any) => {
    stageCounts[r.pipeline_stage] = (stageCounts[r.pipeline_stage] || 0) + 1
  })
  const pipelineBreakdown = Object.entries(stageCounts).map(([stage, count]) => ({ stage, count }))

  // Quality breakdown
  const { data: qualityData } = await service
    .from('leads')
    .select('lead_quality')
    .eq('organization_id', orgId)
    .is('deleted_at', null)

  const qualityCounts: Record<string, number> = {}
  ;(qualityData ?? []).forEach((r: any) => {
    qualityCounts[r.lead_quality] = (qualityCounts[r.lead_quality] || 0) + 1
  })
  const qualityBreakdown = Object.entries(qualityCounts).map(([quality, count]) => ({ quality, count }))

  // Recent activity (last 10 leads created + tasks completed)
  const { data: recentLeads } = await service
    .from('leads')
    .select('id, created_at, companies(name), contacts(full_name)')
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: recentTasks } = await service
    .from('tasks')
    .select('id, title, status, updated_at')
    .eq('organization_id', orgId)
    .eq('status', 'done')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(5)

  const recentActivity: { id: string; type: string; label: string; detail: string; time: string }[] = []

  for (const lead of recentLeads ?? []) {
    const l = lead as any
    recentActivity.push({
      id: l.id,
      type: 'lead_created',
      label: 'New Lead Added',
      detail: l.companies?.name || l.contacts?.full_name || 'Unknown',
      time: l.created_at,
    })
  }

  for (const task of recentTasks ?? []) {
    const t = task as any
    recentActivity.push({
      id: t.id,
      type: 'task_done',
      label: 'Task Completed',
      detail: t.title,
      time: t.updated_at,
    })
  }

  recentActivity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

  // Daily lead trend (last 30 days) — leads created per day + cumulative
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: trendData } = await service
    .from('leads')
    .select('created_at')
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: true })

  const dailyCounts: Record<string, number> = {}
  for (const row of trendData ?? []) {
    const day = (row as any).created_at.slice(0, 10)
    dailyCounts[day] = (dailyCounts[day] || 0) + 1
  }

  const leadTrend: { date: string; leads: number; cumulative: number }[] = []
  let cumulative = (totalLeads ?? 0) - (trendData ?? []).length
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const count = dailyCounts[key] ?? 0
    cumulative += count
    leadTrend.push({ date: label, leads: count, cumulative })
  }

  return {
    userName: profile?.full_name ?? null,
    totalLeads: totalLeads ?? 0,
    newLeadsThisWeek: newLeadsThisWeek ?? 0,
    qualifiedLeads: qualifiedLeads ?? 0,
    hotLeads: hotLeads ?? 0,
    activeDeals,
    dealsValue,
    tasksDue: tasksDue ?? 0,
    tasksCompleted: tasksCompleted ?? 0,
    aiSpendToday,
    pipelineBreakdown,
    qualityBreakdown,
    recentActivity: recentActivity.slice(0, 8),
    leadTrend,
  }
}
