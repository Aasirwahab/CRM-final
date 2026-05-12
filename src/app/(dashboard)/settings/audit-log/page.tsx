'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { getAuditLogs } from './actions'
import Link from 'next/link'

const ACTION_COLORS: Record<string, string> = {
  created: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  updated: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  deleted: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  imported: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  researched: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  scored: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  restored: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const result = await getAuditLogs(page)
      setLogs(result.logs)
      setTotal(result.total)
      setLoading(false)
    }
    load()
  }, [page])

  const totalPages = Math.ceil(total / 50)

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <Link href="/settings" className="text-sm text-muted-foreground hover:text-foreground">&larr; Settings</Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-sm text-muted-foreground">{total} total events</p>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          No activity yet.
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log.id} className="flex items-start gap-3 rounded-lg border p-3 text-sm">
              <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{log.actorName}</span>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-700'}`}>
                    {log.action}
                  </span>
                  <span className="text-muted-foreground">{log.entityType}</span>
                </div>
                {(log.before || log.after) && (
                  <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                    {log.before && <span>Before: {JSON.stringify(log.before)}</span>}
                    {log.after && <span>After: {JSON.stringify(log.after)}</span>}
                  </div>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  )
}
