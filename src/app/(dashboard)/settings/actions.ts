'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { RATE_LIMITS } from '@/lib/rate-limit'
import { validate, orgNameSchema, profileNameSchema } from '@/lib/validate'

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
  const v = validate(orgNameSchema, name)
  if (v.error) return { error: v.error }

  try {
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

    const rl = await RATE_LIMITS.write(user.id)
    if (!rl.success) return { error: `Too many requests. Try again in ${rl.resetIn}s.` }

    const { data: current } = await service
      .from('organizations')
      .select('name')
      .eq('id', profile.default_organization_id)
      .single()

    const { error } = await service
      .from('organizations')
      .update({ name: v.data })
      .eq('id', profile.default_organization_id)

    if (error) return { error: 'Failed to update' }

    await service.from('activity_logs').insert({
      organization_id: profile.default_organization_id,
      actor_profile_id: profile.id,
      action: 'updated',
      entity_type: 'organization',
      entity_id: profile.default_organization_id,
      before_json: { name: current?.name },
      after_json: { name: v.data },
    })

    return { success: true }
  } catch {
    return { error: 'Something went wrong. Please try again.' }
  }
}

export async function updateProfile(fullName: string) {
  const v = validate(profileNameSchema, fullName)
  if (v.error) return { error: v.error }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/sign-in')

    const rl = await RATE_LIMITS.write(user.id)
    if (!rl.success) return { error: `Too many requests. Try again in ${rl.resetIn}s.` }

    const service = createServiceClient()

    const { data: current } = await service
      .from('profiles')
      .select('id, full_name, default_organization_id')
      .eq('user_id', user.id)
      .single()

    const { error } = await service
      .from('profiles')
      .update({ full_name: v.data })
      .eq('user_id', user.id)

    if (error) return { error: 'Failed to update' }

    if (current?.default_organization_id) {
      await service.from('activity_logs').insert({
        organization_id: current.default_organization_id,
        actor_profile_id: current.id,
        action: 'updated',
        entity_type: 'profile',
        entity_id: current.id,
        before_json: { full_name: current.full_name },
        after_json: { full_name: v.data },
      })
    }

    return { success: true }
  } catch {
    return { error: 'Something went wrong. Please try again.' }
  }
}
