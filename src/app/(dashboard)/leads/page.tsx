'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { getLeads, exportLeadsCSV, type LeadRow } from './actions'
import Link from 'next/link'

const QUALITY_STYLES: Record<string, string> = {
  hot: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  warm: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  cold: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
}

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  contacted: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  qualified: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  unqualified: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  nurture: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  converted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  lost: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const PAGE_SIZE = 25

export default function LeadsPage() {
  const router = useRouter()
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

  // Debounce search
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

  function SortIcon({ col }: { col: string }) {
    if (sortBy !== col) return null
    return <span className="ml-1">{sortDesc ? '↓' : '↑'}</span>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">{total} total leads</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={exporting || total === 0}
            onClick={async () => {
              setExporting(true)
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
              }
              setExporting(false)
            }}
          >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
          <Link href="/import">
            <Button>Import CSV</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search by company, contact, or email..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className="h-8 w-72 rounded-md border bg-background px-3 text-sm placeholder:text-muted-foreground"
        />
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(0) }}
          className="h-8 rounded-md border bg-background px-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="unqualified">Unqualified</option>
          <option value="nurture">Nurture</option>
          <option value="converted">Converted</option>
          <option value="lost">Lost</option>
        </select>
        <select
          value={qualityFilter}
          onChange={e => { setQualityFilter(e.target.value); setPage(0) }}
          className="h-8 rounded-md border bg-background px-2 text-sm"
        >
          <option value="">All Quality</option>
          <option value="hot">Hot</option>
          <option value="warm">Warm</option>
          <option value="cold">Cold</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th
                className="cursor-pointer px-4 py-2 text-left text-xs font-medium text-muted-foreground hover:text-foreground"
                onClick={() => handleSort('created_at')}
              >
                Company / Contact<SortIcon col="created_at" />
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Email</th>
              <th
                className="cursor-pointer px-4 py-2 text-left text-xs font-medium text-muted-foreground hover:text-foreground"
                onClick={() => handleSort('status')}
              >
                Status<SortIcon col="status" />
              </th>
              <th
                className="cursor-pointer px-4 py-2 text-left text-xs font-medium text-muted-foreground hover:text-foreground"
                onClick={() => handleSort('lead_quality')}
              >
                Quality<SortIcon col="lead_quality" />
              </th>
              <th
                className="cursor-pointer px-4 py-2 text-right text-xs font-medium text-muted-foreground hover:text-foreground"
                onClick={() => handleSort('lead_score')}
              >
                Score<SortIcon col="lead_score" />
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Source</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  {search || statusFilter || qualityFilter
                    ? 'No leads match your filters.'
                    : 'No leads yet. Import a CSV to get started.'}
                </td>
              </tr>
            ) : (
              leads.map(lead => (
                <tr key={lead.id} className="cursor-pointer border-b last:border-0 hover:bg-muted/30" onClick={() => router.push(`/leads/${lead.id}`)}>
                  <td className="px-4 py-3">
                    <div>
                      {lead.company_name && (
                        <p className="font-medium">{lead.company_name}</p>
                      )}
                      {lead.contact_name && (
                        <p className="text-xs text-muted-foreground">{lead.contact_name}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {lead.contact_email ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[lead.status] ?? ''}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${QUALITY_STYLES[lead.lead_quality] ?? ''}`}>
                      {lead.lead_quality}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{lead.lead_score}</td>
                  <td className="px-4 py-3 text-muted-foreground">{lead.source ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
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
