'use server'

import { createClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/email'

export async function sendWelcome() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { error: 'Not authenticated' }

  const name = user.user_metadata?.full_name ?? user.email.split('@')[0]
  await sendWelcomeEmail(user.email, name)
  return { success: true }
}
