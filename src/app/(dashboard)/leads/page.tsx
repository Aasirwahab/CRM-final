'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { getLeads, getLeadMetrics, exportLeadsCSV, inlineUpdateLead, type LeadRow } from './actions'
import Link from 'next/link'
import { Search, Download, Upload, ArrowUpDown, UserPlus, Target, Flame, BarChart3 } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

type BadgeTone = React.ComponentProps<typeof Badge>['tone']

const QUALITY_TONE: Record<string, BadgeTone> = {
  hot: 'red',
  warm: 'orange',
  cold: 'indigo',
}

const STATUS_TONE: Record<string, BadgeTone> = {
  new: 'blue',
  contacted: 'purple',
  qualified: 'emerald',
  unqualified: 'neutral',
  nurture: 'amber',
  converted: 'emerald',
  lost: 'red',
}

const FILTER_TABS = [
  { value: '', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'nurture', label: 'Nurture' },
  { value: 'converted', label: 'Converted' },
  { value: 'lost', label: 'Lost' },
]

const PAGE_SIZE = 25

export default function LeadsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [leads, setLeads] = useState<LeadRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [qualityFilter, setQualityFilter] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDesc, setSortDesc] = useState(true)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null)
  const [metrics, setMetrics] = useState<{ newLeads: number; qualifiedLeads: number; hotLeads: number; avgScore: number } | null>(null)

  useEffect(() => {
    getLeadMetrics().then(setMetrics)
  }, [])

  const loadLeads = useCallback(async () => {
    setLoading(true)
    const result = await getLeads({
      page,
      pageSize: PAGE_SIZE,
      search: search || undefined,
      status: statusFilter || undefined,
      quality: qualityFilter || undefined,
      sortBy,
      sortDesc,
    })
    setLeads(result.leads)
    setTotal(result.total)
    setLoading(false)
  }, [page, search, statusFilter, qualityFilter, sortBy, sortDesc])

  useEffect(() => {
    loadLeads()
  }, [loadLeads])

  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(0)
    }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  function handleSort(col: string) {
    if (sortBy === col) {
      setSortDesc(!sortDesc)
    } else {
      setSortBy(col)
      setSortDesc(true)
    }
    setPage(0)
  }

  function SortIndicator({ col }: { col: string }) {
    if (sortBy !== col) return <ArrowUpDown className="ml-1 inline size-3 text-muted-foreground/30" />
    return <span className="ml-1 text-primary">{sortDesc ? '↓' : '↑'}</span>
  }

  const metricCards = metrics ? [
    {
      label: 'New Leads',
      value: metrics.newLeads,
      icon: UserPlus,
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
    },
    {
      label: 'Qualified',
      value: metrics.qualifiedLeads,
      icon: Target,
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
    },
    {
      label: 'Hot Leads',
      value: metrics.hotLeads,
      icon: Flame,
      iconBg: 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400',
    },
    {
      label: 'Avg Score',
      value: metrics.avgScore,
      icon: BarChart3,
      iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400',
    },
  ] : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{total} total leads</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={exporting || total === 0}
            onClick={async () => {
              setExporting(true)
              try {
                const result = await exportLeadsCSV({
                  search: search || undefined,
                  status: statusFilter || undefined,
                  quality: qualityFilter || undefined,
                })
                if (result.csv) {
                  const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `leadflow-export-${new Date().toISOString().slice(0, 10)}.csv`
                  a.click()
                  URL.revokeObjectURL(url)
                  if (result.capped) {
                    toast({
                      variant: 'info',
                      title: 'Export capped',
                      description: `Exported ${result.count.toLocaleString()} of ${result.total.toLocaleString()} leads. Apply filters to narrow results.`,
                    })
                  } else {
                    toast({
                      variant: 'success',
                      title: 'Export ready',
                      description: `${result.count.toLocaleString()} leads downloaded.`,
                    })
                  }
                } else {
                  toast({ variant: 'error', title: 'Export failed', description: 'No data was returned.' })
                }
              } catch {
                toast({ variant: 'error', title: 'Export failed', description: 'Something went wrong. Please try again.' })
              } finally {
                setExporting(false)
              }
            }}
          >
            <Download className="size-4" data-icon="inline-start" />
            {exporting ? 'Exporting...' : 'Export'}
          </Button>
          <Link href="/import">
            <Button>
              <Upload className="size-4" data-icon="inline-start" />
              Import CSV
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics bar */}
      {metricCards && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {metricCards.map(m => {
            const Icon = m.icon
            return (
              <div key={m.label} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3.5">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${m.iconBg}`}>
                  <Icon className="size-[16px]" />
                </div>
                <div>
                  <p className="text-lg font-bold leading-none tracking-tight">{m.value}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{m.label}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Filter tabs + search + quality */}
      <div className="space-y-3">
        {/* Status tabs */}
        <div className="flex items-center gap-1 overflow-x-auto border-b">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => { setStatusFilter(tab.value); setPage(0) }}
              className={`relative shrink-0 px-3.5 py-2 text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {statusFilter === tab.value && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Search + quality filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              type="text"
              placeholder="Search by company, contact, or email..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-72 pl-9"
            />
          </div>
          <Select
            value={qualityFilter}
            onChange={e => { setQualityFilter(e.target.value); setPage(0) }}
          >
            <option value="">All Quality</option>
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cold">Cold</option>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th
                className="cursor-pointer px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => handleSort('created_at')}
              >
                Customer<SortIndicator col="created_at" />
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</th>
              <th
                className="cursor-pointer px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => handleSort('status')}
              >
                Status<SortIndicator col="status" />
              </th>
              <th
                className="cursor-pointer px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => handleSort('lead_quality')}
              >
                Quality<SortIndicator col="lead_quality" />
              </th>
              <th
                className="cursor-pointer px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => handleSort('lead_score')}
              >
                Score<SortIndicator col="lead_score" />
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Source</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5"><Skeleton className="h-3.5 w-40" /></td>
                  <td className="px-5 py-3.5"><Skeleton className="h-5 w-16 rounded-full" /></td>
                  <td className="px-5 py-3.5"><Skeleton className="h-5 w-14 rounded-full" /></td>
                  <td className="px-5 py-3.5"><Skeleton className="ml-auto h-2 w-24" /></td>
                  <td className="px-5 py-3.5"><Skeleton className="h-3.5 w-16" /></td>
                  <td className="px-5 py-3.5"><Skeleton className="h-3.5 w-20" /></td>
                </tr>
              ))
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center text-muted-foreground">
                  {search || statusFilter || qualityFilter
                    ? 'No leads match your filters.'
                    : 'No leads yet. Import a CSV to get started.'}
                </td>
              </tr>
            ) : (
              leads.map(lead => {
                const leadLabel = lead.company_name || lead.contact_name || 'lead'
                return (
                <tr
                  key={lead.id}
                  role="link"
                  tabIndex={0}
                  aria-label={`Open ${leadLabel}`}
                  onClick={() => router.push(`/leads/${lead.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      router.push(`/leads/${lead.id}`)
                    }
                  }}
                  className="cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/20 focus:outline-none focus-visible:bg-muted/30 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {(lead.company_name || lead.contact_name || '?')[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        {lead.company_name && (
                          <p className="truncate font-medium">{lead.company_name}</p>
                        )}
                        {lead.contact_name && (
                          <p className="truncate text-xs text-muted-foreground">{lead.contact_name}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {lead.contact_email ?? '—'}
                  </td>
                  <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                    {editingCell?.id === lead.id && editingCell?.field === 'status' ? (
                      <Select
                        autoFocus
                        defaultValue={lead.status}
                        className="h-7 px-1.5 text-xs"
                        onChange={async (e) => {
                          const newVal = e.target.value
                          const prevVal = lead.status
                          setEditingCell(null)
                          setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: newVal } : l))
                          const res = await inlineUpdateLead(lead.id, 'status', newVal)
                          if (res.error) {
                            setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: prevVal } : l))
                            toast({ variant: 'error', title: 'Could not update status', description: res.error })
                          }
                        }}
                        onBlur={() => setEditingCell(null)}
                      >
                        {['new','contacted','qualified','unqualified','nurture','converted','lost'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </Select>
                    ) : (
                      <Badge
                        tone={STATUS_TONE[lead.status]}
                        className="cursor-pointer capitalize hover:opacity-80"
                        onClick={(e) => { e.stopPropagation(); setEditingCell({ id: lead.id, field: 'status' }) }}
                      >
                        {lead.status}
                      </Badge>
                    )}
                  </td>
                  <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                    {editingCell?.id === lead.id && editingCell?.field === 'quality' ? (
                      <Select
                        autoFocus
                        defaultValue={lead.lead_quality}
                        className="h-7 px-1.5 text-xs"
                        onChange={async (e) => {
                          const newVal = e.target.value
                          const prevVal = lead.lead_quality
                          setEditingCell(null)
                          setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, lead_quality: newVal } : l))
                          const res = await inlineUpdateLead(lead.id, 'lead_quality', newVal)
                          if (res.error) {
                            setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, lead_quality: prevVal } : l))
                            toast({ variant: 'error', title: 'Could not update quality', description: res.error })
                          }
                        }}
                        onBlur={() => setEditingCell(null)}
                      >
                        {['hot','warm','cold'].map(q => (
                          <option key={q} value={q}>{q}</option>
                        ))}
                      </Select>
                    ) : (
                      <Badge
                        tone={QUALITY_TONE[lead.lead_quality]}
                        className="cursor-pointer capitalize hover:opacity-80"
                        onClick={(e) => { e.stopPropagation(); setEditingCell({ id: lead.id, field: 'quality' }) }}
                      >
                        {lead.lead_quality}
                      </Badge>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <ScoreBar score={lead.lead_score} />
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{lead.source ?? '—'}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </td>
                </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(score, 100)
  const color =
    pct >= 70 ? 'bg-emerald-500' :
    pct >= 40 ? 'bg-amber-500' :
    'bg-red-400'

  return (
    <div className="flex items-center justify-end gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-7 text-right font-mono text-xs text-muted-foreground">{score}</span>
    </div>
  )
}
