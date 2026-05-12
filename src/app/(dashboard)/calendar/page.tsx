'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { getCalendarItems, type CalendarTask, type CalendarDeal } from './actions'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-gray-400',
}

type DayItems = {
  tasks: CalendarTask[]
  deals: CalendarDeal[]
}

export default function CalendarPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [tasks, setTasks] = useState<CalendarTask[]>([])
  const [deals, setDeals] = useState<CalendarDeal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    // Get first day of month and last day of month
    const from = new Date(year, month, 1).toISOString()
    const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString()
    const result = await getCalendarItems({ from, to })
    setTasks(result.tasks)
    setDeals(result.deals)
    setLoading(false)
  }, [year, month])

  useEffect(() => { load() }, [load])

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
    setSelectedDate(null)
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
    setSelectedDate(null)
  }

  function goToday() {
    setYear(today.getFullYear())
    setMonth(today.getMonth())
    setSelectedDate(null)
  }

  // Build calendar grid
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Map items to date strings (YYYY-MM-DD)
  function dateKey(isoString: string): string {
    return isoString.slice(0, 10)
  }

  const itemsByDate: Record<string, DayItems> = {}
  for (const task of tasks) {
    const key = dateKey(task.due_at)
    if (!itemsByDate[key]) itemsByDate[key] = { tasks: [], deals: [] }
    itemsByDate[key].tasks.push(task)
  }
  for (const deal of deals) {
    const key = dateKey(deal.expected_close_date)
    if (!itemsByDate[key]) itemsByDate[key] = { tasks: [], deals: [] }
    itemsByDate[key].deals.push(deal)
  }

  // Selected date items
  const selectedItems = selectedDate ? itemsByDate[selectedDate] : null

  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground">
            Tasks and deals for {MONTH_NAMES[month]} {year}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevMonth}>&#8249;</Button>
          <Button variant="outline" size="sm" onClick={goToday}>Today</Button>
          <Button variant="outline" size="sm" onClick={nextMonth}>&#8250;</Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" /> Task
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" /> Deal
        </span>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="flex gap-4">
          {/* Calendar Grid */}
          <div className="flex-1">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b">
              {DAY_NAMES.map(d => (
                <div key={d} className="px-1 py-2 text-center text-xs font-medium text-muted-foreground">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
              {/* Empty cells before first day */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[80px] border-b border-r bg-muted/20 p-1" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const items = itemsByDate[key]
                const isToday = key === todayKey
                const isSelected = key === selectedDate
                const taskCount = items?.tasks.length ?? 0
                const dealCount = items?.deals.length ?? 0

                return (
                  <div
                    key={day}
                    onClick={() => setSelectedDate(key === selectedDate ? null : key)}
                    className={`min-h-[80px] cursor-pointer border-b border-r p-1 transition-colors hover:bg-muted/30 ${
                      isSelected ? 'bg-primary/10 ring-1 ring-primary' : ''
                    }`}
                  >
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                      isToday ? 'bg-primary text-primary-foreground' : ''
                    }`}>
                      {day}
                    </span>

                    {/* Item dots */}
                    {(taskCount > 0 || dealCount > 0) && (
                      <div className="mt-0.5 space-y-0.5">
                        {items!.tasks.slice(0, 2).map(t => (
                          <div key={t.id} className="flex items-center gap-1 truncate">
                            <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT[t.priority] ?? 'bg-blue-500'}`} />
                            <span className="truncate text-[10px] text-muted-foreground">{t.title}</span>
                          </div>
                        ))}
                        {items!.deals.slice(0, 2).map(d => (
                          <div key={d.id} className="flex items-center gap-1 truncate">
                            <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                            <span className="truncate text-[10px] text-muted-foreground">{d.title}</span>
                          </div>
                        ))}
                        {taskCount + dealCount > 4 && (
                          <span className="text-[10px] text-muted-foreground">+{taskCount + dealCount - 4} more</span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Side panel — selected day detail */}
          {selectedDate && (
            <div className="w-72 shrink-0 space-y-3 rounded-lg border p-3">
              <h3 className="text-sm font-semibold">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long', month: 'long', day: 'numeric',
                })}
              </h3>

              {!selectedItems || (selectedItems.tasks.length === 0 && selectedItems.deals.length === 0) ? (
                <p className="text-xs text-muted-foreground">Nothing scheduled</p>
              ) : (
                <>
                  {/* Tasks */}
                  {selectedItems.tasks.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-medium text-muted-foreground uppercase">
                        Tasks ({selectedItems.tasks.length})
                      </p>
                      <div className="space-y-1.5">
                        {selectedItems.tasks.map(t => (
                          <div key={t.id} className="rounded-md border p-2">
                            <p className={`text-xs font-medium ${t.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                              {t.title}
                            </p>
                            <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span className={`inline-flex rounded-full px-1.5 py-0.5 font-medium capitalize ${
                                t.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                t.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {t.priority}
                              </span>
                              <span className="capitalize">{t.status.replace('_', ' ')}</span>
                              {t.company_name && <span>{t.company_name}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Deals */}
                  {selectedItems.deals.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-medium text-muted-foreground uppercase">
                        Deals ({selectedItems.deals.length})
                      </p>
                      <div className="space-y-1.5">
                        {selectedItems.deals.map(d => (
                          <div key={d.id} className="rounded-md border p-2">
                            <p className="text-xs font-medium">{d.title}</p>
                            <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span className={`inline-flex rounded-full px-1.5 py-0.5 font-medium capitalize ${
                                d.status === 'won' ? 'bg-green-100 text-green-700' :
                                d.status === 'lost' ? 'bg-red-100 text-red-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {d.status}
                              </span>
                              {d.value != null && <span>${Number(d.value).toLocaleString()}</span>}
                              {d.company_name && <span>{d.company_name}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
