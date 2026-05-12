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
      className={`flex w-64 shrink-0 flex-col rounded-xl border bg-card transition-all duration-200 ${
        isOver ? 'border-primary/50 bg-primary/5 shadow-md' : 'shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between px-3.5 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </h3>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-muted px-1.5 text-[11px] font-semibold text-muted-foreground">
          {leads.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 border-t px-2 py-2" style={{ minHeight: 100 }}>
        {leads.map(lead => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  )
}
