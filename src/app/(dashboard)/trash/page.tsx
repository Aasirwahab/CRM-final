'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { getTrashedLeads, restoreLead } from './actions'
import Link from 'next/link'

const QUALITY_COLORS: Record<string, string> = {
  hot: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  warm: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  cold: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
}

export default function TrashPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const result = await getTrashedLeads()
    setLeads(result.leads)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleRestore(id: string) {
    setRestoring(id)
    await restoreLead(id)
    setRestoring(null)
    load()
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <Link href="/settings" className="text-sm text-muted-foreground hover:text-foreground">&larr; Settings</Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Trash</h1>
        <p className="text-sm text-muted-foreground">
          {leads.length} deleted lead{leads.length !== 1 ? 's' : ''}
        </p>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : leads.length === 0 ? (
        <div className="rounded-lg border p-12 text-center">
          <h3 className="text-lg font-medium">Trash is empty</h3>
          <p className="mt-1 text-sm text-muted-foreground">No deleted leads to show.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leads.map(lead => (
            <div key={lead.id} className="flex items-center justify-between rounded-lg border p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{lead.companyName ?? 'No company'}</span>
                  {lead.quality && (
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${QUALITY_COLORS[lead.quality] ?? ''}`}>
                      {lead.quality}
                    </span>
                  )}
                  {lead.score != null && (
                    <span className="text-xs text-muted-foreground">Score: {lead.score}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  {lead.contactName && <span>{lead.contactName}</span>}
                  {lead.contactEmail && <span>{lead.contactEmail}</span>}
                  <span>Deleted {new Date(lead.deletedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRestore(lead.id)}
                disabled={restoring === lead.id}
              >
                {restoring === lead.id ? 'Restoring...' : 'Restore'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
