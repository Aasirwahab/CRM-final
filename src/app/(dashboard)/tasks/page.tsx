'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { getTasks, createTask, updateTaskStatus, type TaskRow } from './actions'

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
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
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            {tasks.length} tasks{overdue.length > 0 ? `, ${overdue.length} overdue` : ''}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Task'}
        </Button>
      </div>

      {/* New task form */}
      {showForm && (
        <div className="rounded-lg border p-4 space-y-3">
          <input
            type="text"
            placeholder="Task title..."
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            autoFocus
          />
          <div className="flex gap-3">
            <select
              value={newPriority}
              onChange={e => setNewPriority(e.target.value)}
              className="h-8 rounded-md border bg-background px-2 text-sm"
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
              className="h-8 rounded-md border bg-background px-2 text-sm"
            />
            <Button size="sm" onClick={handleCreate} disabled={!newTitle.trim() || saving}>
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
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
              filter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Task list */}
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          No tasks yet. Create one to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => {
            const isOverdue = task.due_at && new Date(task.due_at) < new Date() && task.status !== 'done' && task.status !== 'cancelled'
            return (
              <div key={task.id} className={`flex items-center gap-3 rounded-lg border p-3 ${isOverdue ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20' : ''}`}>
                <select
                  value={task.status}
                  onChange={e => handleStatusChange(task.id, e.target.value)}
                  className="h-7 rounded border bg-background px-1.5 text-xs"
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
                      <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                        Due {new Date(task.due_at).toLocaleDateString()}
                      </span>
                    )}
                    {task.title.startsWith('Follow up:') && (
                      <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        Auto
                      </span>
                    )}
                  </div>
                </div>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${PRIORITY_STYLES[task.priority] ?? ''}`}>
                  {task.priority}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
