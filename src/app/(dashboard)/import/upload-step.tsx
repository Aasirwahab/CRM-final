'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { createImportBatch, finalizeUpload, getPreviewRows } from './actions'

type Props = {
  onComplete: (batchId: string, data: { headers: string[]; rows: string[][]; totalLines: number }) => void
}

export function UploadStep({ onComplete }: Props) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setError(null)
    setUploading(true)

    try {
      // Step 1: Create batch + get signed URL
      setProgress('Creating import batch...')
      const formData = new FormData()
      formData.set('fileName', file.name)
      formData.set('fileSize', String(file.size))

      const result = await createImportBatch(formData)
      if ('error' in result && result.error) {
        setError(result.error)
        setUploading(false)
        return
      }

      const { batchId, signedUrl, token, path } = result as {
        batchId: string
        signedUrl: string
        token: string
        path: string
      }

      // Step 2: Upload file directly to Supabase Storage
      setProgress('Uploading file...')
      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'text/csv' },
        body: file,
      })

      if (!uploadRes.ok) {
        setError('Failed to upload file to storage')
        setUploading(false)
        return
      }

      // Step 3: Finalize upload
      setProgress('Finalizing upload...')
      const finalizeResult = await finalizeUpload(batchId)
      if (finalizeResult.error) {
        setError(finalizeResult.error)
        setUploading(false)
        return
      }

      // Step 4: Get preview
      setProgress('Loading preview...')
      const previewResult = await getPreviewRows(batchId)
      if ('error' in previewResult && previewResult.error) {
        setError(previewResult.error)
        setUploading(false)
        return
      }

      onComplete(batchId, previewResult as { headers: string[]; rows: string[][]; totalLines: number })
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      setProgress('')
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div
      className={`rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
        dragging ? 'border-primary bg-primary/5' : 'border-border'
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      {uploading ? (
        <div className="space-y-3">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">{progress}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <div>
            <p className="font-medium">Drag and drop your CSV file here</p>
            <p className="mt-1 text-sm text-muted-foreground">or click to browse. Max 5MB for free plan.</p>
          </div>
          <Button variant="outline" onClick={() => inputRef.current?.click()}>
            Choose File
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleChange}
          />
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  )
}
