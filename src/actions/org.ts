'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * Switch the current user's active organization by updating their
 * profile's default_organization_id. Verifies the user has an active
 * membership in the target org before switching.
 */
export async function setActiveOrg(orgId: string) {
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

    if (!profile) return { error: 'Profile not found' }
    if (profile.default_organization_id === orgId) return { success: true }

    // Verify membership in the target org.
    const { data: membership } = await service
      .from('memberships')
      .select('id')
      .eq('profile_id', profile.id)
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .single()

    if (!membership) return { error: 'You are not a member of that organization' }

    const { error } = await service
      .from('profiles')
      .update({ default_organization_id: orgId })
      .eq('id', profile.id)

    if (error) return { error: 'Failed to switch organization' }

    return { success: true }
  } catch {
    return { error: 'Something went wrong. Please try again.' }
  }
}
