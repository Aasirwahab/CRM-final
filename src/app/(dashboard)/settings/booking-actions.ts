'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { RATE_LIMITS } from '@/lib/rate-limit'

export type BookingSettingsData = {
  isEnabled: boolean
  meetingDuration: number
  bufferMinutes: number
  timezone: string
  availableDays: number[]
  startHour: number
  endHour: number
  bookingTitle: string
  bookingDescription: string | null
  ownerProfileId: string | null
  googleConnected: boolean
  googleEmail: string | null
  bookingUrl: string | null
}

export async function getBookingSettings(): Promise<BookingSettingsData | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const service = createServiceClient()

  const { data: profile } = await service
    .from('profiles')
    .select('id, default_organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.default_organization_id) return { error: 'No org' }

  const { data: org } = await service
    .from('organizations')
    .select('slug')
    .eq('id', profile.default_organization_id)
    .single()

  const { data: settings } = await service
    .from('booking_settings')
    .select('*')
    .eq('organization_id', profile.default_organization_id)
    .maybeSingle()

  const { data: googleToken } = await service
    .from('google_oauth_tokens')
    .select('calendar_email')
    .eq('organization_id', profile.default_organization_id)
    .maybeSingle()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  return {
    isEnabled: settings?.is_enabled ?? false,
    meetingDuration: settings?.meeting_duration ?? 30,
    bufferMinutes: settings?.buffer_minutes ?? 10,
    timezone: settings?.timezone ?? 'Asia/Kolkata',
    availableDays: settings?.available_days ?? [1, 2, 3, 4, 5],
    startHour: settings?.start_hour ?? 9,
    endHour: settings?.end_hour ?? 17,
    bookingTitle: settings?.booking_title ?? 'Book a Meeting',
    bookingDescription: settings?.booking_description ?? null,
    ownerProfileId: settings?.owner_profile_id ?? profile.id,
    googleConnected: !!googleToken,
    googleEmail: googleToken?.calendar_email ?? null,
    bookingUrl: org?.slug ? `${appUrl}/book/${org.slug}` : null,
  }
}

export async function saveBookingSettings(data: {
  isEnabled: boolean
  meetingDuration: number
  bufferMinutes: number
  timezone: string
  availableDays: number[]
  startHour: number
  endHour: number
  bookingTitle: string
  bookingDescription: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const service = createServiceClient()

  const { data: profile } = await service
    .from('profiles')
    .select('id, default_organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.default_organization_id) return { error: 'No org' }

  const rl = await RATE_LIMITS.write(user.id)
  if (!rl.success) return { error: `Too many requests. Try again in ${rl.resetIn}s.` }

  const { error } = await service
    .from('booking_settings')
    .upsert(
      {
        organization_id: profile.default_organization_id,
        is_enabled: data.isEnabled,
        meeting_duration: data.meetingDuration,
        buffer_minutes: data.bufferMinutes,
        timezone: data.timezone,
        available_days: data.availableDays,
        start_hour: data.startHour,
        end_hour: data.endHour,
        booking_title: data.bookingTitle,
        booking_description: data.bookingDescription,
        owner_profile_id: profile.id,
      },
      { onConflict: 'organization_id' }
    )

  if (error) return { error: 'Failed to save settings' }
  return { success: true }
}

export async function disconnectGoogleCalendar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const service = createServiceClient()

  const { data: profile } = await service
    .from('profiles')
    .select('id, default_organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.default_organization_id) return { error: 'No org' }

  await service
    .from('google_oauth_tokens')
    .delete()
    .eq('profile_id', profile.id)
    .eq('organization_id', profile.default_organization_id)

  return { success: true }
}
