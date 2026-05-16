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
import { getPipelineLeads, moveLeadStage, syncLeadStatuses, type PipelineLead } from './actions'
import { StageColumn } from './stage-column'
import { LeadCard } from './lead-card'

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  useEffect(() => {
    async function load() {
      await syncLeadStatuses()
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

    // Optimistic update
    const oldStage = lead.pipeline_stage
    const oldVersion = lead.version
    setLeads(prev => prev.map(l =>
      l.id === leadId ? { ...l, pipeline_stage: newStage, version: l.version + 1 } : l
    ))

    const result = await moveLeadStage(leadId, newStage, oldVersion)

    if ('error' in result && result.error) {
      // Revert
      setLeads(prev => prev.map(l =>
        l.id === leadId ? { ...l, pipeline_stage: oldStage, version: oldVersion } : l
      ))
      setConflict(result.error)
      setTimeout(() => setConflict(null), 4000)
    }
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
    </div>
  )
}
