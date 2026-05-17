import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { exchangeCodeForTokens, getCalendarEmail } from '@/lib/google-calendar'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').split(',')[0].trim()

  if (error || !code || !state) {
    return NextResponse.redirect(new URL('/settings?gcal=error', appUrl))
  }

  try {
    const { userId } = JSON.parse(Buffer.from(state, 'base64url').toString())

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== userId) {
      return NextResponse.redirect(new URL('/sign-in', appUrl))
    }

    const tokens = await exchangeCodeForTokens(code)
    const calendarEmail = await getCalendarEmail(tokens.access_token)

    const service = createServiceClient()
    const { data: profile } = await service
      .from('profiles')
      .select('id, default_organization_id')
      .eq('user_id', user.id)
      .single()

    if (!profile?.default_organization_id) {
      return NextResponse.redirect(new URL('/settings?gcal=error', appUrl))
    }

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    await service.from('google_oauth_tokens').upsert(
      {
        profile_id: profile.id,
        organization_id: profile.default_organization_id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt,
        calendar_email: calendarEmail,
      },
      { onConflict: 'profile_id,organization_id' }
    )

    return NextResponse.redirect(new URL('/settings?gcal=connected', appUrl))
  } catch {
    return NextResponse.redirect(new URL('/settings?gcal=error', appUrl))
  }
}
