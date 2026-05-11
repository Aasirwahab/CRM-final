'use client'

import { useState, useEffect } from 'react'
import { getImportHistory } from './actions'

type Batch = {
  id: string
  file_name: string
  status: string
  total_rows: number
  successful_rows: number
  failed_rows: number
  duplicate_rows: number
  created_at: string
  completed_at: string | null
}

const STATUS_STYLES: Record<string, string> = {
  uploading: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  uploaded: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  parsing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  processing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export function ImportHistory() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const result = await getImportHistory()
      setBatches(result.batches as Batch[])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Import History</h2>
        <div className="flex h-24 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  if (batches.length === 0) {
    return (
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Import History</h2>
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          No imports yet. Upload your first CSV above.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Import History</h2>
      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">File</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Rows</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Imported</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Failed</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Date</th>
            </tr>
          </thead>
          <tbody>
            {batches.map(b => (
              <tr key={b.id} className="border-b last:border-0">
                <td className="max-w-48 truncate px-4 py-3 font-medium">{b.file_name}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[b.status] ?? ''}`}>
                    {b.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">{b.total_rows}</td>
                <td className="px-4 py-3 text-right text-green-600">{b.successful_rows}</td>
                <td className="px-4 py-3 text-right text-red-600">{b.failed_rows}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(b.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
