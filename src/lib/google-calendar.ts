const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!

function getAppUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return raw.split(',')[0].trim()
}

const REDIRECT_URI = `${getAppUrl()}/api/auth/google-calendar/callback`

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.freebusy',
  'https://www.googleapis.com/auth/userinfo.email',
]

export function getGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export async function exchangeCodeForTokens(code: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Token exchange failed: ${err}`)
  }
  return res.json() as Promise<{
    access_token: string
    refresh_token: string
    expires_in: number
    token_type: string
  }>
}

export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error('Failed to refresh token')
  return res.json() as Promise<{
    access_token: string
    expires_in: number
  }>
}

export async function getCalendarEmail(accessToken: string): Promise<string> {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('Failed to get user info')
  const data = await res.json()
  return data.email
}

export async function getFreeBusySlots(
  accessToken: string,
  calendarEmail: string,
  timeMin: string,
  timeMax: string
): Promise<{ start: string; end: string }[]> {
  const res = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      items: [{ id: calendarEmail }],
    }),
  })
  if (!res.ok) throw new Error('Failed to get free/busy')
  const data = await res.json()
  return data.calendars?.[calendarEmail]?.busy ?? []
}

export async function createCalendarEvent(
  accessToken: string,
  event: {
    summary: string
    description?: string
    startTime: string
    endTime: string
    attendeeEmail: string
    timezone: string
  }
): Promise<{ eventId: string; meetLink: string }> {
  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: event.summary,
        description: event.description ?? '',
        start: { dateTime: event.startTime, timeZone: event.timezone },
        end: { dateTime: event.endTime, timeZone: event.timezone },
        attendees: [{ email: event.attendeeEmail }],
        conferenceData: {
          createRequest: {
            requestId: crypto.randomUUID(),
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
        reminders: {
          useDefault: false,
          overrides: [{ method: 'email', minutes: 30 }],
        },
      }),
    }
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Failed to create event: ${err}`)
  }
  const data = await res.json()
  return {
    eventId: data.id,
    meetLink: data.hangoutLink ?? data.conferenceData?.entryPoints?.[0]?.uri ?? '',
  }
}

export async function getValidAccessToken(
  storedToken: {
    access_token: string
    refresh_token: string
    token_expires_at: string
  },
  updateCallback: (newAccessToken: string, expiresAt: string) => Promise<void>
): Promise<string> {
  const expiresAt = new Date(storedToken.token_expires_at)
  const now = new Date()
  const bufferMs = 5 * 60 * 1000

  if (expiresAt.getTime() - now.getTime() > bufferMs) {
    return storedToken.access_token
  }

  const refreshed = await refreshAccessToken(storedToken.refresh_token)
  const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
  await updateCallback(refreshed.access_token, newExpiresAt)
  return refreshed.access_token
}
