'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Kanban, Handshake, CheckSquare, Calendar,
  FolderKanban, FileInput, Upload, Table2, Settings, Search, CornerDownLeft,
} from 'lucide-react'
import { quickSearchLeads, type LeadSearchResult } from '@/actions/search'

export const OPEN_COMMAND_PALETTE_EVENT = 'open-command-palette'

type Command = { label: string; href: string; icon: typeof Search; keywords?: string }

type Item =
  | { kind: 'page'; cmd: Command }
  | { kind: 'lead'; lead: LeadSearchResult }

const COMMANDS: Command[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, keywords: 'home overview' },
  { label: 'Leads', href: '/leads', icon: Users, keywords: 'contacts people' },
  { label: 'Pipeline', href: '/pipeline', icon: Kanban, keywords: 'stages board' },
  { label: 'Deals', href: '/deals', icon: Handshake, keywords: 'revenue' },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare, keywords: 'todo' },
  { label: 'Calendar', href: '/calendar', icon: Calendar, keywords: 'schedule events' },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Lead Forms', href: '/lead-forms', icon: FileInput, keywords: 'capture' },
  { label: 'Import', href: '/import', icon: Upload, keywords: 'csv upload' },
  { label: 'Tables', href: '/tables', icon: Table2, keywords: 'data' },
  { label: 'Settings', href: '/settings', icon: Settings, keywords: 'preferences profile' },
]

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [leads, setLeads] = useState<LeadSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Open via keyboard (Ctrl/Cmd+K, or "/" when not typing) and via custom event.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => {
          if (!o) {
            setQuery('')
            setActive(0)
            setLeads([])
          }
          return !o
        })
        return
      }
      const target = e.target as HTMLElement | null
      const typing =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      if (e.key === '/' && !typing) {
        e.preventDefault()
        setQuery('')
        setActive(0)
        setLeads([])
        setOpen(true)
      }
    }
    function onOpen() {
      setQuery('')
      setActive(0)
      setLeads([])
      setOpen(true)
    }
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpen)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpen)
    }
  }, [])

  // Focus when opening.
  useEffect(() => {
    if (open) {
      // Focus after the element mounts.
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const pageResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return COMMANDS
    return COMMANDS.filter(
      (c) => c.label.toLowerCase().includes(q) || c.keywords?.toLowerCase().includes(q),
    )
  }, [query])

  // Debounced lead search.
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      const t = setTimeout(() => {
        setLeads([])
        setActive(0)
        setSearching(false)
      }, 0)
      return () => clearTimeout(t)
    }
    const t = setTimeout(async () => {
      const res = await quickSearchLeads(q)
      setLeads(res)
      setActive(0)
      setSearching(false)
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  const items: Item[] = useMemo(
    () => [
      ...pageResults.map((cmd): Item => ({ kind: 'page', cmd })),
      ...leads.map((lead): Item => ({ kind: 'lead', lead })),
    ],
    [pageResults, leads],
  )

  if (!open) return null

  function runItem(item: Item) {
    setOpen(false)
    if (item.kind === 'page') router.push(item.cmd.href)
    else router.push(`/leads/${item.lead.id}`)
  }

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = items[active]
      if (item) runItem(item)
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center p-4 pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setOpen(false)}
        aria-hidden
      />
      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border bg-popover shadow-2xl"
      >
        <div className="flex items-center gap-2.5 border-b px-4">
          <Search className="size-4 shrink-0 text-muted-foreground/60" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              const val = e.target.value
              setQuery(val)
              setActive(0)
              if (val.trim().length >= 2) {
                setSearching(true)
              } else {
                setSearching(false)
              }
            }}
            onKeyDown={onInputKeyDown}
            placeholder="Search pages and actions..."
            className="h-12 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          />
          <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/60">
            Esc
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-1.5">
          {items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              {searching ? 'Searching…' : 'No results found.'}
            </p>
          ) : (
            <>
              {pageResults.length > 0 && (
                <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                  Pages
                </p>
              )}
              {pageResults.map((cmd) => {
                const i = items.findIndex((it) => it.kind === 'page' && it.cmd.href === cmd.href)
                const Icon = cmd.icon
                const isActive = i === active
                return (
                  <button
                    key={cmd.href}
                    onMouseMove={() => setActive(i)}
                    onClick={() => runItem({ kind: 'page', cmd })}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      isActive ? 'bg-muted text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="flex-1 text-left">{cmd.label}</span>
                    {isActive && <CornerDownLeft className="size-3.5 text-muted-foreground/50" />}
                  </button>
                )
              })}

              {leads.length > 0 && (
                <p className="px-3 pb-1.5 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                  Leads
                </p>
              )}
              {leads.map((lead) => {
                const i = items.findIndex((it) => it.kind === 'lead' && it.lead.id === lead.id)
                const isActive = i === active
                const title = lead.company || lead.contact || lead.email || 'Lead'
                const subtitle = [lead.company ? lead.contact : null, lead.email]
                  .filter(Boolean)
                  .join(' · ')
                return (
                  <button
                    key={lead.id}
                    onMouseMove={() => setActive(i)}
                    onClick={() => runItem({ kind: 'lead', lead })}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      isActive ? 'bg-muted text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                      {title[0]?.toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-foreground">{title}</span>
                      {subtitle && (
                        <span className="block truncate text-xs text-muted-foreground/70">{subtitle}</span>
                      )}
                    </span>
                    {isActive && <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground/50" />}
                  </button>
                )
              })}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
