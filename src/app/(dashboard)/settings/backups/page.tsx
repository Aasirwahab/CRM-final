'use client'

import Link from 'next/link'

export default function BackupsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/settings" className="text-sm text-muted-foreground hover:text-foreground">&larr; Settings</Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Backups & Recovery</h1>
        <p className="text-sm text-muted-foreground">Your data protection overview</p>
      </div>

      {/* Automatic Backups */}
      <div className="rounded-lg border p-6 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <h2 className="text-lg font-semibold">Automatic Backups</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Supabase automatically creates daily backups of your entire database.
          Backups are retained based on your plan tier.
        </p>
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Backup Frequency</p>
            <p className="text-sm font-medium">Daily</p>
          </div>
          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Retention Period</p>
            <p className="text-sm font-medium">7 days (Free) / 30 days (Pro)</p>
          </div>
          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Encryption</p>
            <p className="text-sm font-medium">AES-256 at rest</p>
          </div>
          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="text-sm font-medium text-green-600">Active</p>
          </div>
        </div>
      </div>

      {/* Point-in-Time Recovery */}
      <div className="rounded-lg border p-6 space-y-3">
        <h2 className="text-lg font-semibold">Point-in-Time Recovery (PITR)</h2>
        <p className="text-sm text-muted-foreground">
          Available on Pro plan and above. PITR allows you to restore your database to any
          point in time within the retention window, down to the second.
        </p>
        <div className="rounded-md bg-yellow-500/10 p-3">
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            PITR is managed through your Supabase dashboard. Go to{' '}
            <strong>Project Settings &gt; Database &gt; Backups</strong> to configure.
          </p>
        </div>
      </div>

      {/* Data Export */}
      <div className="rounded-lg border p-6 space-y-3">
        <h2 className="text-lg font-semibold">Manual Data Export</h2>
        <p className="text-sm text-muted-foreground">
          You can export your data at any time for personal backups or migration.
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span><strong>Leads & Contacts:</strong> Export from the Leads page as CSV</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span><strong>Activity Log:</strong> View complete audit trail in Settings &gt; Audit Log</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span><strong>Full Database:</strong> Use Supabase dashboard &gt; SQL Editor to run custom exports</span>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="rounded-lg border p-6 space-y-3">
        <h2 className="text-lg font-semibold">Security Measures</h2>
        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs dark:bg-green-900/30 dark:text-green-400">&#10003;</span>
            <span>Row Level Security (RLS) on all tables</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs dark:bg-green-900/30 dark:text-green-400">&#10003;</span>
            <span>Multi-tenant organization isolation</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs dark:bg-green-900/30 dark:text-green-400">&#10003;</span>
            <span>TLS encryption in transit</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs dark:bg-green-900/30 dark:text-green-400">&#10003;</span>
            <span>AES-256 encryption at rest</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs dark:bg-green-900/30 dark:text-green-400">&#10003;</span>
            <span>Rate limiting on all sensitive actions</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs dark:bg-green-900/30 dark:text-green-400">&#10003;</span>
            <span>Security headers (HSTS, X-Frame-Options, CSP)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs dark:bg-green-900/30 dark:text-green-400">&#10003;</span>
            <span>CSV formula injection protection</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs dark:bg-green-900/30 dark:text-green-400">&#10003;</span>
            <span>Input validation with Zod schemas</span>
          </div>
        </div>
      </div>
    </div>
  )
}
