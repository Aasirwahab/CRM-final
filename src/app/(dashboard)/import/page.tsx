'use client'

import { useState } from 'react'
import { UploadStep } from './upload-step'
import { PreviewStep } from './preview-step'
import { MappingStep } from './mapping-step'
import { ProcessingStep } from './processing-step'
import { SummaryStep } from './summary-step'
import { ImportHistory } from './import-history'

type Step = 'upload' | 'preview' | 'mapping' | 'processing' | 'summary'

export default function ImportPage() {
  const [step, setStep] = useState<Step>('upload')
  const [batchId, setBatchId] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<{
    headers: string[]
    rows: string[][]
    totalLines: number
  } | null>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({})

  function handleUploadComplete(id: string, data: { headers: string[]; rows: string[][]; totalLines: number }) {
    setBatchId(id)
    setPreviewData(data)
    setStep('preview')
  }

  function handlePreviewConfirm() {
    setStep('mapping')
  }

  function handleMappingComplete(m: Record<string, string>) {
    setMapping(m)
    setStep('processing')
  }

  function handleProcessingComplete() {
    setStep('summary')
  }

  function handleReset() {
    setStep('upload')
    setBatchId(null)
    setPreviewData(null)
    setMapping({})
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import Leads</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a CSV file to import leads into your CRM
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {(['upload', 'preview', 'mapping', 'processing', 'summary'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <div className="h-px w-6 bg-border" />}
            <div
              className={`flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-medium ${
                s === step
                  ? 'bg-primary text-primary-foreground'
                  : ['upload', 'preview', 'mapping', 'processing', 'summary'].indexOf(s) <
                    ['upload', 'preview', 'mapping', 'processing', 'summary'].indexOf(step)
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <span>{i + 1}</span>
              <span className="hidden sm:inline capitalize">{s}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Active step */}
      {step === 'upload' && <UploadStep onComplete={handleUploadComplete} />}
      {step === 'preview' && previewData && (
        <PreviewStep data={previewData} onConfirm={handlePreviewConfirm} onBack={handleReset} />
      )}
      {step === 'mapping' && previewData && batchId && (
        <MappingStep
          headers={previewData.headers}
          sampleRow={previewData.rows[0] ?? []}
          batchId={batchId}
          onComplete={handleMappingComplete}
          onBack={() => setStep('preview')}
        />
      )}
      {step === 'processing' && batchId && (
        <ProcessingStep batchId={batchId} onComplete={handleProcessingComplete} />
      )}
      {step === 'summary' && batchId && (
        <SummaryStep batchId={batchId} onReset={handleReset} />
      )}

      {/* Import history */}
      {step === 'upload' && <ImportHistory />}
    </div>
  )
}
