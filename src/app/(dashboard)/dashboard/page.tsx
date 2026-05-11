'use client'

import { useState, useEffect } from 'react'
import { getDashboardStats } from './actions'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import Link from 'next/link'

const QUALITY_COLORS: Record<string, string> = { hot: '#ef4444', warm: '#f97316', cold: '#3b82f6' }

const STAGE_LABELS: Record<string, string> = {
  imported: 'Imported',
  researched: 'Researched',
  qualified: 'Qualified',
  contacted: 'Contacted',
  replied: 'Replied',
  meeting_booked: 'Meeting',
  proposal_sent: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
  nurture: 'Nurture',
}

export default function DashboardPage() {
  const [stats, setStats] = useState<{
    totalLeads: number
    activeDeals: number
    tasksDue: number
    aiSpendToday: number
    pipelineBreakdown: { stage: string; count: number }[]
    qualityBreakdown: { quality: string; count: number }[]
  } | null>(null)

  useEffect(() => {
    getDashboardStats().then(setStats)
  }, [])

  if (!stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const cards = [
    { label: 'Total Leads', value: stats.totalLeads, href: '/leads' },
    { label: 'Active Deals', value: stats.activeDeals, href: '/pipeline' },
    { label: 'Tasks Due', value: stats.tasksDue, href: '/tasks' },
    { label: 'AI Spend Today', value: `$${(stats.aiSpendToday / 100).toFixed(2)}`, href: undefined },
  ]

  const pipelineChart = stats.pipelineBreakdown.map(p => ({
    name: STAGE_LABELS[p.stage] ?? p.stage,
    count: p.count,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your sales pipeline and activity</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(c => (
          <div key={c.label} className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">{c.label}</p>
            {c.href ? (
              <Link href={c.href} className="mt-1 block text-2xl font-semibold hover:text-primary">
                {c.value}
              </Link>
            ) : (
              <p className="mt-1 text-2xl font-semibold">{c.value}</p>
            )}
          </div>
        ))}
      </div>

      {stats.totalLeads === 0 ? (
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Import your first CSV to get started. Head to the <Link href="/import" className="text-primary hover:underline">Import page</Link>.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pipeline chart */}
          {pipelineChart.length > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <h2 className="mb-4 text-sm font-medium text-muted-foreground">Pipeline Breakdown</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={pipelineChart}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Quality pie chart */}
          {stats.qualityBreakdown.length > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <h2 className="mb-4 text-sm font-medium text-muted-foreground">Lead Quality</h2>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.qualityBreakdown}
                    dataKey="count"
                    nameKey="quality"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }: any) => `${name}: ${value}`}
                  >
                    {stats.qualityBreakdown.map((entry) => (
                      <Cell key={entry.quality} fill={QUALITY_COLORS[entry.quality] ?? '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
