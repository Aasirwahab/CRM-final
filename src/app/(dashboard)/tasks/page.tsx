'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getTasks, createTask, updateTaskStatus, type TaskRow } from './actions'
import { Plus, CheckCircle2, Circle, Clock, XCircle, AlertTriangle } from 'lucide-react'

type BadgeTone = React.ComponentProps<typeof Badge>['tone']

const PRIORITY_TONE: Record<string, BadgeTone> = {
  urgent: 'red',
  high: 'orange',
  medium: 'amber',
  low: 'neutral',
}

const STATUS_ICONS: Record<string, typeof Circle> = {
  todo: Circle,
  in_progress: Clock,
  done: CheckCircle2,
  cancelled: XCircle,
}

const STATUS_OPTIONS = ['todo', 'in_progress', 'done', 'cancelled']

export default function TasksPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState('medium')
  const [newDue, setNewDue] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const result = await getTasks({ status: filter || undefined })
    setTasks(result.tasks)
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  async function handleCreate() {
    if (!newTitle.trim()) return
    setSaving(true)
    await createTask({ title: newTitle.trim(), priority: newPriority, due_at: newDue || undefined })
    setNewTitle('')
    setNewDue('')
    setShowForm(false)
    setSaving(false)
    await load()
  }

  async function handleStatusChange(taskId: string, status: string) {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t))
    await updateTaskStatus(taskId, status)
  }

  const overdue = tasks.filter(t => t.due_at && new Date(t.due_at) < new Date() && t.status !== 'done' && t.status !== 'cancelled')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {tasks.length} tasks
            {overdue.length > 0 && (
              <span className="ml-1.5 inline-flex items-center gap-1 text-destructive">
                <AlertTriangle className="inline size-3" />
                {overdue.length} overdue
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="size-4" data-icon="inline-start" />
          {showForm ? 'Cancel' : 'New Task'}
        </Button>
      </div>

      {/* New task form */}
      {showForm && (
        <Card className="space-y-3 p-5">
          <Input
            type="text"
            placeholder="Task title..."
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            autoFocus
          />
          <div className="flex gap-3">
            <Select
              value={newPriority}
              onChange={e => setNewPriority(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
            <Input
              type="datetime-local"
              value={newDue}
              onChange={e => setNewDue(e.target.value)}
              className="w-auto"
            />
            <Button onClick={handleCreate} disabled={!newTitle.trim() || saving}>
              {saving ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        {['', ...STATUS_OPTIONS].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium capitalize transition-all duration-150 ${
              filter === s
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {(s || 'All').replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Task list */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="flex items-center gap-3 p-4">
              <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="ml-auto h-5 w-14 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-lg" />
            </Card>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <CheckCircle2 className="size-5 text-muted-foreground" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">No tasks yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => {
            const isOverdue = task.due_at && new Date(task.due_at) < new Date() && task.status !== 'done' && task.status !== 'cancelled'
            const StatusIcon = STATUS_ICONS[task.status] ?? Circle
            return (
              <div
                key={task.id}
                className={`flex items-center gap-3 rounded-xl border bg-card p-4 transition-all duration-150 hover:shadow-sm ${
                  isOverdue ? 'border-red-200 bg-red-50/50 dark:border-red-800/50 dark:bg-red-950/20' : ''
                }`}
              >
                <button
                  onClick={() => {
                    const next = task.status === 'done' ? 'todo' : 'done'
                    handleStatusChange(task.id, next)
                  }}
                  className={`shrink-0 transition-colors ${
                    task.status === 'done'
                      ? 'text-emerald-500'
                      : 'text-muted-foreground/40 hover:text-primary'
                  }`}
                >
                  <StatusIcon className="size-5" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                    {task.title}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    {task.company_name && task.lead_id ? (
                      <button
                        onClick={() => router.push(`/leads/${task.lead_id}`)}
                        className="text-primary hover:underline"
                      >
                        {task.company_name}
                      </button>
                    ) : task.company_name ? (
                      <span>{task.company_name}</span>
                    ) : null}
                    {task.due_at && (
                      <span className={isOverdue ? 'font-medium text-destructive' : ''}>
                        Due {new Date(task.due_at).toLocaleDateString()}
                      </span>
                    )}
                    {task.title.startsWith('Follow up:') && (
                      <Badge tone="purple">Auto</Badge>
                    )}
                  </div>
                </div>
                <Badge tone={PRIORITY_TONE[task.priority]} className="capitalize">
                  {task.priority}
                </Badge>
                <Select
                  value={task.status}
                  onChange={e => handleStatusChange(task.id, e.target.value)}
                  className="h-7 px-2 text-xs capitalize"
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </Select>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
