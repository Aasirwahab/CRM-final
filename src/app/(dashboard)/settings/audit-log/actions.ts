'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function getAuditLogs(page: number = 0) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const service = createServiceClient()

  const { data: profile } = await service
    .from('profiles')
    .select('id, default_organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.default_organization_id) return { logs: [], total: 0 }

  const pageSize = 50
  const from = page * pageSize

  const { count } = await service
    .from('activity_logs')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', profile.default_organization_id)

  const { data } = await service
    .from('activity_logs')
    .select('id, action, entity_type, entity_id, before_json, after_json, created_at, actor_profile_id, profiles:actor_profile_id(full_name)')
    .eq('organization_id', profile.default_organization_id)
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)

  const logs = (data ?? []).map((r: any) => ({
    id: r.id,
    action: r.action,
    entityType: r.entity_type,
    entityId: r.entity_id,
    before: r.before_json,
    after: r.after_json,
    createdAt: r.created_at,
    actorName: r.profiles?.full_name ?? 'System',
  }))

  return { logs, total: count ?? 0 }
}
