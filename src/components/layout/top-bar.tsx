'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Org = { id: string; name: string; slug: string; role: string }
type Profile = { id: string; fullName: string | null; avatarUrl: string | null }

export function TopBar({
  profile,
  orgs,
  activeOrgId,
}: {
  profile: Profile
  orgs: Org[]
  activeOrgId: string
}) {
  const [orgMenuOpen, setOrgMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const activeOrg = orgs.find((o) => o.id === activeOrgId)

  async function switchOrg(orgId: string) {
    setOrgMenuOpen(false)

    await supabase
      .from('profiles')
      .update({ default_organization_id: orgId })
      .eq('id', profile.id)

    router.refresh()
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/sign-in'
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
      <div className="relative">
        <button
          onClick={() => setOrgMenuOpen(!orgMenuOpen)}
          className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent"
        >
          {activeOrg?.name ?? 'Select org'}
          <svg className="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {orgMenuOpen && (
          <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-md border bg-popover p-1 shadow-md">
            {orgs.map((org) => (
              <button
                key={org.id}
                onClick={() => switchOrg(org.id)}
                className={`flex w-full items-center rounded-sm px-3 py-2 text-sm hover:bg-accent ${
                  org.id === activeOrgId ? 'bg-accent font-medium' : ''
                }`}
              >
                <span className="truncate">{org.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{org.role}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {profile.fullName}
        </span>
        <button
          onClick={handleSignOut}
          className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
