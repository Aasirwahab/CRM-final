'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar, Link2, ExternalLink, Copy, Check, Unplug } from 'lucide-react'
import { getBookingSettings, saveBookingSettings, disconnectGoogleCalendar, type BookingSettingsData } from './booking-actions'

const DAYS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
]

const TIMEZONES = [
  'Asia/Kolkata',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
]

export function BookingSettings() {
  const [data, setData] = useState<BookingSettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [isEnabled, setIsEnabled] = useState(false)
  const [meetingDuration, setMeetingDuration] = useState(30)
  const [bufferMinutes, setBufferMinutes] = useState(10)
  const [timezone, setTimezone] = useState('Asia/Kolkata')
  const [availableDays, setAvailableDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [startHour, setStartHour] = useState(9)
  const [endHour, setEndHour] = useState(17)
  const [bookingTitle, setBookingTitle] = useState('Book a Meeting')
  const [bookingDescription, setBookingDescription] = useState('')

  useEffect(() => {
    getBookingSettings().then(result => {
      if ('error' in result) return
      setData(result)
      setIsEnabled(result.isEnabled)
      setMeetingDuration(result.meetingDuration)
      setBufferMinutes(result.bufferMinutes)
      setTimezone(result.timezone)
      setAvailableDays(result.availableDays)
      setStartHour(result.startHour)
      setEndHour(result.endHour)
      setBookingTitle(result.bookingTitle)
      setBookingDescription(result.bookingDescription ?? '')
      setLoading(false)
    })
  }, [])

  async function handleSave() {
    setSaving(true)
    await saveBookingSettings({
      isEnabled,
      meetingDuration,
      bufferMinutes,
      timezone,
      availableDays,
      startHour,
      endHour,
      bookingTitle,
      bookingDescription: bookingDescription.trim() || null,
    })
    setSaving(false)
    setSuccess('Booking settings saved')
    setTimeout(() => setSuccess(null), 3000)
  }

  async function handleDisconnect() {
    await disconnectGoogleCalendar()
    setData(prev => prev ? { ...prev, googleConnected: false, googleEmail: null } : null)
  }

  function handleCopyLink() {
    if (data?.bookingUrl) {
      navigator.clipboard.writeText(data.bookingUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function toggleDay(day: number) {
    setAvailableDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    )
  }

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Calendar className="size-[18px] text-primary" />
          </div>
          <h2 className="text-base font-semibold">Booking Page</h2>
        </div>
        <div className="mt-4 flex items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Calendar className="size-[18px] text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Booking Page</h2>
            <p className="text-xs text-muted-foreground">Let leads book meetings with you</p>
          </div>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input type="checkbox" checked={isEnabled} onChange={e => setIsEnabled(e.target.checked)} className="peer sr-only" aria-label="Enable booking page" />
          <div className="h-6 w-11 rounded-full bg-muted peer-checked:bg-emerald-500 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-muted after:bg-white after:transition-all peer-checked:after:translate-x-full" />
        </label>
      </div>

      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
          {success}
        </div>
      )}

      {/* Google Calendar Connection */}
      <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Google Calendar</p>
            <p className="text-xs text-muted-foreground">
              {data?.googleConnected ? `Connected as ${data.googleEmail}` : 'Connect to check availability & create meetings'}
            </p>
          </div>
          {data?.googleConnected ? (
            <Button variant="outline" size="sm" onClick={handleDisconnect} className="gap-1.5 text-xs">
              <Unplug className="h-3.5 w-3.5" /> Disconnect
            </Button>
          ) : (
            <a href="/api/auth/google-calendar/connect">
              <Button size="sm" className="gap-1.5 text-xs">
                <Link2 className="h-3.5 w-3.5" /> Connect
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Booking URL */}
      {data?.bookingUrl && isEnabled && (
        <div className="rounded-lg border bg-muted/20 p-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Your Booking Link</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg border bg-background px-3 py-2 text-xs">
              {data.bookingUrl}
            </code>
            <Button variant="outline" size="sm" onClick={handleCopyLink} className="shrink-0 gap-1.5">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <a href={data.bookingUrl} target="_blank" rel="noopener noreferrer" aria-label="Open booking page">
              <Button variant="outline" size="sm" className="shrink-0">
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          </div>
        </div>
      )}

      {/* Settings form */}
      <div className="space-y-4">
        <div>
          <label htmlFor="booking-title" className="mb-1.5 block text-sm font-medium text-muted-foreground">Page Title</label>
          <input
            id="booking-title"
            type="text"
            value={bookingTitle}
            onChange={e => setBookingTitle(e.target.value)}
            className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>

        <div>
          <label htmlFor="booking-desc" className="mb-1.5 block text-sm font-medium text-muted-foreground">Description <span className="text-xs text-muted-foreground/60">(optional)</span></label>
          <input
            id="booking-desc"
            type="text"
            value={bookingDescription}
            onChange={e => setBookingDescription(e.target.value)}
            placeholder="e.g. Let's discuss your project needs"
            className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="meeting-duration" className="mb-1.5 block text-sm font-medium text-muted-foreground">Meeting Duration</label>
            <select
              id="meeting-duration"
              value={meetingDuration}
              onChange={e => setMeetingDuration(Number(e.target.value))}
              className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>
          <div>
            <label htmlFor="buffer-minutes" className="mb-1.5 block text-sm font-medium text-muted-foreground">Buffer Between</label>
            <select
              id="buffer-minutes"
              value={bufferMinutes}
              onChange={e => setBufferMinutes(Number(e.target.value))}
              className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            >
              <option value={0}>No buffer</option>
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="booking-tz" className="mb-1.5 block text-sm font-medium text-muted-foreground">Timezone</label>
          <select
            id="booking-tz"
            value={timezone}
            onChange={e => setTimezone(e.target.value)}
            className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
          >
            {TIMEZONES.map(tz => (
              <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-muted-foreground">Available Days</label>
          <div className="flex gap-1.5">
            {DAYS.map(day => (
              <button
                key={day.value}
                onClick={() => toggleDay(day.value)}
                className={`flex h-9 w-11 items-center justify-center rounded-lg border text-xs font-medium transition-colors ${
                  availableDays.includes(day.value)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-muted bg-muted/20 text-muted-foreground hover:bg-muted/40'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="start-hour" className="mb-1.5 block text-sm font-medium text-muted-foreground">Start Time</label>
            <select
              id="start-hour"
              value={startHour}
              onChange={e => setStartHour(Number(e.target.value))}
              className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="end-hour" className="mb-1.5 block text-sm font-medium text-muted-foreground">End Time</label>
            <select
              id="end-hour"
              value={endHour}
              onChange={e => setEndHour(Number(e.target.value))}
              className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? 'Saving...' : 'Save Booking Settings'}
      </Button>
    </div>
  )
}
