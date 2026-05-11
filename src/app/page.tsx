import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="space-y-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight">LeadFlow</h1>
        <p className="max-w-md text-lg text-muted-foreground">
          AI-powered CRM that turns CSV exports into scored leads, actionable insights, and closed deals.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/sign-up"
            className="inline-flex h-10 items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Get started
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex h-10 items-center rounded-md border px-6 text-sm font-medium hover:bg-accent"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
