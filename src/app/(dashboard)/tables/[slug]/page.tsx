'use client'

import { useState, useEffect, useRef, useCallback, use, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  getTables,
  getTableBySlug,
  getRows,
  addColumn,
  archiveColumn,
  createRow,
  archiveRow,
  inlineUpdateCell,
  type CustomTableRow,
  type CustomColumnRow,
  type CustomDataRow,
} from '../actions'
import { ImportModal } from '../import-modal'
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Type,
  Hash,
  CalendarDays,
  CheckSquare,
  List,
  Link2,
  Mail,
  Phone,
  Globe,
  Search,
  X,
  MoreHorizontal,
  Grid3X3,
  EyeOff,
  ArrowUpDown,
  Filter,
  Paintbrush,
  LayoutGrid,
  Upload,
  FileSpreadsheet,
} from 'lucide-react'
import { useConfirm } from '@/components/ui/confirm-dialog'

const FIELD_TYPE_META: Record<string, { label: string; icon: typeof Type }> = {
  text: { label: 'Text', icon: Type },
  number: { label: 'Number', icon: Hash },
  date: { label: 'Date', icon: CalendarDays },
  checkbox: { label: 'Checkbox', icon: CheckSquare },
  single_select: { label: 'Select', icon: List },
  url: { label: 'URL', icon: Globe },
  email: { label: 'Email', icon: Mail },
  phone: { label: 'Phone', icon: Phone },
  link_lead: { label: 'Lead', icon: Link2 },
  link_company: { label: 'Company', icon: Link2 },
  link_deal: { label: 'Deal', icon: Link2 },
}

const PAGE_SIZE = 50

type EditingCell = { rowId: string; colKey: string } | null
type SortConfig = { colKey: string; desc: boolean } | null
type FilterConfig = { colKey: string; operator: string; value: string } | null

