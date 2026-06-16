'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar, MobileSidebar } from './sidebar'
import { TopBar } from './top-bar'
import { CommandPalette } from './command-palette'

type Org = { id: string; name: string; slug: string; role: string }
type Profile = { id: string; fullName: string | null; avatarUrl: string | null }

export function DashboardChrome({
  orgs,
  activeOrgId,
  profile,
  children,
}: {
  orgs: Org[]
  activeOrgId: string
  profile: Profile
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  // Close the drawer whenever the route changes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false)
  }, [pathname])

  // Close on Escape.
  useEffect(() => {
    if (!mobileOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <CommandPalette />
      <Sidebar orgs={orgs} activeOrgId={activeOrgId} />
      <MobileSidebar
        orgs={orgs}
        activeOrgId={activeOrgId}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          profile={profile}
          orgs={orgs}
          activeOrgId={activeOrgId}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto bg-background p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
