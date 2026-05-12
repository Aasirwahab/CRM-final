'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Kanban,
  Handshake,
  CheckSquare,
  Calendar,
  FolderKanban,
  FileInput,
  Upload,
  Settings,
  ChevronDown,
  Sparkles,
  Search,
} from 'lucide-react'
import { useState } from 'react'

type Org = { id: string; name: string; slug: string; role: string }

const MAIN_NAV = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Leads', href: '/leads', icon: Users },
  { label: 'Pipeline', href: '/pipeline', icon: Kanban },
  { label: 'Deals', href: '/deals', icon: Handshake },
]

const MANAGE_NAV = [
  { label: 'Tasks', href: '/tasks', icon: CheckSquare },
  { label: 'Calendar', href: '/calendar', icon: Calendar },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
]

const DATA_NAV = [
  { label: 'Lead Forms', href: '/lead-forms', icon: FileInput },
  { label: 'Import', href: '/import', icon: Upload },
]

function NavSection({ label, items, pathname }: { label: string; items: typeof MAIN_NAV; pathname: string }) {
  return (
    <div className="space-y-0.5">
      <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
        {label}
      </p>
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex h-8 items-center gap-2.5 rounded-lg px-3 text-[13px] font-medium transition-all duration-150 ${
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            }`}
          >
            <Icon className={`size-4 shrink-0 transition-colors ${isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/40 group-hover:text-sidebar-foreground/60'}`} />
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}

export function Sidebar({ orgs, activeOrgId }: { orgs: Org[]; activeOrgId: string }) {
  const pathname = usePathname()
  const [orgOpen, setOrgOpen] = useState(false)
  const activeOrg = orgs.find((o) => o.id === activeOrgId)

  return (
    <aside className="hidden w-[220px] shrink-0 flex-col bg-sidebar lg:flex">
      {/* Brand + org switcher */}
      <div className="flex flex-col gap-2 px-3 pt-4 pb-2">
        <div className="flex items-center gap-2 px-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sidebar-primary">
            <Sparkles className="size-3.5 text-sidebar-primary-foreground" />
          </div>
          <span className="text-sm font-bold tracking-tight text-sidebar-foreground">LeadFlow</span>
        </div>

        {/* Org switcher */}
        <div className="relative">
          <button
            onClick={() => setOrgOpen(!orgOpen)}
            className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          >
            <span className="truncate">{activeOrg?.name ?? 'Select org'}</span>
            <ChevronDown className={`size-3 transition-transform ${orgOpen ? 'rotate-180' : ''}`} />
          </button>

          {orgOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-sidebar-border bg-sidebar p-1 shadow-xl">
              {orgs.map((org) => (
                <button
                  key={org.id}
                  onClick={() => setOrgOpen(false)}
                  className={`flex w-full items-center rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                    org.id === activeOrgId
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  }`}
                >
                  <span className="truncate">{org.name}</span>
                  <span className="ml-auto text-[10px] text-sidebar-foreground/30">{org.role}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search shortcut */}
      <div className="px-3 pb-2">
        <button className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border/50 bg-sidebar-accent/30 px-2.5 py-1.5 text-xs text-sidebar-foreground/40 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground/60">
          <Search className="size-3.5" />
          <span>Search...</span>
          <kbd className="ml-auto rounded bg-sidebar-accent px-1.5 py-0.5 font-mono text-[10px] text-sidebar-foreground/30">
            /
          </kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-2 py-2">
        <NavSection label="Overview" items={MAIN_NAV} pathname={pathname} />
        <NavSection label="Manage" items={MANAGE_NAV} pathname={pathname} />
        <NavSection label="Data" items={DATA_NAV} pathname={pathname} />
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-2 py-2">
        <Link
          href="/settings"
          className={`group flex h-8 items-center gap-2.5 rounded-lg px-3 text-[13px] font-medium transition-all duration-150 ${
            pathname.startsWith('/settings')
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
          }`}
        >
          <Settings className={`size-4 shrink-0 ${pathname.startsWith('/settings') ? 'text-sidebar-primary' : 'text-sidebar-foreground/40 group-hover:text-sidebar-foreground/60'}`} />
          Settings
        </Link>
      </div>
    </aside>
  )
}
