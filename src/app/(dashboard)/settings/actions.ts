'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function getOrgSettings() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const service = createServiceClient()

  const { data: profile } = await service
    .from('profiles')
    .select('id, full_name, avatar_url, default_organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.default_organization_id) return { error: 'No org' }

  const { data: org } = await service
    .from('organizations')
    .select('id, name, slug, plan, ai_daily_cap_cents')
    .eq('id', profile.default_organization_id)
    .single()

  const { data: members } = await service
    .from('memberships')
    .select('id, role, status, profiles(id, full_name, avatar_url)')
    .eq('organization_id', profile.default_organization_id)
    .eq('status', 'active')

  return {
    profile: { id: profile.id, fullName: profile.full_name, avatarUrl: profile.avatar_url },
    org: org ?? null,
    members: (members ?? []).map((m: any) => ({
      id: m.id,
      role: m.role,
      profileId: m.profiles?.id,
      fullName: m.profiles?.full_name ?? 'Unknown',
      avatarUrl: m.profiles?.avatar_url,
    })),
  }
}

export async function updateOrgName(name: string) {
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

  const { error } = await service
    .from('organizations')
    .update({ name })
    .eq('id', profile.default_organization_id)

  if (error) return { error: 'Failed to update' }
  return { success: true }
}

export async function updateProfile(fullName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const service = createServiceClient()

  const { error } = await service
    .from('profiles')
    .update({ full_name: fullName })
    .eq('user_id', user.id)

  if (error) return { error: 'Failed to update' }
  return { success: true }
}
