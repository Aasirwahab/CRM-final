'use client'

import { useDroppable } from '@dnd-kit/core'
import { LeadCard } from './lead-card'
import type { PipelineLead } from './actions'

type Props = {
  id: string
  label: string
  leads: PipelineLead[]
}

export function StageColumn({ id, label, leads }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`flex w-64 shrink-0 flex-col rounded-lg border bg-muted/30 transition-colors ${
        isOver ? 'border-primary bg-primary/5' : ''
      }`}
    >
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </h3>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium">
          {leads.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-2" style={{ minHeight: 100 }}>
        {leads.map(lead => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  )
}
