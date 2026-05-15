'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Search, Bell, LogOut, ChevronRight, User } from 'lucide-react'

type Org = { id: string; name: string; slug: string; role: string }
type Profile = { id: string; fullName: string | null; avatarUrl: string | null }

const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  leads: 'Leads',
  pipeline: 'Pipeline',
  deals: 'Deals',
  tasks: 'Tasks',
  calendar: 'Calendar',
  projects: 'Projects',
  'lead-forms': 'Lead Forms',
  import: 'Import',
  settings: 'Settings',
  tables: 'Tables',
  trash: 'Trash',
  onboarding: 'Onboarding',
}

export function TopBar({
  profile,
  orgs,
  activeOrgId,
}: {
  profile: Profile
  orgs: Org[]
  activeOrgId: string
}) {
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs = segments
    .map((seg) => ({ label: BREADCRUMB_LABELS[seg] || seg, href: '/' + seg }))
    .slice(0, 2)

  const initials = profile.fullName
    ? profile.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/sign-in'
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card/80 px-5 backdrop-blur-sm">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <div key={crumb.href} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-3.5 text-muted-foreground/50" />}
            {i < breadcrumbs.length - 1 ? (
              <Link
                href={crumb.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="font-medium text-foreground">
                {crumb.label}
              </span>
            )}
          </div>
        ))}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Quick search */}
        <button className="flex h-8 items-center gap-2 rounded-lg border bg-muted/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted">
          <Search className="size-3.5" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="ml-2 hidden rounded bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/60 sm:inline">
            Ctrl K
          </kbd>
        </button>

        {/* Notifications */}
        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <Bell className="size-4" />
        </button>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-muted"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
              {initials}
            </div>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border bg-popover p-1.5 shadow-xl">
              <div className="border-b px-3 py-2.5">
                <p className="text-sm font-medium">{profile.fullName}</p>
                <p className="text-xs text-muted-foreground">
                  {orgs.find((o) => o.id === activeOrgId)?.name}
                </p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { setUserMenuOpen(false); router.push('/settings') }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <User className="size-4" />
                  Profile & Settings
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOut className="size-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
