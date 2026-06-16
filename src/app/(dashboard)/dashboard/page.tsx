'use client'

import { useState, useEffect } from 'react'
import { getDashboardStats } from './actions'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from 'recharts'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users, Sparkles, Upload, TrendingUp, Flame, Target, DollarSign,
  UserPlus, CircleCheckBig, Clock, CalendarDays, CheckSquare, ArrowUpRight,
} from 'lucide-react'

const QUALITY_COLORS: Record<string, string> = {
  hot: '#ef4444',
  warm: '#f97316',
  cold: '#6366f1',
}

const STAGE_LABELS: Record<string, string> = {
  imported: 'Imported', researched: 'Researched', qualified: 'Qualified',
  contacted: 'Contacted', replied: 'Replied', meeting_booked: 'Meeting',
  proposal_sent: 'Proposal', negotiation: 'Negotiation',
  won: 'Won', lost: 'Lost', nurture: 'Nurture',
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

const ACTIVITY_ICONS: Record<string, typeof UserPlus> = {
  lead_created: UserPlus,
  task_done: CircleCheckBig,
}

const ACTIVITY_COLORS: Record<string, string> = {
  lead_created: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
  task_done: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
}

type Stats = Awaited<ReturnType<typeof getDashboardStats>>

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border bg-card px-3.5 py-2.5 shadow-lg">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: {p.value.toLocaleString()}
        </p>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    getDashboardStats().then(setStats)
  }, [])

  if (!stats) {
    return <DashboardSkeleton />
  }

  const topMetrics = [
    {
      label: 'Total Leads',
      value: stats.totalLeads.toLocaleString(),
      sub: `+${stats.newLeadsThisWeek} this week`,
      icon: Users,
      iconColor: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
      href: '/leads',
      trend: stats.newLeadsThisWeek > 0,
      trendLabel: stats.totalLeads > 0 ? `+${stats.newLeadsThisWeek}` : null,
    },
    {
      label: 'Qualified Leads',
      value: stats.qualifiedLeads.toLocaleString(),
      sub: stats.totalLeads > 0
        ? `${((stats.qualifiedLeads / stats.totalLeads) * 100).toFixed(1)}% of total`
        : 'No leads yet',
      icon: Target,
      iconColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
      href: '/leads',
      trend: stats.qualifiedLeads > 0,
      trendLabel: stats.totalLeads > 0 ? `${((stats.qualifiedLeads / stats.totalLeads) * 100).toFixed(1)}%` : null,
    },
    {
      label: 'Hot Leads',
      value: stats.hotLeads.toLocaleString(),
      sub: stats.totalLeads > 0
        ? `${((stats.hotLeads / stats.totalLeads) * 100).toFixed(1)}% of total`
        : 'No leads yet',
      icon: Flame,
      iconColor: 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400',
      href: '/leads',
      trend: stats.hotLeads > 0,
      trendLabel: stats.totalLeads > 0 ? `${((stats.hotLeads / stats.totalLeads) * 100).toFixed(1)}%` : null,
    },
    {
      label: 'Active Deals',
      value: stats.activeDeals.toLocaleString(),
      sub: stats.dealsValue > 0
        ? `$${stats.dealsValue.toLocaleString()} pipeline`
        : 'No open deals',
      icon: DollarSign,
      iconColor: 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400',
      href: '/deals',
      trend: stats.activeDeals > 0,
      trendLabel: stats.dealsValue > 0 ? `$${(stats.dealsValue / 1000).toFixed(0)}k` : null,
    },
  ]

  const pipelineChart = stats.pipelineBreakdown.map(p => ({
    name: STAGE_LABELS[p.stage] ?? p.stage,
    count: p.count,
  }))

  const qualityTotal = stats.qualityBreakdown.reduce((s, e) => s + e.count, 0)

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back{stats.userName ? `, ${stats.userName.split(' ')[0]}` : ''}!
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening with your pipeline today.
          </p>
        </div>
        <div className="hidden items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs text-muted-foreground sm:flex">
          <CalendarDays className="size-3.5" />
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* Primary metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {topMetrics.map(m => {
          const Icon = m.icon
          return (
            <Link
              key={m.label}
              href={m.href}
              className="group relative overflow-hidden rounded-xl border bg-card p-5 transition-all duration-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${m.iconColor}`}>
                  <Icon className="size-[18px]" />
                </div>
                {m.trend && m.trendLabel && (
                  <span className="flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <TrendingUp className="size-3" />
                    {m.trendLabel}
                  </span>
                )}
              </div>
              <div className="mt-4">
                <p className="text-[28px] font-bold leading-none tracking-tight">{m.value}</p>
                <p className="mt-1.5 text-xs text-muted-foreground">{m.label}</p>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground/70">{m.sub}</p>
            </Link>
          )
        })}
      </div>

      {/* Secondary metrics row */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Tasks Due', value: stats.tasksDue, icon: Clock, color: stats.tasksDue > 0 ? 'text-orange-600' : 'text-muted-foreground', href: '/tasks' as string | undefined },
          { label: 'Completed This Week', value: stats.tasksCompleted, icon: CheckSquare, color: 'text-emerald-600', href: '/tasks' as string | undefined },
          { label: 'AI Spend Today', value: `$${(stats.aiSpendToday / 100).toFixed(2)}`, icon: Sparkles, color: 'text-purple-600', href: undefined as string | undefined },
        ].map(m => {
          const Icon = m.icon
          const content = (
            <div className="flex items-center gap-3 rounded-xl border bg-card px-5 py-4 transition-all duration-200 hover:shadow-sm">
              <Icon className={`size-5 ${m.color}`} />
              <div>
                <p className="text-lg font-bold tracking-tight">{m.value}</p>
                <p className="text-xs text-muted-foreground">{m.label}</p>
              </div>
            </div>
          )
          return m.href ? (
            <Link key={m.label} href={m.href}>{content}</Link>
          ) : (
            <div key={m.label}>{content}</div>
          )
        })}
      </div>

      {stats.totalLeads === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Upload className="size-6 text-primary" />
          </div>
          <h3 className="mt-5 text-base font-semibold">Get started with your first import</h3>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
            Import a CSV file to populate your pipeline and start tracking leads.
          </p>
          <Link
            href="/import"
            className="mt-5 inline-flex h-9 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Import CSV
          </Link>
        </div>
      ) : (
        <>
          {/* Lead Growth Trend — area chart like the reference */}
          {stats.leadTrend.length > 0 && (
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Lead Growth</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">New leads &amp; cumulative total over 30 days</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-6 rounded-full bg-[#6366f1]" />
                    Cumulative
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-6 rounded-full bg-[#22c55e]" />
                    Daily New
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={stats.leadTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradCumulative" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="gradDaily" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="cumulative"
                      name="Cumulative"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      fill="url(#gradCumulative)"
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 2, fill: '#fff', stroke: '#6366f1' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="leads"
                      name="Daily New"
                      stroke="#22c55e"
                      strokeWidth={2}
                      fill="url(#gradDaily)"
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#22c55e' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Pipeline + Quality row */}
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Pipeline — horizontal progress bars */}
            {pipelineChart.length > 0 && (
              <div className="rounded-xl border bg-card p-5 lg:col-span-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold">Pipeline Overview</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {stats.totalLeads.toLocaleString()} leads across {pipelineChart.length} stages
                    </p>
                  </div>
                  <Link href="/pipeline" className="flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                    View pipeline <ArrowUpRight className="size-3" />
                  </Link>
                </div>
                <div className="mt-5 space-y-3">
                  {(() => {
                    const maxCount = Math.max(...pipelineChart.map(p => p.count), 1)
                    const stageColors = [
                      { bg: 'bg-indigo-500', light: 'bg-indigo-100 dark:bg-indigo-950/40' },
                      { bg: 'bg-violet-500', light: 'bg-violet-100 dark:bg-violet-950/40' },
                      { bg: 'bg-purple-500', light: 'bg-purple-100 dark:bg-purple-950/40' },
                      { bg: 'bg-fuchsia-500', light: 'bg-fuchsia-100 dark:bg-fuchsia-950/40' },
                      { bg: 'bg-pink-500', light: 'bg-pink-100 dark:bg-pink-950/40' },
                      { bg: 'bg-rose-500', light: 'bg-rose-100 dark:bg-rose-950/40' },
                      { bg: 'bg-orange-500', light: 'bg-orange-100 dark:bg-orange-950/40' },
                      { bg: 'bg-amber-500', light: 'bg-amber-100 dark:bg-amber-950/40' },
                      { bg: 'bg-emerald-500', light: 'bg-emerald-100 dark:bg-emerald-950/40' },
                      { bg: 'bg-teal-500', light: 'bg-teal-100 dark:bg-teal-950/40' },
                      { bg: 'bg-cyan-500', light: 'bg-cyan-100 dark:bg-cyan-950/40' },
                    ]
                    return pipelineChart.map((stage, idx) => {
                      const pct = stats.totalLeads > 0 ? ((stage.count / stats.totalLeads) * 100) : 0
                      const widthPct = Math.max((stage.count / maxCount) * 100, 2)
                      const colors = stageColors[idx % stageColors.length]
                      return (
                        <div key={stage.name} className="group">
                          <div className="mb-1.5 flex items-center justify-between">
                            <span className="text-xs font-medium text-foreground">{stage.name}</span>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-sm font-bold tabular-nums">{stage.count}</span>
                              <span className="text-[10px] text-muted-foreground">{pct.toFixed(1)}%</span>
                            </div>
                          </div>
                          <div className={`h-2.5 w-full rounded-full ${colors.light}`}>
                            <div
                              className={`h-full rounded-full ${colors.bg} transition-all duration-500 group-hover:opacity-80`}
                              style={{ width: `${widthPct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>
            )}

            {/* Quality donut with center label */}
            {stats.qualityBreakdown.length > 0 && (
              <div className="rounded-xl border bg-card p-5 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold">Lead Quality</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">Distribution by scoring</p>
                  </div>
                  <Link href="/leads" className="flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                    Details <ArrowUpRight className="size-3" />
                  </Link>
                </div>
                <div className="mt-4 flex flex-col items-center">
                  {/* Donut with center text */}
                  <div className="relative">
                    <ResponsiveContainer width={180} height={180}>
                      <PieChart>
                        <Pie
                          data={stats.qualityBreakdown}
                          dataKey="count"
                          nameKey="quality"
                          cx="50%"
                          cy="50%"
                          outerRadius={85}
                          innerRadius={58}
                          strokeWidth={3}
                          stroke="var(--card)"
                          paddingAngle={3}
                        >
                          {stats.qualityBreakdown.map((entry) => (
                            <Cell key={entry.quality} fill={QUALITY_COLORS[entry.quality] ?? '#94a3b8'} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold tracking-tight">{qualityTotal}</span>
                      <span className="text-[10px] text-muted-foreground">Total</span>
                    </div>
                  </div>
                  {/* Legend — horizontal pills */}
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {stats.qualityBreakdown.map(entry => {
                      const pct = qualityTotal > 0
                        ? ((entry.count / qualityTotal) * 100).toFixed(0)
                        : '0'
                      return (
                        <div key={entry.quality} className="flex items-center gap-1.5 rounded-full border px-3 py-1.5">
                          <span
                            className="inline-block h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: QUALITY_COLORS[entry.quality] ?? '#94a3b8' }}
                          />
                          <span className="text-xs font-medium capitalize">{entry.quality}</span>
                          <span className="text-[10px] text-muted-foreground">{pct}%</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          {stats.recentActivity.length > 0 && (
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Recent Activity</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">Latest updates across your pipeline</p>
                </div>
              </div>
              <div className="mt-4 divide-y">
                {stats.recentActivity.map(item => {
                  const Icon = ACTIVITY_ICONS[item.type] ?? UserPlus
                  const color = ACTIVITY_COLORS[item.type] ?? 'bg-muted text-muted-foreground'
                  return (
                    <div key={item.id + item.type} className="flex items-center gap-3.5 py-3 first:pt-0 last:pb-0">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground/60">{timeAgo(item.time)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Primary metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-5">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="mt-4 h-7 w-20" />
            <Skeleton className="mt-2 h-3 w-24" />
            <Skeleton className="mt-2 h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Secondary metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border bg-card px-5 py-4">
            <Skeleton className="h-5 w-5 rounded" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-xl border bg-card p-5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-1.5 h-3 w-56" />
        <Skeleton className="mt-5 h-[280px] w-full rounded-lg" />
      </div>
    </div>
  )
}
