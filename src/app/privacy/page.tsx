import Link from 'next/link'
import { Shield, Database, Eye, Calendar, Brain, Share2, UserCheck, Cookie, Clock, Bell, Mail } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy — LeadFlow CRM',
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4.5 w-4.5 text-primary" />
        </div>
        <h2 className="text-lg font-semibold m-0">{title}</h2>
      </div>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-3">{children}</div>
    </div>
  )
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground no-underline hover:text-foreground transition-colors"
        >
          &larr; Back to Home
        </Link>

        <div className="mt-8 mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
            <Shield className="h-3.5 w-3.5" />
            Privacy Policy
          </div>
          <h1 className="text-3xl font-bold tracking-tight">How we protect your data</h1>
          <p className="mt-2 text-muted-foreground">
            Last updated: May 12, 2026
          </p>
        </div>

        <div className="space-y-4">
          <Section icon={Database} title="Information We Collect">
            <p>
              When you create an account, we collect your <strong className="text-foreground">name, email address,
              and organization details</strong>. When you use our CRM features, we process lead data, contact
              information, and business records that you import or create within the platform.
            </p>
          </Section>

          <Section icon={Eye} title="How We Use Your Information">
            <ul className="list-none p-0 m-0 space-y-2">
              {[
                'Provide and maintain the LeadFlow CRM service',
                'Process CSV imports, AI research, and lead scoring',
                'Send transactional emails (welcome, import complete, task reminders)',
                'Manage booking pages and calendar integrations',
                'Improve our service and fix bugs',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={Calendar} title="Google Calendar Integration">
            <p>
              When you connect your Google Calendar, we request access to view your calendar
              availability and create events on your behalf:
            </p>
            <div className="rounded-lg border border-border/50 bg-background/50 p-4 space-y-3">
              <div>
                <p className="font-medium text-foreground text-xs uppercase tracking-wide mb-1">Free/Busy Access (calendar.freebusy)</p>
                <p className="m-0">Used solely to check your availability (free/busy status) so we can display open time slots on your public booking page. We cannot see event titles, descriptions, or attendees — only whether a time slot is free or busy.</p>
              </div>
              <div className="border-t border-border/50 pt-3">
                <p className="font-medium text-foreground text-xs uppercase tracking-wide mb-1">Event Creation (calendar.events)</p>
                <p className="m-0">Used solely to create a new calendar event with a Google Meet link when a lead books a meeting through your booking page. We only create events — we do not read, modify, or delete your existing events.</p>
              </div>
              <div className="border-t border-border/50 pt-3">
                <p className="font-medium text-foreground text-xs uppercase tracking-wide mb-1">Email Address (userinfo.email)</p>
                <p className="m-0">Used to identify your Google account when connecting your calendar. No other profile information is accessed.</p>
              </div>
            </div>
            <p>
              We do <strong className="text-foreground">not</strong> read, store, share, or export any of your
              existing calendar events. Your Google Calendar data is not used for advertising, analytics, or
              any purpose other than booking.
            </p>
            <p>
              You can disconnect Google Calendar at any time from Settings. We immediately stop accessing
              your data and delete stored access tokens.
            </p>
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs">
              LeadFlow CRM&apos;s use of information received from Google APIs adheres to the{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </div>
          </Section>

          <Section icon={Brain} title="AI Data Processing">
            <p>
              When you use AI Research features, lead data (company name, website, contact info) is sent
              to OpenAI for analysis. We do <strong className="text-foreground">not</strong> use your data
              to train AI models. AI-generated insights are stored in your organization&apos;s database
              and are not shared with other users.
            </p>
          </Section>

          <Section icon={Shield} title="Data Storage & Security">
            <ul className="list-none p-0 m-0 space-y-2">
              {[
                'Stored in Supabase (PostgreSQL) with Row Level Security for strict multi-tenant isolation',
                'Encrypted in transit (TLS) and at rest',
                'Protected by security headers, rate limiting, and input validation',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                  {item}
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={Share2} title="Data Sharing">
            <p>
              We do <strong className="text-foreground">not sell your data</strong>. We share data only with
              service providers necessary to operate the platform:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'Supabase', use: 'Database' },
                { name: 'OpenAI', use: 'AI features' },
                { name: 'Resend', use: 'Email delivery' },
                { name: 'Google Calendar', use: 'Booking' },
              ].map((provider) => (
                <div key={provider.name} className="rounded-lg border border-border/50 bg-background/50 px-3 py-2">
                  <p className="font-medium text-foreground text-sm m-0">{provider.name}</p>
                  <p className="text-xs m-0">{provider.use}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section icon={UserCheck} title="Your Rights">
            <ul className="list-none p-0 m-0 space-y-2">
              {[
                ['Access', 'Export your data at any time from Settings'],
                ['Deletion', 'Request account deletion by contacting support'],
                ['Correction', 'Update your profile and organization data in Settings'],
                ['Portability', 'Export leads and contacts as CSV'],
                ['Revoke access', 'Disconnect third-party integrations at any time'],
              ].map(([label, desc]) => (
                <li key={label} className="flex items-start gap-2">
                  <span className="font-medium text-foreground shrink-0 w-24">{label}</span>
                  <span>{desc}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={Cookie} title="Cookies">
            <p>
              We use <strong className="text-foreground">essential cookies only</strong> for authentication
              session management. No tracking cookies or third-party advertising cookies.
            </p>
          </Section>

          <Section icon={Clock} title="Data Retention">
            <ul className="list-none p-0 m-0 space-y-2">
              {[
                'Active account data is retained as long as your account exists',
                'Deleted leads can be restored from Trash',
                'Permanently deleted data is removed within 30 days',
                'Account data is deleted within 90 days of account closure',
                'Google Calendar tokens are deleted immediately on disconnect',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={Bell} title="Changes to This Policy">
            <p>
              We may update this policy from time to time. We will notify you of significant changes
              via email or in-app notification.
            </p>
          </Section>

          <Section icon={Mail} title="Contact">
            <p>
              For privacy-related questions, contact us at{' '}
              <a href="mailto:webvoxelstudio.uk@gmail.com" className="text-primary underline">
                webvoxelstudio.uk@gmail.com
              </a>
            </p>
          </Section>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} LeadFlow CRM. All rights reserved.
        </p>
      </div>
    </div>
  )
}
