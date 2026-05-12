'use client'

import { useDraggable } from '@dnd-kit/core'
import { useRouter } from 'next/navigation'
import type { PipelineLead } from './actions'

const QUALITY_COLORS: Record<string, string> = {
  hot: 'bg-red-500',
  warm: 'bg-orange-500',
  cold: 'bg-indigo-500',
}

type Props = {
  lead: PipelineLead
  isDragging?: boolean
}

export function LeadCard({ lead, isDragging }: Props) {
  const router = useRouter()
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: lead.id })

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined

  const initial = (lead.company_name || lead.contact_name || '?')[0]?.toUpperCase()

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded-lg border bg-background p-2.5 text-sm transition-all duration-150 hover:shadow-md active:cursor-grabbing ${
        isDragging ? 'rotate-1 scale-105 opacity-90 shadow-xl ring-2 ring-primary/30' : 'shadow-sm'
      }`}
      onDoubleClick={() => router.push(`/leads/${lead.id}`)}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">
            {lead.company_name || lead.contact_name || 'Unknown'}
          </p>
          {lead.company_name && lead.contact_name && (
            <p className="truncate text-[11px] text-muted-foreground">{lead.contact_name}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`h-2 w-2 rounded-full ${QUALITY_COLORS[lead.lead_quality] ?? 'bg-gray-400'}`} />
          <span className="text-[11px] font-mono text-muted-foreground">{lead.lead_score}</span>
        </div>
      </div>
      {lead.contact_email && (
        <p className="mt-1.5 truncate text-[11px] text-muted-foreground">{lead.contact_email}</p>
      )}
    </div>
  )
}
