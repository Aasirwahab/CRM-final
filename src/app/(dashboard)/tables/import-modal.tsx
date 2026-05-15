'use client'

import { useState, useRef } from 'react'
import { X, Upload, FileSpreadsheet, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { createTableFromImport, type ImportColumn } from './actions'

type FieldType = ImportColumn['field_type']

function guessFieldType(values: string[]): FieldType {
  const sample = values.filter(v => v !== '').slice(0, 50)
  if (sample.length === 0) return 'text'

  const allNumbers = sample.every(v => !isNaN(Number(v)))
  if (allNumbers) return 'number'

  const allDates = sample.every(v => !isNaN(Date.parse(v)) && /\d{2,4}[-/]\d{1,2}[-/]\d{1,2}/.test(v))
  if (allDates) return 'date'

  const allBool = sample.every(v => ['true', 'false', 'yes', 'no', '1', '0'].includes(v.toLowerCase()))
  if (allBool) return 'checkbox'

  const allEmails = sample.every(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
  if (allEmails) return 'email'

  const allUrls = sample.every(v => /^https?:\/\/.+/.test(v))
  if (allUrls) return 'url'

  return 'text'
}

function sanitizeKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 60) || 'col'
}

function dedupeKeys(columns: ImportColumn[]): ImportColumn[] {
  const seen = new Map<string, number>()
  return columns.map(col => {
    const count = seen.get(col.key) ?? 0
    seen.set(col.key, count + 1)
    return count > 0 ? { ...col, key: `${col.key}_${count}` } : col
  })
}

type ParsedData = {
  columns: ImportColumn[]
  rows: Record<string, unknown>[]
}

function parseCSVData(text: string): ParsedData {
  const result = Papa.parse(text, { header: true, skipEmptyLines: true })
  const headers = result.meta.fields ?? []
  const rawRows = result.data as Record<string, string>[]

  const columns = dedupeKeys(
    headers.map(h => ({
      name: h,
      key: sanitizeKey(h),
      field_type: guessFieldType(rawRows.map(r => r[h] ?? '')) as FieldType,
    }))
  )

  const rows = rawRows.map(raw => {
    const cells: Record<string, unknown> = {}
    columns.forEach((col, i) => {
      const val = raw[headers[i]] ?? ''
      if (col.field_type === 'number' && val !== '') cells[col.key] = Number(val)
      else if (col.field_type === 'checkbox') cells[col.key] = ['true', 'yes', '1'].includes(val.toLowerCase())
      else cells[col.key] = val
    })
    return cells
  })

  return { columns, rows }
}

