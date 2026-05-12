'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { getTasks, createTask, updateTaskStatus, type TaskRow } from './actions'
import { Plus, CheckCircle2, Circle, Clock, XCircle, AlertTriangle } from 'lucide-react'

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'bg-red-50 text-red-600 ring-red-500/20 dark:bg-red-950/40 dark:text-red-400',
  high: 'bg-orange-50 text-orange-600 ring-orange-500/20 dark:bg-orange-950/40 dark:text-orange-400',
  medium: 'bg-amber-50 text-amber-600 ring-amber-500/20 dark:bg-amber-950/40 dark:text-amber-400',
  low: 'bg-gray-50 text-gray-600 ring-gray-500/20 dark:bg-gray-800 dark:text-gray-400',
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
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <input
            type="text"
            placeholder="Task title..."
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            autoFocus
          />
          <div className="flex gap-3">
            <select
              value={newPriority}
              onChange={e => setNewPriority(e.target.value)}
              className="h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <input
              type="datetime-local"
              value={newDue}
              onChange={e => setNewDue(e.target.value)}
              className="h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
            <Button onClick={handleCreate} disabled={!newTitle.trim() || saving}>
              {saving ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </div>
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
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-primary/30 border-t-primary" />
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
                      <span className="badge bg-purple-50 text-purple-600 ring-purple-500/20 dark:bg-purple-950/40 dark:text-purple-400">
                        Auto
                      </span>
                    )}
                  </div>
                </div>
                <span className={`badge capitalize ${PRIORITY_STYLES[task.priority] ?? ''}`}>
                  {task.priority}
                </span>
                <select
                  value={task.status}
                  onChange={e => handleStatusChange(task.id, e.target.value)}
                  className="h-7 rounded-lg border bg-background px-2 text-xs text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
