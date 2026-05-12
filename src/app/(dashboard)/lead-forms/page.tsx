'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { getLeadForms, createLeadForm, toggleFormActive, getFormSubmissions, convertSubmissionToLead } from './actions'

export default function LeadFormsPage() {
  const [forms, setForms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [selectedForm, setSelectedForm] = useState<string | null>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loadingSubs, setLoadingSubs] = useState(false)
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const result = await getLeadForms()
    setForms(result.forms)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCreate() {
    if (!newName.trim()) return
    setCreating(true)
    await createLeadForm(newName.trim())
    setNewName('')
    setCreating(false)
    load()
  }

  async function handleToggle(formId: string, isActive: boolean) {
    await toggleFormActive(formId, !isActive)
    load()
  }

  async function handleViewSubmissions(formId: string) {
    if (selectedForm === formId) {
      setSelectedForm(null)
      return
    }
    setSelectedForm(formId)
    setLoadingSubs(true)
    const result = await getFormSubmissions(formId)
    setSubmissions(result.submissions)
    setLoadingSubs(false)
  }

  async function handleConvert(subId: string) {
    const result = await convertSubmissionToLead(subId)
    if (result.success) {
      // Reload submissions
      if (selectedForm) {
        const result = await getFormSubmissions(selectedForm)
        setSubmissions(result.submissions)
      }
      load()
    }
  }

  function copyFormLink(slug: string) {
    const url = `${window.location.origin}/f/${slug}`
    navigator.clipboard.writeText(url)
    setCopiedSlug(slug)
    setTimeout(() => setCopiedSlug(null), 2000)
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lead Capture Forms</h1>
        <p className="text-sm text-muted-foreground">
          Create shareable forms to collect leads from your website or partners
        </p>
      </div>

      {/* Create form */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Form name (e.g. Website Contact Form)"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          className="h-9 flex-1 rounded-md border bg-background px-3 text-sm"
        />
        <Button onClick={handleCreate} disabled={!newName.trim() || creating}>
          {creating ? 'Creating...' : 'Create Form'}
        </Button>
      </div>

      {/* Forms list */}
      {forms.length === 0 ? (
        <div className="rounded-lg border p-12 text-center">
          <h3 className="text-lg font-medium">No forms yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a form to start capturing leads from the web.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {forms.map(form => (
            <div key={form.id} className="space-y-2">
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{form.name}</h3>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        form.is_active
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                      }`}>
                        {form.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{form.submission_count} submission{form.submission_count !== 1 ? 's' : ''}</span>
                      <span>Created {new Date(form.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyFormLink(form.slug)}
                    >
                      {copiedSlug === form.slug ? 'Copied!' : 'Copy Link'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewSubmissions(form.id)}
                    >
                      {selectedForm === form.id ? 'Hide' : 'Submissions'}
                    </Button>
                    <Button
                      size="sm"
                      variant={form.is_active ? 'outline' : 'default'}
                      onClick={() => handleToggle(form.id, form.is_active)}
                    >
                      {form.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
                <div className="mt-2 rounded-md bg-muted/50 px-3 py-2">
                  <p className="text-xs text-muted-foreground">
                    Public URL: <code className="text-foreground">{typeof window !== 'undefined' ? window.location.origin : ''}/f/{form.slug}</code>
                  </p>
                </div>
              </div>

              {/* Submissions panel */}
              {selectedForm === form.id && (
                <div className="ml-4 rounded-lg border p-4 space-y-3">
                  <h4 className="text-sm font-medium">Submissions</h4>
                  {loadingSubs ? (
                    <div className="flex h-16 items-center justify-center">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  ) : submissions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No submissions yet.</p>
                  ) : (
                    submissions.map(sub => (
                      <div key={sub.id} className="flex items-start justify-between rounded-md border p-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                            {Object.entries(sub.data_json as Record<string, string>).map(([key, val]) => (
                              <span key={key}>
                                <span className="text-muted-foreground">{key.replace(/_/g, ' ')}:</span>{' '}
                                <span className="font-medium">{val}</span>
                              </span>
                            ))}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {new Date(sub.created_at).toLocaleString()}
                          </p>
                        </div>
                        {sub.converted_lead_id ? (
                          <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            Converted
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleConvert(sub.id)}
                          >
                            Convert to Lead
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