export default function TableDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const confirm = useConfirm()

  // All tables (for tabs)
  const [allTables, setAllTables] = useState<CustomTableRow[]>([])

  const [table, setTable] = useState<any>(null)
  const [columns, setColumns] = useState<CustomColumnRow[]>([])
  const [rows, setRows] = useState<CustomDataRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Inline editing
  const [editingCell, setEditingCell] = useState<EditingCell>(null)
  const [editValue, setEditValue] = useState<unknown>('')
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null)

  // New row (inline at bottom)
  const [newRowCells, setNewRowCells] = useState<Record<string, unknown>>({})
  const [addingRow, setAddingRow] = useState(false)
  const [rowSaving, setRowSaving] = useState(false)

  // Add column popover
  const [showAddCol, setShowAddCol] = useState(false)
  const [colName, setColName] = useState('')
  const [colType, setColType] = useState('text')
  const [colOptions, setColOptions] = useState('')
  const [colSaving, setColSaving] = useState(false)

  // Column context menu
  const [colMenu, setColMenu] = useState<{ id: string; x: number; y: number } | null>(null)

  // Toolbar state
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set())
  const [showHidePanel, setShowHidePanel] = useState(false)
  const [sortConfig, setSortConfig] = useState<SortConfig>(null)
  const [showSortPanel, setShowSortPanel] = useState(false)
  const [filterConfig, setFilterConfig] = useState<FilterConfig>(null)
  const [showFilterPanel, setShowFilterPanel] = useState(false)

  const [error, setError] = useState<string | null>(null)

  // Import
  const [showAddTabMenu, setShowAddTabMenu] = useState(false)
  const [importType, setImportType] = useState<'csv' | 'excel' | null>(null)
  const addTabRef = useRef<HTMLDivElement>(null)

  const visibleColumns = useMemo(
    () => columns.filter(c => !hiddenCols.has(c.id)),
    [columns, hiddenCols]
  )

  // Sort + filter rows client-side
  const displayRows = useMemo(() => {
    let result = [...rows]

    // Filter
    if (filterConfig && filterConfig.value) {
      result = result.filter(row => {
        const cellVal = String(row.cells[filterConfig.colKey] ?? '').toLowerCase()
        const filterVal = filterConfig.value.toLowerCase()
        switch (filterConfig.operator) {
          case 'contains': return cellVal.includes(filterVal)
          case 'equals': return cellVal === filterVal
          case 'not_empty': return cellVal !== '' && cellVal !== 'undefined' && cellVal !== 'null'
          case 'empty': return cellVal === '' || cellVal === 'undefined' || cellVal === 'null'
          default: return true
        }
      })
    }

    // Sort
    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a.cells[sortConfig.colKey] ?? ''
        const bVal = b.cells[sortConfig.colKey] ?? ''
        const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true })
        return sortConfig.desc ? -cmp : cmp
      })
    }

    return result
  }, [rows, sortConfig, filterConfig])

  async function loadTable() {
    const [tableResult, tablesResult] = await Promise.all([
      getTableBySlug(slug),
      getTables(),
    ])
    if (!tableResult.table) { router.push('/tables'); return }
    setTable(tableResult.table)
    setColumns(tableResult.table.columns)
    setAllTables(tablesResult.tables)
  }

  async function loadRows() {
    if (!table) return
    const result = await getRows(table.id, { page, pageSize: PAGE_SIZE, search: search || undefined })
    setRows(result.rows)
    setTotal(result.total)
  }

  useEffect(() => { loadTable().then(() => setLoading(false)) }, [slug])
  useEffect(() => { if (table) loadRows() }, [table, page, search])

  useEffect(() => {
    if (editingCell && inputRef.current) inputRef.current.focus()
  }, [editingCell])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (addTabRef.current && !addTabRef.current.contains(e.target as Node)) {
        setShowAddTabMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // --- Inline cell editing ---
  function startEdit(rowId: string, col: CustomColumnRow, currentValue: unknown) {
    setEditingCell({ rowId, colKey: col.key })
    setEditValue(currentValue ?? '')
  }

  const commitEdit = useCallback(async () => {
    if (!editingCell) return
    const row = rows.find(r => r.id === editingCell.rowId)
    if (!row) { setEditingCell(null); return }
    const oldValue = row.cells[editingCell.colKey]
    if (editValue === oldValue) { setEditingCell(null); return }
    const result = await inlineUpdateCell(row.id, editingCell.colKey, editValue, row.version)
    if (result.error) setError(result.error)
    else {
      setRows(prev => prev.map(r =>
        r.id === row.id
          ? { ...r, cells: { ...r.cells, [editingCell.colKey]: editValue }, version: result.version! }
          : r
      ))
    }
    setEditingCell(null)
  }, [editingCell, editValue, rows])

  function handleCellKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
    if (e.key === 'Escape') setEditingCell(null)
    if (e.key === 'Tab') { e.preventDefault(); commitEdit() }
  }

  // --- Inline new row ---
  async function handleAddRow() {
    if (!table) return
    setRowSaving(true)
    const result = await createRow(table.id, { cells: newRowCells })
    if (result.error) setError(result.error)
    else { setNewRowCells({}); setAddingRow(false); await loadRows() }
    setRowSaving(false)
  }

  function handleNewRowKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddRow() }
    if (e.key === 'Escape') { setAddingRow(false); setNewRowCells({}) }
  }

  // --- Add column ---
  async function handleAddColumn() {
    if (!colName.trim() || !table) return
    setColSaving(true); setError(null)
    const options = colType === 'single_select' && colOptions.trim()
      ? { choices: colOptions.split(',').map(s => s.trim()).filter(Boolean) }
      : undefined
    const result = await addColumn(table.id, { name: colName.trim(), field_type: colType, options })
    if (result.error) setError(result.error)
    else { setColName(''); setColType('text'); setColOptions(''); setShowAddCol(false); await loadTable() }
    setColSaving(false)
  }

  async function handleArchiveColumn(columnId: string) {
    const ok = await confirm({
      title: 'Archive this column?',
      description: 'Data is preserved and the column can be restored later.',
      confirmLabel: 'Archive',
      variant: 'danger',
    })
    if (!ok) return
    setColMenu(null)
    await archiveColumn(columnId)
    await loadTable(); await loadRows()
  }

  async function handleArchiveRow(e: React.MouseEvent, rowId: string) {
    e.stopPropagation()
    const ok = await confirm({
      title: 'Archive this row?',
      confirmLabel: 'Archive',
      variant: 'danger',
    })
    if (!ok) return
    await archiveRow(rowId); await loadRows()
  }

  function closeAllPanels() { setShowHidePanel(false); setShowSortPanel(false); setShowFilterPanel(false) }

  // --- Render helpers ---
  function renderCellDisplay(value: unknown, col: CustomColumnRow) {
    if (value == null || value === '') return <span className="text-muted-foreground/30">—</span>
    switch (col.field_type) {
      case 'checkbox': return <CheckSquare className={`size-4 ${value ? 'text-primary' : 'text-muted-foreground/30'}`} />
      case 'url': return <span className="text-primary truncate block">{String(value)}</span>
      case 'email': return <span className="text-primary">{String(value)}</span>
      case 'date': return <span>{new Date(String(value)).toLocaleDateString()}</span>
      case 'number': return <span className="font-mono tabular-nums">{Number(value).toLocaleString()}</span>
      case 'single_select':
        return <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{String(value)}</span>
      default: return <span>{String(value)}</span>
    }
  }

  function renderCellEditor(col: CustomColumnRow) {
    const common = 'h-full w-full bg-transparent text-sm outline-none'
    switch (col.field_type) {
      case 'checkbox':
        return <input ref={inputRef as any} type="checkbox" checked={!!editValue} onChange={e => setEditValue(e.target.checked)} onBlur={commitEdit} onKeyDown={handleCellKeyDown} className="size-4 rounded border-primary" />
      case 'single_select': {
        const choices = (col.options as any)?.choices ?? []
        return <select ref={inputRef as any} value={String(editValue ?? '')} onChange={e => setEditValue(e.target.value)} onBlur={commitEdit} onKeyDown={handleCellKeyDown} className={common}><option value="">—</option>{choices.map((c: string) => <option key={c} value={c}>{c}</option>)}</select>
      }
      case 'number':
        return <input ref={inputRef as any} type="number" value={String(editValue ?? '')} onChange={e => setEditValue(e.target.value ? Number(e.target.value) : '')} onBlur={commitEdit} onKeyDown={handleCellKeyDown} className={`${common} font-mono tabular-nums`} />
      case 'date':
        return <input ref={inputRef as any} type="date" value={String(editValue ?? '')} onChange={e => setEditValue(e.target.value)} onBlur={commitEdit} onKeyDown={handleCellKeyDown} className={common} />
      default:
        return <input ref={inputRef as any} type={col.field_type === 'email' ? 'email' : col.field_type === 'url' ? 'url' : col.field_type === 'phone' ? 'tel' : 'text'} value={String(editValue ?? '')} onChange={e => setEditValue(e.target.value)} onBlur={commitEdit} onKeyDown={handleCellKeyDown} className={common} />
    }
  }

  function renderNewRowInput(col: CustomColumnRow) {
    const val = newRowCells[col.key] ?? ''
    const common = 'h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/30'
    switch (col.field_type) {
      case 'checkbox':
        return <input type="checkbox" checked={!!newRowCells[col.key]} onChange={e => setNewRowCells(prev => ({ ...prev, [col.key]: e.target.checked }))} className="size-4 rounded border-primary" />
      case 'single_select': {
        const choices = (col.options as any)?.choices ?? []
        return <select value={String(val)} onChange={e => setNewRowCells(prev => ({ ...prev, [col.key]: e.target.value }))} onKeyDown={handleNewRowKeyDown} className={`${common} text-muted-foreground`}><option value="">—</option>{choices.map((c: string) => <option key={c} value={c}>{c}</option>)}</select>
      }
      case 'number':
        return <input type="number" placeholder="0" value={String(val)} onChange={e => setNewRowCells(prev => ({ ...prev, [col.key]: e.target.value ? Number(e.target.value) : '' }))} onKeyDown={handleNewRowKeyDown} className={`${common} font-mono`} />
      case 'date':
        return <input type="date" value={String(val)} onChange={e => setNewRowCells(prev => ({ ...prev, [col.key]: e.target.value }))} onKeyDown={handleNewRowKeyDown} className={common} />
      default:
        return <input type={col.field_type === 'email' ? 'email' : col.field_type === 'url' ? 'url' : col.field_type === 'phone' ? 'tel' : 'text'} placeholder={col.name} value={String(val)} onChange={e => setNewRowCells(prev => ({ ...prev, [col.key]: e.target.value }))} onKeyDown={handleNewRowKeyDown} className={common} />
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-primary/30 border-t-primary" />
      </div>
    )
  }

  if (!table) return null

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] flex-col -m-6 lg:-m-8">

      {/* ── Table tabs (top bar) ── */}
      <div className="flex items-center gap-0 border-b bg-background overflow-x-auto">
        {allTables.map(t => (
          <Link
            key={t.id}
            href={`/tables/${t.slug}`}
            className={`flex shrink-0 items-center gap-1.5 border-r px-4 py-2.5 text-xs font-medium transition-colors ${
              t.slug === slug
                ? 'bg-background text-foreground border-b-2 border-b-primary'
                : 'bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`}
          >
            {t.name}
            {t.slug === slug && <ChevronDown className="size-3 ml-0.5 text-muted-foreground/50" />}
          </Link>
        ))}
        <div className="relative" ref={addTabRef}>
          <button
            onClick={() => setShowAddTabMenu(!showAddTabMenu)}
            className="flex shrink-0 items-center gap-1 px-3 py-2.5 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            <Plus className="size-3.5" />
          </button>
          {showAddTabMenu && (
            <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-lg border bg-popover p-1 shadow-xl">
              <button
                onClick={() => { setShowAddTabMenu(false); router.push('/tables') }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Plus className="size-3.5" />
                Start from scratch
              </button>
              <button
                onClick={() => { setShowAddTabMenu(false); setImportType('csv') }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Upload className="size-3.5" />
                Import CSV
              </button>
              <button
                onClick={() => { setShowAddTabMenu(false); setImportType('excel') }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <FileSpreadsheet className="size-3.5" />
                Import Excel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Views sidebar + main area ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Views sidebar */}
        <div className="hidden w-48 shrink-0 flex-col border-r bg-muted/20 md:flex">
          <div className="px-3 pt-3 pb-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Views</p>
          </div>
          <div className="flex-1 space-y-0.5 px-1.5">
            <button className="flex w-full items-center gap-2 rounded-md bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary">
              <Grid3X3 className="size-3.5" />
              Grid view
            </button>
          </div>
          <div className="border-t px-3 py-2">
            <button className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors">
              <Plus className="size-3" />
              Create view
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">

          {/* ── Toolbar ── */}
          <div className="flex items-center gap-1 border-b bg-background px-3 py-1.5 overflow-x-auto">
            {/* Hide fields */}
            <div className="relative">
              <button
                onClick={() => { closeAllPanels(); setShowHidePanel(!showHidePanel) }}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                  hiddenCols.size > 0 ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <EyeOff className="size-3.5" />
                Hide fields
                {hiddenCols.size > 0 && <span className="rounded-full bg-primary/20 px-1.5 text-[10px]">{hiddenCols.size}</span>}
              </button>
              {showHidePanel && (
                <div className="absolute left-0 top-full z-30 mt-1 w-56 rounded-lg border bg-popover p-2 shadow-xl">
                  <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Toggle columns</p>
                  {columns.map(col => (
                    <label key={col.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!hiddenCols.has(col.id)}
                        onChange={() => setHiddenCols(prev => {
                          const next = new Set(prev)
                          next.has(col.id) ? next.delete(col.id) : next.add(col.id)
                          return next
                        })}
                        className="rounded"
                      />
                      {col.name}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Filter */}
            <div className="relative">
              <button
                onClick={() => { closeAllPanels(); setShowFilterPanel(!showFilterPanel) }}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                  filterConfig ? 'bg-green-500/10 text-green-700 dark:text-green-400 font-medium' : 'text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <Filter className="size-3.5" />
                {filterConfig ? `Filtered by ${columns.find(c => c.key === filterConfig.colKey)?.name ?? ''}` : 'Filter'}
              </button>
              {showFilterPanel && (
                <div className="absolute left-0 top-full z-30 mt-1 w-80 rounded-lg border bg-popover p-3 shadow-xl space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Filter rows</p>
                  <select
                    value={filterConfig?.colKey ?? ''}
                    onChange={e => setFilterConfig(e.target.value ? { colKey: e.target.value, operator: 'contains', value: filterConfig?.value ?? '' } : null)}
                    className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                  >
                    <option value="">No filter</option>
                    {columns.map(col => <option key={col.key} value={col.key}>{col.name}</option>)}
                  </select>
                  {filterConfig && (
                    <>
                      <select
                        value={filterConfig.operator}
                        onChange={e => setFilterConfig({ ...filterConfig, operator: e.target.value })}
                        className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                      >
                        <option value="contains">contains</option>
                        <option value="equals">equals</option>
                        <option value="not_empty">is not empty</option>
                        <option value="empty">is empty</option>
                      </select>
                      {!['empty', 'not_empty'].includes(filterConfig.operator) && (
                        <input
                          type="text"
                          placeholder="Value..."
                          value={filterConfig.value}
                          onChange={e => setFilterConfig({ ...filterConfig, value: e.target.value })}
                          className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                        />
                      )}
                      <button
                        onClick={() => { setFilterConfig(null); setShowFilterPanel(false) }}
                        className="text-[11px] text-destructive hover:underline"
                      >
                        Clear filter
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => { closeAllPanels(); setShowSortPanel(!showSortPanel) }}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                  sortConfig ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium' : 'text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <ArrowUpDown className="size-3.5" />
                {sortConfig ? `Sort by ${columns.find(c => c.key === sortConfig.colKey)?.name ?? ''}` : 'Sort'}
              </button>
              {showSortPanel && (
                <div className="absolute left-0 top-full z-30 mt-1 w-64 rounded-lg border bg-popover p-3 shadow-xl space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Sort rows</p>
                  <select
                    value={sortConfig?.colKey ?? ''}
                    onChange={e => setSortConfig(e.target.value ? { colKey: e.target.value, desc: sortConfig?.desc ?? false } : null)}
                    className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                  >
                    <option value="">No sort</option>
                    {columns.map(col => <option key={col.key} value={col.key}>{col.name}</option>)}
                  </select>
                  {sortConfig && (
                    <>
                      <select
                        value={sortConfig.desc ? 'desc' : 'asc'}
                        onChange={e => setSortConfig({ ...sortConfig, desc: e.target.value === 'desc' })}
                        className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                      >
                        <option value="asc">A → Z (ascending)</option>
                        <option value="desc">Z → A (descending)</option>
                      </select>
                      <button
                        onClick={() => { setSortConfig(null); setShowSortPanel(false) }}
                        className="text-[11px] text-destructive hover:underline"
                      >
                        Clear sort
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Color (placeholder) */}
            <button className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 transition-colors">
              <Paintbrush className="size-3.5" />
              Color
            </button>

            {/* Spacer + search */}
            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/40" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                  className="h-7 w-40 rounded-md border bg-background pl-7 pr-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
              <span className="text-[11px] text-muted-foreground/50 tabular-nums">{total} row{total !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-center justify-between border-b bg-destructive/5 px-4 py-2 text-xs text-destructive">
              {error}
              <button onClick={() => setError(null)}><X className="size-3.5" /></button>
            </div>
          )}

          {/* ── Grid ── */}
          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b bg-muted/50 backdrop-blur">
                  <th className="w-12 border-r bg-muted/50 px-3 py-2.5 text-center text-[11px] font-medium text-muted-foreground/60">#</th>
                  {visibleColumns.map(col => {
                    const meta = FIELD_TYPE_META[col.field_type] ?? { label: col.field_type, icon: Type }
                    const Icon = meta.icon
                    return (
                      <th key={col.id} className="group relative min-w-[150px] border-r bg-muted/50 px-3 py-2.5 text-left">
                        <div className="flex items-center gap-1.5">
                          <Icon className="size-3.5 shrink-0 text-muted-foreground/50" />
                          <span className="text-xs font-semibold text-muted-foreground">{col.name}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (colMenu?.id === col.id) { setColMenu(null); return }
                            const rect = e.currentTarget.getBoundingClientRect()
                            setColMenu({ id: col.id, x: rect.right, y: rect.bottom + 4 })
                          }}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted"
                        >
                          <MoreHorizontal className="size-3.5 text-muted-foreground" />
                        </button>
                      </th>
                    )
                  })}
                  <th className="w-10 bg-muted/50 px-2 py-2.5">
                    <button onClick={() => setShowAddCol(!showAddCol)} className="flex h-6 w-6 items-center justify-center rounded hover:bg-muted transition-colors" title="Add column">
                      <Plus className="size-4 text-muted-foreground/60" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row, idx) => (
                  <tr key={row.id} className="group border-b transition-colors hover:bg-muted/20">
                    <td className="border-r bg-background px-3 py-0 text-center text-[11px] text-muted-foreground/50">
                      <div className="flex items-center justify-center">
                        <span className="group-hover:hidden">{(page - 1) * PAGE_SIZE + idx + 1}</span>
                        <button onClick={(e) => handleArchiveRow(e, row.id)} className="hidden group-hover:block" title="Archive row">
                          <Trash2 className="size-3 text-destructive/60 hover:text-destructive" />
                        </button>
                      </div>
                    </td>
                    {visibleColumns.map(col => {
                      const isEditing = editingCell?.rowId === row.id && editingCell?.colKey === col.key
                      return (
                        <td key={col.id} className={`border-r px-0 py-0 ${isEditing ? 'ring-2 ring-inset ring-primary' : 'cursor-pointer'}`} onClick={() => !isEditing && startEdit(row.id, col, row.cells[col.key])}>
                          {isEditing ? (
                            <div className="flex h-9 items-center px-3">{renderCellEditor(col)}</div>
                          ) : (
                            <div className="flex h-9 items-center truncate px-3 text-sm">{renderCellDisplay(row.cells[col.key], col)}</div>
                          )}
                        </td>
                      )
                    })}
                    <td className="w-10" />
                  </tr>
                ))}

                {/* New row inline */}
                {addingRow && (
                  <tr className="border-b bg-primary/[0.02]">
                    <td className="border-r px-3 py-0 text-center"><span className="text-[11px] text-primary/40">new</span></td>
                    {visibleColumns.map(col => (
                      <td key={col.id} className="border-r px-0 py-0"><div className="flex h-9 items-center px-3">{renderNewRowInput(col)}</div></td>
                    ))}
                    <td className="w-10 px-2">
                      <button onClick={handleAddRow} disabled={rowSaving} className="flex h-6 items-center rounded bg-primary px-2 text-[11px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                        {rowSaving ? '...' : 'Save'}
                      </button>
                    </td>
                  </tr>
                )}

                {/* Add row */}
                <tr>
                  <td colSpan={visibleColumns.length + 2} className="px-3 py-1.5">
                    <button onClick={() => { setAddingRow(true); setNewRowCells({}) }} className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-muted-foreground/50 transition-colors hover:bg-muted/50 hover:text-muted-foreground">
                      <Plus className="size-3.5" />
                      New row
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t bg-background px-5 py-2">
              <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon-xs" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="size-3.5" /></Button>
                <Button variant="ghost" size="icon-xs" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="size-3.5" /></Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Add column popover ── */}
      {showAddCol && (
        <div className="fixed inset-0 z-50" onClick={() => setShowAddCol(false)}>
          <div className="absolute right-8 top-36 w-72 rounded-xl border bg-popover p-4 shadow-xl space-y-3" onClick={e => e.stopPropagation()}>
            <p className="text-xs font-semibold text-muted-foreground">Add Column</p>
            <input type="text" placeholder="Column name" value={colName} onChange={e => setColName(e.target.value)} className="h-8 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30" autoFocus />
            <select value={colType} onChange={e => setColType(e.target.value)} className="h-8 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30">
              {Object.entries(FIELD_TYPE_META).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
            </select>
            {colType === 'single_select' && (
              <input type="text" placeholder="Options: Draft, Sent, Accepted" value={colOptions} onChange={e => setColOptions(e.target.value)} className="h-8 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30" />
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowAddCol(false)}>Cancel</Button>
              <Button size="sm" onClick={handleAddColumn} disabled={!colName.trim() || colSaving}>{colSaving ? 'Adding...' : 'Add'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Column dropdown (fixed, escapes stacking) ── */}
      {colMenu && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setColMenu(null)} />
          <div className="fixed z-50 w-44 rounded-lg border bg-popover p-1 shadow-xl" style={{ top: colMenu.y, left: colMenu.x - 176 }}>
            <div className="px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              {FIELD_TYPE_META[columns.find(c => c.id === colMenu.id)?.field_type ?? 'text']?.label ?? 'Column'}
            </div>
            <button onClick={() => handleArchiveColumn(colMenu.id)} className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10">
              <Trash2 className="size-3" />
              Archive column
            </button>
          </div>
        </>
      )}

      {/* Click-away for toolbar panels */}
      {(showHidePanel || showSortPanel || showFilterPanel) && (
        <div className="fixed inset-0 z-20" onClick={closeAllPanels} />
      )}

      {/* Import modal */}
      {importType && (
        <ImportModal
          fileType={importType}
          onClose={() => setImportType(null)}
          onSuccess={(newSlug) => { setImportType(null); router.push(`/tables/${newSlug}`) }}
        />
      )}
    </div>
  )
}
