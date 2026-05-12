'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Org = { id: string; name: string; slug: string; role: string }

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Leads', href: '/leads', icon: 'Users' },
  { label: 'Pipeline', href: '/pipeline', icon: 'Kanban' },
  { label: 'Deals', href: '/deals', icon: 'Handshake' },
  { label: 'Tasks', href: '/tasks', icon: 'CheckSquare' },
  { label: 'Calendar', href: '/calendar', icon: 'Calendar' },
  { label: 'Projects', href: '/projects', icon: 'Folder' },
  { label: 'Lead Forms', href: '/lead-forms', icon: 'FormInput' },
  { label: 'Import', href: '/import', icon: 'Upload' },
  { label: 'Settings', href: '/settings', icon: 'Settings' },
]

export function Sidebar({ orgs, activeOrgId }: { orgs: Org[]; activeOrgId: string }) {
  const pathname = usePathname()

  return (
    <aside className="hidden w-60 shrink-0 border-r bg-sidebar lg:flex lg:flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-lg font-bold text-sidebar-foreground">LeadFlow</span>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-3">
        <p className="truncate text-xs text-sidebar-foreground/50">
          {orgs.find((o) => o.id === activeOrgId)?.name ?? 'No org'}
        </p>
      </div>
    </aside>
  )
}
