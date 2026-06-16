'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast'
import { getDeals, createDeal, updateDeal, deleteDeal, type DealRow } from './actions'
import { Plus, DollarSign, Pencil, Trash2, X } from 'lucide-react'

const STAGE_LABELS: Record<string, string> = {
  imported: 'Imported', researched: 'Researched', qualified: 'Qualified',
  contacted: 'Contacted', replied: 'Replied', meeting_booked: 'Meeting Booked',
  proposal_sent: 'Proposal Sent', negotiation: 'Negotiation',
  won: 'Won', lost: 'Lost', nurture: 'Nurture',
}

type BadgeTone = React.ComponentProps<typeof Badge>['tone']

const STATUS_TONE: Record<string, BadgeTone> = {
  open: 'blue',
  won: 'emerald',
  lost: 'red',
}

export default function DealsPage() {
  const confirm = useConfirm()
  const { toast } = useToast()
  const [deals, setDeals] = useState<DealRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newClose, setNewClose] = useState('')
  const [saving, setSaving] = useState(false)

  const [editDeal, setEditDeal] = useState<DealRow | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editValue, setEditValue] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editClose, setEditClose] = useState('')
  const [editSaving, setEditSaving] = useState(false)

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

  function openEdit(deal: DealRow) {
    setEditDeal(deal)
    setEditTitle(deal.title)
    setEditValue(deal.value != null ? String(deal.value) : '')
    setEditStatus(deal.status)
    setEditClose(deal.expected_close_date ?? '')
  }

  async function handleEdit() {
    if (!editDeal || !editTitle.trim()) return
    setEditSaving(true)
    await updateDeal(editDeal.id, {
      title: editTitle.trim(),
      value: editValue ? parseFloat(editValue) : null,
      status: editStatus,
      expected_close_date: editClose || null,
    })
    setEditSaving(false)
    setEditDeal(null)
    await load()
  }

  async function handleDelete(deal: DealRow) {
    const ok = await confirm({
      title: 'Delete deal?',
      description: `“${deal.title}” will be permanently deleted. This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    })
    if (!ok) return
    await deleteDeal(deal.id)
    toast({ variant: 'success', title: 'Deal deleted' })
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
        <Card className="space-y-3 p-5">
          <Input
            type="text"
            placeholder="Deal title..."
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            autoFocus
          />
          <div className="flex gap-3">
            <div className="relative">
              <DollarSign className="absolute left-2.5 top-1/2 z-10 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                type="number"
                placeholder="Value"
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                className="w-32 pl-7"
              />
            </div>
            <Input
              type="date"
              value={newClose}
              onChange={e => setNewClose(e.target.value)}
              className="w-auto"
            />
            <Button onClick={handleCreate} disabled={!newTitle.trim() || saving}>
              {saving ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </Card>
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
        <Card className="divide-y overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="ml-auto h-4 w-20" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          ))}
        </Card>
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
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">Actions</th>
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
                    <Badge tone={STATUS_TONE[deal.status]} className="capitalize">
                      {deal.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(deal)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        title="Edit deal"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(deal)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Delete deal"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditDeal(null)}>
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Edit Deal</h2>
              <button onClick={() => setEditDeal(null)} className="rounded-md p-1 hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Title</label>
                <Input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Value ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-1/2 z-10 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
                  <Input
                    type="number"
                    placeholder="e.g. 50000"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    className="pl-7"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
                <Select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                  className="w-full"
                >
                  <option value="open">Open</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Expected Close Date</label>
                <Input
                  type="date"
                  value={editClose}
                  onChange={e => setEditClose(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDeal(null)} disabled={editSaving}>
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={!editTitle.trim() || editSaving}>
                {editSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
