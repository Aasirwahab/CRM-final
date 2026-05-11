'use client'

import { useState, useEffect, useRef } from 'react'
import { getBatchStatus, startImportProcessing } from './actions'

type Props = {
  batchId: string
  onComplete: () => void
}

export function ProcessingStep({ batchId, onComplete }: Props) {
  const [status, setStatus] = useState<string>('Starting import...')
  const [progress, setProgress] = useState({ total: 0, successful: 0, failed: 0, duplicates: 0 })
  const [error, setError] = useState<string | null>(null)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    async function run() {
      // Start processing
      const result = await startImportProcessing(batchId)

      if ('error' in result && result.error) {
        setError(result.error)
        return
      }

      // Processing is done (it runs synchronously in the server action)
      // Fetch final status
      const statusResult = await getBatchStatus(batchId)
      if ('batch' in statusResult && statusResult.batch) {
        const b = statusResult.batch
        setProgress({
          total: b.total_rows,
          successful: b.successful_rows,
          failed: b.failed_rows,
          duplicates: b.duplicate_rows,
        })
        setStatus('Complete!')
      }

      onComplete()
    }

    run()
  }, [batchId, onComplete])

  // Poll for progress while processing
  useEffect(() => {
    if (error) return

    const interval = setInterval(async () => {
      const result = await getBatchStatus(batchId)
      if ('batch' in result && result.batch) {
        const b = result.batch
        setProgress({
          total: b.total_rows,
          successful: b.successful_rows,
          failed: b.failed_rows,
          duplicates: b.duplicate_rows,
        })

        if (b.status === 'processing') {
          const processed = b.successful_rows + b.failed_rows + b.duplicate_rows
          setStatus(`Processing... ${processed} / ${b.total_rows} rows`)
        }

        if (b.status === 'completed' || b.status === 'failed') {
          clearInterval(interval)
        }
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [batchId, error])

  const processed = progress.successful + progress.failed + progress.duplicates
  const pct = progress.total > 0 ? Math.round((processed / progress.total) * 100) : 0

  return (
    <div className="space-y-6 rounded-lg border p-8">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <h2 className="text-lg font-semibold">{status}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Please don&apos;t close this page while the import is running.
        </p>
      </div>

      {progress.total > 0 && (
        <div className="space-y-3">
          {/* Progress bar */}
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{processed} / {progress.total} rows processed</span>
            <span>{pct}%</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-md bg-green-500/10 p-3">
              <p className="text-2xl font-bold text-green-600">{progress.successful}</p>
              <p className="text-xs text-muted-foreground">Imported</p>
            </div>
            <div className="rounded-md bg-yellow-500/10 p-3">
              <p className="text-2xl font-bold text-yellow-600">{progress.duplicates}</p>
              <p className="text-xs text-muted-foreground">Duplicates</p>
            </div>
            <div className="rounded-md bg-red-500/10 p-3">
              <p className="text-2xl font-bold text-red-600">{progress.failed}</p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  )
}