function parseExcelData(buffer: ArrayBuffer): ParsedData {
  const wb = XLSX.read(buffer, { type: 'array' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

  if (json.length === 0) return { columns: [], rows: [] }

  const headers = Object.keys(json[0])
  const columns = dedupeKeys(
    headers.map(h => ({
      name: h,
      key: sanitizeKey(h),
      field_type: guessFieldType(json.map(r => String(r[h] ?? ''))) as FieldType,
    }))
  )

  const rows = json.map(raw => {
    const cells: Record<string, unknown> = {}
    columns.forEach((col, i) => {
      const val = raw[headers[i]]
      if (col.field_type === 'number' && val !== '') cells[col.key] = Number(val)
      else if (col.field_type === 'checkbox') cells[col.key] = ['true', 'yes', '1'].includes(String(val).toLowerCase())
      else cells[col.key] = val == null ? '' : String(val)
    })
    return cells
  })

  return { columns, rows }
}

const FIELD_LABELS: Record<string, string> = {
  text: 'Text', number: 'Number', date: 'Date', checkbox: 'Checkbox',
  single_select: 'Select', url: 'URL', email: 'Email', phone: 'Phone',
}

export function ImportModal({
  fileType,
  onClose,
  onSuccess,
}: {
  fileType: 'csv' | 'excel'
  onClose: () => void
  onSuccess: (slug: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [tableName, setTableName] = useState('')
  const [parsed, setParsed] = useState<ParsedData | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const accept = fileType === 'csv' ? '.csv' : '.xlsx,.xls'

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setFileName(file.name)

    const nameWithoutExt = file.name.replace(/\.[^.]+$/, '')
    if (!tableName) setTableName(nameWithoutExt)

    try {
      if (fileType === 'csv') {
        const text = await file.text()
        const data = parseCSVData(text)
        if (data.columns.length === 0) { setError('No columns found in file'); return }
        setParsed(data)
      } else {
        const buffer = await file.arrayBuffer()
        const data = parseExcelData(buffer)
        if (data.columns.length === 0) { setError('No columns found in file'); return }
        setParsed(data)
      }
    } catch {
      setError('Failed to parse file. Please check the format.')
    }
  }

  function updateColumnType(index: number, type: FieldType) {
    if (!parsed) return
    const updated = [...parsed.columns]
    updated[index] = { ...updated[index], field_type: type }
    setParsed({ ...parsed, columns: updated })
  }

  async function handleImport() {
    if (!parsed || !tableName.trim()) return
    setSaving(true)
    setError(null)

    const result = await createTableFromImport({
      name: tableName.trim(),
      columns: parsed.columns,
      rows: parsed.rows,
    })

    if (result.error) {
      setError(result.error)
      setSaving(false)
      return
    }

    if (result.slug) onSuccess(result.slug)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-xl border bg-card shadow-2xl mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="size-5 text-primary" />
            <h2 className="text-base font-semibold">
              Import {fileType === 'csv' ? 'CSV' : 'Excel'} file
            </h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted transition-colors">
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Table name */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Table name</label>
            <input
              type="text"
              value={tableName}
              onChange={e => setTableName(e.target.value)}
              placeholder="My imported table"
              className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>

          {/* File picker */}
          {!parsed ? (
            <div
              onClick={() => fileRef.current?.click()}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 py-10 transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <Upload className="size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Click to select a <strong>{fileType === 'csv' ? '.csv' : '.xlsx'}</strong> file
              </p>
              <p className="text-xs text-muted-foreground/50">Maximum 5,000 rows</p>
              <input ref={fileRef} type="file" accept={accept} onChange={handleFile} className="hidden" />
            </div>
          ) : (
            <>
              {/* File info */}
              <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs">
                <FileSpreadsheet className="size-4 text-muted-foreground" />
                <span className="font-medium">{fileName}</span>
                <span className="text-muted-foreground">
                  — {parsed.columns.length} columns, {parsed.rows.length} rows
                </span>
                <button
                  onClick={() => { setParsed(null); setFileName(null); if (fileRef.current) fileRef.current.value = '' }}
                  className="ml-auto text-muted-foreground hover:text-foreground"
                >
                  Change file
                </button>
              </div>

              {/* Column mapping */}
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Columns (adjust types if needed)</p>
                <div className="space-y-1.5">
                  {parsed.columns.map((col, i) => (
                    <div key={col.key} className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
                      <span className="min-w-0 flex-1 truncate text-sm">{col.name}</span>
                      <span className="text-[10px] text-muted-foreground/50 font-mono">{col.key}</span>
                      <select
                        value={col.field_type}
                        onChange={e => updateColumnType(i, e.target.value as FieldType)}
                        className="h-7 rounded-md border bg-background px-2 text-xs"
                      >
                        {Object.entries(FIELD_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview rows */}
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Preview (first {Math.min(5, parsed.rows.length)} rows)
                </p>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/40">
                        {parsed.columns.map(col => (
                          <th key={col.key} className="whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground">
                            {col.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.rows.slice(0, 5).map((row, ri) => (
                        <tr key={ri} className="border-t">
                          {parsed.columns.map(col => (
                            <td key={col.key} className="whitespace-nowrap px-3 py-1.5 max-w-[200px] truncate">
                              {String(row[col.key] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t px-5 py-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!parsed || !tableName.trim() || saving}
          >
            {saving ? 'Importing...' : `Import ${parsed?.rows.length ?? 0} rows`}
          </Button>
        </div>
      </div>
    </div>
  )
}
