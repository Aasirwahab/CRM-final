'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { getDeals, createDeal, type DealRow } from './actions'
import { Plus, DollarSign } from 'lucide-react'

const STAGE_LABELS: Record<string, string> = {
  imported: 'Imported', researched: 'Researched', qualified: 'Qualified',
  contacted: 'Contacted', replied: 'Replied', meeting_booked: 'Meeting Booked',
  proposal_sent: 'Proposal Sent', negotiation: 'Negotiation',
  won: 'Won', lost: 'Lost', nurture: 'Nurture',
}

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-blue-50 text-blue-600 ring-blue-500/20 dark:bg-blue-950/40 dark:text-blue-400',
  won: 'bg-emerald-50 text-emerald-600 ring-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-400',
  lost: 'bg-red-50 text-red-600 ring-red-500/20 dark:bg-red-950/40 dark:text-red-400',
}

export default function DealsPage() {
  const [deals, setDeals] = useState<DealRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newClose, setNewClose] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const result = await getDeals({ status: filter || undefined })
    setDeals(result.deals)
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  async function handleCreate() {
    if (!newTitle.trim()) return
    setSaving(true)
    await createDeal({
      title: newTitle.trim(),
      value: newValue ? parseFloat(newValue) : undefined,
      expected_close_date: newClose || undefined,
    })
    setNewTitle('')
    setNewValue('')
    setNewClose('')
    setShowForm(false)
    setSaving(false)
    await load()
  }

  const totalValue = deals.reduce((sum, d) => sum + (d.value ?? 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deals</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {deals.length} deals &middot; Total value: ${totalValue.toLocaleString()}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="size-4" data-icon="inline-start" />
          {showForm ? 'Cancel' : 'New Deal'}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <input
            type="text"
            placeholder="Deal title..."
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            autoFocus
          />
          <div className="flex gap-3">
            <div className="relative">
              <DollarSign className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
              <input
                type="number"
                placeholder="Value"
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                className="h-9 w-32 rounded-lg border bg-background pl-7 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <input
              type="date"
              value={newClose}
              onChange={e => setNewClose(e.target.value)}
              className="h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
            <Button onClick={handleCreate} disabled={!newTitle.trim() || saving}>
              {saving ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        {['', 'open', 'won', 'lost'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium capitalize transition-all duration-150 ${
              filter === s
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Deals table */}
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-primary/30 border-t-primary" />
        </div>
      ) : deals.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <DollarSign className="size-5 text-muted-foreground" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">No deals yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Deal</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Company</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Stage</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">Value</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Close Date</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal, idx) => (
                <tr key={deal.id} className={`border-b last:border-0 transition-colors hover:bg-muted/30 ${idx % 2 === 0 ? '' : 'bg-muted/10'}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                        {deal.title[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{deal.title}</p>
                        {deal.contact_name && (
                          <p className="text-xs text-muted-foreground">{deal.contact_name}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{deal.company_name ?? '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs capitalize">{STAGE_LABELS[deal.stage] ?? deal.stage}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono">
                    {deal.value != null ? `$${Number(deal.value).toLocaleString()}` : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`badge capitalize ${STATUS_STYLES[deal.status] ?? ''}`}>
                      {deal.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
