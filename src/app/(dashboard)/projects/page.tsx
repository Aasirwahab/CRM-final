'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getProjects, createProject, updateProjectStatus } from './actions'

type BadgeTone = React.ComponentProps<typeof Badge>['tone']

const STATUS_TONE: Record<string, BadgeTone> = {
  active: 'emerald',
  on_hold: 'amber',
  completed: 'blue',
  cancelled: 'red',
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [wonDeals, setWonDeals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showConvert, setShowConvert] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [budget, setBudget] = useState('')
  const [deadline, setDeadline] = useState('')
  const [selectedDeal, setSelectedDeal] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const result = await getProjects()
    setProjects(result.projects)
    setWonDeals(result.wonDeals)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCreate() {
    if (!name.trim()) return
    setSaving(true)
    await createProject({
      name: name.trim(),
      type: type.trim() || undefined,
      budget: budget ? parseFloat(budget) : undefined,
      deadline: deadline || undefined,
    })
    setName(''); setType(''); setBudget(''); setDeadline('')
    setShowCreate(false)
    setSaving(false)
    load()
  }

  async function handleConvert() {
    if (!selectedDeal) return
    const deal = wonDeals.find(d => d.id === selectedDeal)
    if (!deal) return
    setSaving(true)
    await createProject({
      name: deal.title,
      budget: deal.value || undefined,
      dealId: deal.id,
    })
    setSelectedDeal('')
    setShowConvert(false)
    setSaving(false)
    load()
  }

  async function handleStatusChange(projectId: string, status: string) {
    await updateProjectStatus(projectId, status)
    load()
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-7 w-40" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="space-y-2 p-4">
              <Skeleton className="h-5 w-52" />
              <Skeleton className="h-3 w-72" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          {wonDeals.length > 0 && (
            <Button variant="outline" onClick={() => { setShowConvert(!showConvert); setShowCreate(false) }}>
              Convert Deal
            </Button>
          )}
          <Button onClick={() => { setShowCreate(!showCreate); setShowConvert(false) }}>
            New Project
          </Button>
        </div>
      </div>

      {/* Convert Deal Form */}
      {showConvert && (
        <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
          <h3 className="text-sm font-semibold">Convert Won Deal to Project</h3>
          <Select
            value={selectedDeal}
            onChange={e => setSelectedDeal(e.target.value)}
            className="w-full"
          >
            <option value="">Select a won deal...</option>
            {wonDeals.map(d => (
              <option key={d.id} value={d.id}>
                {d.title} — {d.companyName} {d.value ? `($${Number(d.value).toLocaleString()})` : ''}
              </option>
            ))}
          </Select>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleConvert} disabled={!selectedDeal || saving}>
              {saving ? 'Converting...' : 'Convert'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowConvert(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Create Project Form */}
      {showCreate && (
        <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
          <h3 className="text-sm font-semibold">Create New Project</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="text"
              placeholder="Project name *"
              value={name}
              onChange={e => setName(e.target.value)}
              className="col-span-2"
            />
            <Input
              type="text"
              placeholder="Type (e.g. Web App, Mobile)"
              value={type}
              onChange={e => setType(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Budget"
              value={budget}
              onChange={e => setBudget(e.target.value)}
            />
            <Input
              type="date"
              placeholder="Deadline"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="col-span-2"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={!name.trim() || saving}>
              {saving ? 'Creating...' : 'Create'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className="rounded-lg border p-12 text-center">
          <h3 className="text-lg font-medium">No projects yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a project or convert a won deal to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map(project => (
            <div key={project.id} className="rounded-lg border p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{project.name}</h3>
                    <Badge tone={STATUS_TONE[project.status]} className="capitalize">
                      {project.status.replace('_', ' ')}
                    </Badge>
                    {project.type && (
                      <Badge tone="neutral">{project.type}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {project.companyName && <span>Client: {project.companyName}</span>}
                    {project.budget && <span>Budget: ${Number(project.budget).toLocaleString()}</span>}
                    {project.deadline && <span>Due: {new Date(project.deadline).toLocaleDateString()}</span>}
                    <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    {project.githubRepo && (
                      <a href={project.githubRepo} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">GitHub</a>
                    )}
                    {project.stagingUrl && (
                      <a href={project.stagingUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">Staging</a>
                    )}
                    {project.liveUrl && (
                      <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 hover:underline">Live</a>
                    )}
                  </div>
                </div>
                <Select
                  value={project.status}
                  onChange={e => handleStatusChange(project.id, e.target.value)}
                  className="h-8 px-2 text-xs"
                >
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
