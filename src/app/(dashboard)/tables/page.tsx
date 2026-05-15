'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { getTables, createTable, archiveTable, type CustomTableRow } from './actions'
import { Plus, Table2, Trash2 } from 'lucide-react'

const COLOR_OPTIONS = [
  { value: 'blue', bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-600 dark:text-blue-400' },
  { value: 'emerald', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400' },
  { value: 'violet', bg: 'bg-violet-50 dark:bg-violet-950/40', text: 'text-violet-600 dark:text-violet-400' },
  { value: 'amber', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400' },
  { value: 'rose', bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-600 dark:text-rose-400' },
]

function getColorClasses(color: string | null) {
  return COLOR_OPTIONS.find(c => c.value === color) ?? COLOR_OPTIONS[0]
}

export default function TablesHubPage() {
  const router = useRouter()
  const [tables, setTables] = useState<CustomTableRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newColor, setNewColor] = useState('blue')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const result = await getTables()
    setTables(result.tables)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCreate() {
    if (!newName.trim()) return
    setSaving(true)
    setError(null)
    const result = await createTable({
      name: newName.trim(),
      description: newDesc.trim() || undefined,
      color: newColor,
    })
    if (result.error) {
      setError(result.error)
      setSaving(false)
      return
    }
    setNewName('')
    setNewDesc('')
    setNewColor('blue')
    setShowForm(false)
    setSaving(false)
    if (result.slug) {
      router.push(`/tables/${result.slug}`)
    }
  }

  async function handleArchive(e: React.MouseEvent, tableId: string) {
    e.stopPropagation()
    if (!confirm('Archive this table? It can be restored later.')) return
    await archiveTable(tableId)
    await load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tables</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {tables.length} table{tables.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="size-4" data-icon="inline-start" />
          {showForm ? 'Cancel' : 'New Table'}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <input
            type="text"
            placeholder="Table name..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            autoFocus
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">Color:</span>
            <div className="flex gap-1.5">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setNewColor(c.value)}
                  className={`h-6 w-6 rounded-full ${c.bg} border-2 transition-all ${
                    newColor === c.value ? 'border-foreground scale-110' : 'border-transparent'
                  }`}
                />
              ))}
            </div>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex justify-end">
            <Button onClick={handleCreate} disabled={!newName.trim() || saving}>
              {saving ? 'Creating...' : 'Create Table'}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-primary/30 border-t-primary" />
        </div>
      ) : tables.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Table2 className="size-5 text-muted-foreground" />
          </div>
          <p className="mt-3 text-sm font-medium">No tables yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Create a table to start organizing your data.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map(table => {
            const colors = getColorClasses(table.color)
            return (
              <div
                key={table.id}
                onClick={() => router.push(`/tables/${table.slug}`)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && router.push(`/tables/${table.slug}`)}
                className="group relative cursor-pointer rounded-xl border bg-card p-5 text-left transition-all hover:shadow-md hover:border-foreground/10"
              >
                <div className="flex items-start justify-between">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colors.bg}`}>
                    <Table2 className={`size-4 ${colors.text}`} />
                  </div>
                  <button
                    onClick={(e) => handleArchive(e, table.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity rounded-md p-1 hover:bg-destructive/10"
                  >
                    <Trash2 className="size-3.5 text-destructive" />
                  </button>
                </div>
                <h3 className="mt-3 text-sm font-semibold">{table.name}</h3>
                {table.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{table.description}</p>
                )}
                <div className="mt-3 flex gap-3 text-[11px] text-muted-foreground">
                  <span>{table.column_count} column{table.column_count !== 1 ? 's' : ''}</span>
                  <span>&middot;</span>
                  <span>{table.row_count} row{table.row_count !== 1 ? 's' : ''}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
