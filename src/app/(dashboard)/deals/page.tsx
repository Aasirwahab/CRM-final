'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { getDeals, createDeal, type DealRow } from './actions'

const STAGE_LABELS: Record<string, string> = {
  imported: 'Imported', researched: 'Researched', qualified: 'Qualified',
  contacted: 'Contacted', replied: 'Replied', meeting_booked: 'Meeting Booked',
  proposal_sent: 'Proposal Sent', negotiation: 'Negotiation',
  won: 'Won', lost: 'Lost', nurture: 'Nurture',
}

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  won: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  lost: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
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
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deals</h1>
          <p className="text-sm text-muted-foreground">
            {deals.length} deals &middot; Total value: ${totalValue.toLocaleString()}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Deal'}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-lg border p-4 space-y-3">
          <input
            type="text"
            placeholder="Deal title..."
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            autoFocus
          />
          <div className="flex gap-3">
            <input
              type="number"
              placeholder="Value ($)"
              value={newValue}
              onChange={e => setNewValue(e.target.value)}
              className="h-8 w-32 rounded-md border bg-background px-2 text-sm"
            />
            <input
              type="date"
              value={newClose}
              onChange={e => setNewClose(e.target.value)}
              className="h-8 rounded-md border bg-background px-2 text-sm"
            />
            <Button size="sm" onClick={handleCreate} disabled={!newTitle.trim() || saving}>
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
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
              filter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Deals table */}
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : deals.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          No deals yet. Create one to get started.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Deal</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Company</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Stage</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Value</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Close Date</th>
              </tr>
            </thead>
            <tbody>
              {deals.map(deal => (
                <tr key={deal.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium">{deal.title}</p>
                    {deal.contact_name && (
                      <p className="text-xs text-muted-foreground">{deal.contact_name}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{deal.company_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs capitalize">{STAGE_LABELS[deal.stage] ?? deal.stage}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {deal.value != null ? `$${Number(deal.value).toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[deal.status] ?? ''}`}>
                      {deal.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
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
