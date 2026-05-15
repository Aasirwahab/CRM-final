'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  getTableBySlug,
  getRowById,
  updateRow,
  archiveRow,
  type CustomColumnRow,
  type CustomDataRow,
} from '../../actions'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'

export default function RowDetailPage({
  params,
}: {
  params: Promise<{ slug: string; rowId: string }>
}) {
  const { slug, rowId } = use(params)
  const router = useRouter()

  const [columns, setColumns] = useState<CustomColumnRow[]>([])
  const [row, setRow] = useState<CustomDataRow | null>(null)
  const [tableName, setTableName] = useState('')
  const [tableId, setTableId] = useState('')
  const [cells, setCells] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function load() {
    const tableResult = await getTableBySlug(slug)
    if (!tableResult.table) {
      router.push('/tables')
      return
    }
    setTableName(tableResult.table.name)
    setTableId(tableResult.table.id)
    setColumns(tableResult.table.columns)

    const rowResult = await getRowById(tableResult.table.id, rowId)
    if (!rowResult.row) {
      router.push(`/tables/${slug}`)
      return
    }
    setRow(rowResult.row)
    setCells(rowResult.row.cells ?? {})
    setLoading(false)
  }

  useEffect(() => { load() }, [slug, rowId])

  async function handleSave() {
    if (!row) return
    setSaving(true)
    setError(null)
    setSaved(false)

    const result = await updateRow(row.id, {
      cells,
      version: row.version,
    })

    if (result.error) {
      setError(result.error)
      setSaving(false)
      return
    }

    setSaved(true)
    setSaving(false)
    // Reload to get new version number
    await load()
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleDelete() {
    if (!row) return
    if (!confirm('Archive this row?')) return
    await archiveRow(row.id)
    router.push(`/tables/${slug}`)
  }

  function renderInput(col: CustomColumnRow) {
    const val = cells[col.key] ?? ''

    switch (col.field_type) {
      case 'checkbox':
        return (
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={!!cells[col.key]}
              onChange={e => setCells(prev => ({ ...prev, [col.key]: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm">{cells[col.key] ? 'Yes' : 'No'}</span>
          </label>
        )
      case 'single_select': {
        const choices = (col.options as any)?.choices ?? []
        return (
          <select
            value={String(val)}
            onChange={e => setCells(prev => ({ ...prev, [col.key]: e.target.value }))}
            className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
          >
            <option value="">Select...</option>
            {choices.map((c: string) => <option key={c} value={c}>{c}</option>)}
          </select>
        )
      }
      case 'number':
        return (
          <input
            type="number"
            value={String(val)}
            onChange={e => setCells(prev => ({ ...prev, [col.key]: e.target.value ? Number(e.target.value) : '' }))}
            className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        )
      case 'date':
        return (
          <input
            type="date"
            value={String(val)}
            onChange={e => setCells(prev => ({ ...prev, [col.key]: e.target.value }))}
            className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        )
      default:
        return (
          <input
            type={col.field_type === 'email' ? 'email' : col.field_type === 'url' ? 'url' : col.field_type === 'phone' ? 'tel' : 'text'}
            value={String(val)}
            onChange={e => setCells(prev => ({ ...prev, [col.key]: e.target.value }))}
            className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        )
    }
  }

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-primary/30 border-t-primary" />
      </div>
    )
  }

  if (!row) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/tables/${slug}`} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="size-4 text-muted-foreground" />
          </Link>
          <div>
            <p className="text-xs text-muted-foreground">{tableName}</p>
            <h1 className="text-xl font-bold tracking-tight">Edit Row</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="size-4" data-icon="inline-start" />
            Archive
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="size-4" data-icon="inline-start" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Status messages */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}
      {saved && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
          Changes saved.
        </div>
      )}

      {/* Edit form */}
      <div className="rounded-xl border bg-card p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          {columns.map(col => (
            <div key={col.id}>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {col.name}
                {col.is_required && <span className="text-destructive ml-0.5">*</span>}
              </label>
              {renderInput(col)}
            </div>
          ))}
        </div>
      </div>

      {/* Metadata */}
      <div className="rounded-xl border bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-3">Details</p>
        <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
          <div>
            <span className="font-medium text-foreground">Created</span>
            <p>{new Date(row.created_at).toLocaleString()}</p>
          </div>
          <div>
            <span className="font-medium text-foreground">Updated</span>
            <p>{new Date(row.updated_at).toLocaleString()}</p>
          </div>
          <div>
            <span className="font-medium text-foreground">Version</span>
            <p>{row.version}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
