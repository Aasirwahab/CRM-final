'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { getPipelineLeads, moveLeadStage, type PipelineLead } from './actions'
import { StageColumn } from './stage-column'
import { LeadCard } from './lead-card'
import { DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'

const DEAL_STAGES = ['proposal_sent', 'negotiation']

const STAGES = [
  { id: 'imported', label: 'Imported' },
  { id: 'researched', label: 'Researched' },
  { id: 'qualified', label: 'Qualified' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'replied', label: 'Replied' },
  { id: 'meeting_booked', label: 'Meeting Booked' },
  { id: 'proposal_sent', label: 'Proposal Sent' },
  { id: 'negotiation', label: 'Negotiation' },
  { id: 'won', label: 'Won' },
  { id: 'lost', label: 'Lost' },
  { id: 'nurture', label: 'Nurture' },
]

export default function PipelinePage() {
  const [leads, setLeads] = useState<PipelineLead[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [conflict, setConflict] = useState<string | null>(null)
  const [dealModal, setDealModal] = useState<{
    leadId: string
    newStage: string
    oldStage: string
    oldVersion: number
    companyName: string
  } | null>(null)
  const [dealValue, setDealValue] = useState('')
  const [dealCloseDate, setDealCloseDate] = useState('')
  const [dealSaving, setDealSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  useEffect(() => {
    async function load() {
      const result = await getPipelineLeads()
      setLeads(result.leads)
      setLoading(false)
    }
    load()
  }, [])

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    const leadId = active.id as string
    const newStage = over.id as string

    const lead = leads.find(l => l.id === leadId)
    if (!lead || lead.pipeline_stage === newStage) return

    if (DEAL_STAGES.includes(newStage) && !DEAL_STAGES.includes(lead.pipeline_stage)) {
      setDealModal({
        leadId,
        newStage,
        oldStage: lead.pipeline_stage,
        oldVersion: lead.version,
        companyName: lead.company_name ?? 'Untitled',
      })
      setDealValue('')
      setDealCloseDate('')
      return
    }

    await executeMoveStage(leadId, newStage, lead.pipeline_stage, lead.version)
  }

  async function executeMoveStage(leadId: string, newStage: string, oldStage: string, oldVersion: number, dealDetails?: { value?: number; closeDate?: string }) {
    setLeads(prev => prev.map(l =>
      l.id === leadId ? { ...l, pipeline_stage: newStage, version: l.version + 1 } : l
    ))

    const result = await moveLeadStage(leadId, newStage, oldVersion, dealDetails)

    if ('error' in result && result.error) {
      setLeads(prev => prev.map(l =>
        l.id === leadId ? { ...l, pipeline_stage: oldStage, version: oldVersion } : l
      ))
      setConflict(result.error)
      setTimeout(() => setConflict(null), 4000)
    }
  }

  async function handleDealConfirm() {
    if (!dealModal) return
    setDealSaving(true)
    await executeMoveStage(
      dealModal.leadId,
      dealModal.newStage,
      dealModal.oldStage,
      dealModal.oldVersion,
      {
        value: dealValue ? parseFloat(dealValue) : undefined,
        closeDate: dealCloseDate || undefined,
      }
    )
    setDealSaving(false)
    setDealModal(null)
  }

  function handleDealCancel() {
    setDealModal(null)
  }

  const activeLead = leads.find(l => l.id === activeId)

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Drag leads between stages. {leads.length} leads total.
        </p>
      </div>

      {conflict && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          {conflict}
        </div>
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGES.map(stage => (
            <StageColumn
              key={stage.id}
              id={stage.id}
              label={stage.label}
              leads={leads.filter(l => l.pipeline_stage === stage.id)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeLead ? <LeadCard lead={activeLead} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      {dealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleDealCancel}>
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">Create Deal</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Moving <strong>{dealModal.companyName}</strong> to{' '}
              <strong>{STAGES.find(s => s.id === dealModal.newStage)?.label}</strong>.
              Fill in the deal details.
            </p>

            <div className="mt-5 space-y-3">
              <div>
                <label htmlFor="deal-title" className="mb-1 block text-xs font-medium text-muted-foreground">Deal Title</label>
                <input
                  id="deal-title"
                  type="text"
                  value={`${dealModal.companyName} — Deal`}
                  disabled
                  className="h-9 w-full rounded-lg border bg-muted px-3 text-sm"
                />
              </div>
              <div>
                <label htmlFor="deal-value" className="mb-1 block text-xs font-medium text-muted-foreground">Deal Value ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
                  <input
                    id="deal-value"
                    type="number"
                    placeholder="e.g. 50000"
                    value={dealValue}
                    onChange={e => setDealValue(e.target.value)}
                    className="h-9 w-full rounded-lg border bg-background pl-7 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <label htmlFor="deal-close-date" className="mb-1 block text-xs font-medium text-muted-foreground">Expected Close Date</label>
                <input
                  id="deal-close-date"
                  type="date"
                  value={dealCloseDate}
                  onChange={e => setDealCloseDate(e.target.value)}
                  className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={handleDealCancel} disabled={dealSaving}>
                Cancel
              </Button>
              <Button onClick={handleDealConfirm} disabled={dealSaving}>
                {dealSaving ? 'Creating...' : 'Create Deal & Move'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
