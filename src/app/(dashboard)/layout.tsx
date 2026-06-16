import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { DashboardChrome } from '@/components/layout/dashboard-chrome'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in')

  // Use service client to bypass RLS for layout data.
  // Safe: user is already verified via getUser() above.
  const service = createServiceClient()

  const { data: profile } = await service
    .from('profiles')
    .select('id, full_name, avatar_url, default_organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/sign-in')

  const { data: memberships } = await service
    .from('memberships')
    .select('organization_id, role, organizations(id, name, slug)')
    .eq('profile_id', profile.id)
    .eq('status', 'active')

  const orgs = (memberships ?? []).map((m: any) => ({
    id: m.organizations.id,
    name: m.organizations.name,
    slug: m.organizations.slug,
    role: m.role,
  }))

  const activeOrgId = profile.default_organization_id ?? orgs[0]?.id

  return (
    <DashboardChrome
      orgs={orgs}
      activeOrgId={activeOrgId}
      profile={{ id: profile.id, fullName: profile.full_name, avatarUrl: profile.avatar_url }}
    >
      {children}
    </DashboardChrome>
  )
}
