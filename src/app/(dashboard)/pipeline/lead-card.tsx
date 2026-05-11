'use client'

import { useDraggable } from '@dnd-kit/core'
import { useRouter } from 'next/navigation'
import type { PipelineLead } from './actions'

const QUALITY_COLORS: Record<string, string> = {
  hot: 'bg-red-500',
  warm: 'bg-orange-500',
  cold: 'bg-blue-500',
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded-md border bg-background p-2.5 text-sm shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing ${
        isDragging ? 'rotate-2 opacity-80 shadow-lg' : ''
      }`}
      onDoubleClick={() => router.push(`/leads/${lead.id}`)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-xs">
            {lead.company_name || lead.contact_name || 'Unknown'}
          </p>
          {lead.company_name && lead.contact_name && (
            <p className="truncate text-xs text-muted-foreground">{lead.contact_name}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`h-2 w-2 rounded-full ${QUALITY_COLORS[lead.lead_quality] ?? 'bg-gray-400'}`} />
          <span className="text-xs font-mono text-muted-foreground">{lead.lead_score}</span>
        </div>
      </div>
      {lead.contact_email && (
        <p className="mt-1 truncate text-xs text-muted-foreground">{lead.contact_email}</p>
      )}
    </div>
  )
}
