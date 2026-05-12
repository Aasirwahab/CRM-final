'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { getOrgSettings, updateOrgName, updateProfile } from './actions'
import Link from 'next/link'

const ROLE_STYLES: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  sales: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  viewer: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
}

export default function SettingsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [orgName, setOrgName] = useState('')
  const [profileName, setProfileName] = useState('')
  const [saving, setSaving] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const result = await getOrgSettings()
      if ('error' in result) return
      setData(result)
      setOrgName(result.org?.name ?? '')
      setProfileName(result.profile?.fullName ?? '')
      setLoading(false)
    }
    load()
  }, [])

  async function handleSaveOrg() {
    setSaving('org')
    await updateOrgName(orgName)
    setSaving(null)
    setSuccess('Organization name updated')
    setTimeout(() => setSuccess(null), 3000)
  }

  async function handleSaveProfile() {
    setSaving('profile')
    await updateProfile(profileName)
    setSaving(null)
    setSuccess('Profile updated')
    setTimeout(() => setSuccess(null), 3000)
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your organization and profile</p>
      </div>

      {success && (
        <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
          {success}
        </div>
      )}

      {/* Profile */}
      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Profile</h2>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Full Name</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={profileName}
              onChange={e => setProfileName(e.target.value)}
              className="h-9 flex-1 rounded-md border bg-background px-3 text-sm"
            />
            <Button onClick={handleSaveProfile} disabled={saving === 'profile'}>
              {saving === 'profile' ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      {/* Organization */}
      <div className="rounded-lg border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Organization</h2>
          {data?.org?.plan && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium capitalize text-primary">
              {data.org.plan} plan
            </span>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Organization Name</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              className="h-9 flex-1 rounded-md border bg-background px-3 text-sm"
            />
            <Button onClick={handleSaveOrg} disabled={saving === 'org'}>
              {saving === 'org' ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-2 text-sm">
          <div>
            <p className="text-muted-foreground">Slug</p>
            <p className="font-mono">{data?.org?.slug}</p>
          </div>
          <div>
            <p className="text-muted-foreground">AI Daily Cap</p>
            <p>${((data?.org?.ai_daily_cap_cents ?? 0) / 100).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Team Members</h2>
        {data?.members?.length === 0 ? (
          <p className="text-sm text-muted-foreground">No team members yet.</p>
        ) : (
          <div className="space-y-2">
            {data?.members?.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
                    {(m.fullName ?? '?')[0]?.toUpperCase()}
                  </div>
                  <p className="text-sm font-medium">{m.fullName}</p>
                </div>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${ROLE_STYLES[m.role] ?? ''}`}>
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Quick Links */}
      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">More</h2>
        <div className="flex flex-col gap-2">
          <Link href="/settings/audit-log" className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors">
            <div>
              <p className="text-sm font-medium">Audit Log</p>
              <p className="text-xs text-muted-foreground">View all activity and changes</p>
            </div>
            <span className="text-muted-foreground">&rarr;</span>
          </Link>
          <Link href="/projects" className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors">
            <div>
              <p className="text-sm font-medium">Projects</p>
              <p className="text-xs text-muted-foreground">Manage client projects from won deals</p>
            </div>
            <span className="text-muted-foreground">&rarr;</span>
          </Link>
          <Link href="/trash" className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors">
            <div>
              <p className="text-sm font-medium">Trash</p>
              <p className="text-xs text-muted-foreground">Restore or permanently remove deleted leads</p>
            </div>
            <span className="text-muted-foreground">&rarr;</span>
          </Link>
          <Link href="/settings/backups" className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors">
            <div>
              <p className="text-sm font-medium">Backups & Security</p>
              <p className="text-xs text-muted-foreground">Data protection, backups, and security overview</p>
            </div>
            <span className="text-muted-foreground">&rarr;</span>
          </Link>
          <Link href="/privacy" className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors">
            <div>
              <p className="text-sm font-medium">Privacy Policy</p>
              <p className="text-xs text-muted-foreground">How we handle your data</p>
            </div>
            <span className="text-muted-foreground">&rarr;</span>
          </Link>
          <Link href="/terms" className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors">
            <div>
              <p className="text-sm font-medium">Terms of Service</p>
              <p className="text-xs text-muted-foreground">Usage terms and conditions</p>
            </div>
            <span className="text-muted-foreground">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
