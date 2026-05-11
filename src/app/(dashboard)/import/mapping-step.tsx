'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { saveColumnMapping } from './actions'

const CRM_FIELDS = [
  { value: 'skip', label: 'Skip this column' },
  { value: 'company_name', label: 'Company Name', required: true },
  { value: 'website', label: 'Website' },
  { value: 'industry', label: 'Industry / Category' },
  { value: 'size_band', label: 'Company Size' },
  { value: 'location', label: 'Location / Address' },
  { value: 'contact_name', label: 'Contact Name', required: true },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'job_title', label: 'Job Title' },
  { value: 'linkedin_url', label: 'LinkedIn URL' },
  { value: 'source', label: 'Lead Source' },
  { value: 'rating', label: 'Rating / Score' },
] as const

type Props = {
  headers: string[]
  sampleRow: string[]
  batchId: string
  onComplete: (mapping: Record<string, string>) => void
  onBack: () => void
}

function guessMapping(header: string): string {
  const h = header.toLowerCase().replace(/[_\-\s]+/g, '')
  // Company name variations
  if (h.includes('companyname') || h.includes('businessname') || h === 'company' || h === 'business' || h === 'organization' || h === 'org') return 'company_name'
  // Website
  if ((h.includes('website') || (h.includes('url') && !h.includes('linkedin'))) && !h.includes('status')) return 'website'
  // Industry / category
  if (h.includes('industry') || h.includes('sector') || h.includes('category')) return 'industry'
  // Location
  if (h.includes('location') || h.includes('city') || h.includes('country') || h.includes('address') || h.includes('postcode') || h.includes('zipcode') || h.includes('region') || h.includes('area')) return 'location'
  // Contact name variations
  if (h.includes('contactname') || h.includes('fullname') || h.includes('firstname') || h.includes('lastname') || (h.includes('name') && !h.includes('company') && !h.includes('business') && !h.includes('file'))) return 'contact_name'
  // Email
  if (h.includes('email') || h.includes('mail')) return 'email'
  // Phone
  if (h.includes('phone') || h.includes('mobile') || h.includes('tel') || h.includes('fax')) return 'phone'
  // Job title
  if (h.includes('title') || h.includes('position') || h.includes('jobtitle') || h.includes('designation')) return 'job_title'
  // LinkedIn
  if (h.includes('linkedin')) return 'linkedin_url'
  return 'skip'
}

export function MappingStep({ headers, sampleRow, batchId, onComplete, onBack }: Props) {
  const [mapping, setMapping] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    headers.forEach(h => { initial[h] = guessMapping(h) })
    return initial
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasCompanyOrContact = Object.values(mapping).includes('company_name') || Object.values(mapping).includes('contact_name')
  const hasContactInfo = Object.values(mapping).includes('email') || Object.values(mapping).includes('phone') || Object.values(mapping).includes('website')
  const isValid = hasCompanyOrContact && hasContactInfo

  async function handleStart() {
    setSaving(true)
    setError(null)

    const result = await saveColumnMapping(batchId, mapping)
    if (result.error) {
      setError(result.error)
      setSaving(false)
      return
    }

    onComplete(mapping)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Map Columns</h2>
          <p className="text-sm text-muted-foreground">
            Match your CSV columns to LeadFlow fields. Need at least company or contact name + email/phone/website.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>Back</Button>
          <Button onClick={handleStart} disabled={!isValid || saving}>
            {saving ? 'Saving...' : 'Start Import'}
          </Button>
        </div>
      </div>

      {!isValid && (
        <div className="rounded-md bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-400">
          {!hasCompanyOrContact && 'Map at least one column to Company Name or Contact Name. '}
          {!hasContactInfo && 'Map at least one column to Email, Phone, or Website.'}
        </div>
      )}

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">CSV Column</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Sample Value</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Map To</th>
            </tr>
          </thead>
          <tbody>
            {headers.map((header, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{header}</td>
                <td className="max-w-48 truncate px-4 py-3 text-muted-foreground">
                  {sampleRow[i] ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={mapping[header] ?? 'skip'}
                    onChange={(e) => setMapping(prev => ({ ...prev, [header]: e.target.value }))}
                    className="h-8 w-full max-w-52 rounded-md border bg-background px-2 text-sm"
                  >
                    {CRM_FIELDS.map(f => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  )
}
