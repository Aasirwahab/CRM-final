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
    .select('id, default_organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.default_organization_id) {
    return { totalLeads: 0, activeDeals: 0, tasksDue: 0, aiSpendToday: 0, pipelineBreakdown: [], qualityBreakdown: [] }
  }

  const orgId = profile.default_organization_id

  // Total leads
  const { count: totalLeads } = await service
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .is('deleted_at', null)

  // Active deals
  const { count: activeDeals } = await service
    .from('deals')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'open')
    .is('deleted_at', null)

  // Tasks due (todo or in_progress with due date in the past or today)
  const { count: tasksDue } = await service
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .in('status', ['todo', 'in_progress'])
    .lte('due_at', new Date().toISOString())
    .is('deleted_at', null)

  // AI spend today
  const { data: spendRows } = await service
    .from('ai_usage_log')
    .select('cost_usd_cents')
    .eq('organization_id', orgId)
    .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())

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

  return {
    totalLeads: totalLeads ?? 0,
    activeDeals: activeDeals ?? 0,
    tasksDue: tasksDue ?? 0,
    aiSpendToday,
    pipelineBreakdown,
    qualityBreakdown,
  }
}
