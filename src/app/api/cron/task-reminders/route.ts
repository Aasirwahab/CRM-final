import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendTaskReminderEmail } from '@/lib/email'

// This endpoint is called by a cron job (e.g., Vercel Cron) once a day at 8:00 AM
// GET /api/cron/task-reminders?key=CRON_SECRET

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const cronSecret = request.nextUrl.searchParams.get('key')
  if (cronSecret !== process.env.CRON_SECRET && process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()

  // Get today's date range
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()

  // Get all tasks due today that are not completed
  const { data: tasks } = await service
    .from('tasks')
    .select(`
      id, title, due_date, priority,
      assigned_to,
      profiles:assigned_to(full_name, user_id)
    `)
    .gte('due_date', startOfDay)
    .lt('due_date', endOfDay)
    .in('status', ['pending', 'in_progress'])

  if (!tasks || tasks.length === 0) {
    return NextResponse.json({ message: 'No tasks due today', sent: 0 })
  }

  // Group tasks by assignee
  const tasksByUser = new Map<string, { name: string; email: string; tasks: { title: string; dueDate: string; priority: string }[] }>()

  for (const task of tasks) {
    const profile = (task as any).profiles
    if (!profile?.user_id) continue

    // Get user email from auth
    const { data: authUser } = await service.auth.admin.getUserById(profile.user_id)
    if (!authUser?.user?.email) continue

    const userId = profile.user_id
    if (!tasksByUser.has(userId)) {
      tasksByUser.set(userId, {
        name: profile.full_name ?? 'Team Member',
        email: authUser.user.email,
        tasks: [],
      })
    }

    tasksByUser.get(userId)!.tasks.push({
      title: task.title,
      dueDate: new Date(task.due_date).toLocaleDateString(),
      priority: task.priority,
    })
  }

  // Send emails
  let sent = 0
  for (const [, user] of tasksByUser) {
    const result = await sendTaskReminderEmail(user.email, user.name, user.tasks)
    if (result.success) sent++
  }

  return NextResponse.json({ message: `Sent ${sent} reminder emails`, sent })
}
