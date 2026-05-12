import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — LeadFlow CRM',
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 prose prose-neutral dark:prose-invert">
      <Link href="/" className="text-sm text-muted-foreground no-underline hover:text-foreground">
        &larr; Home
      </Link>

      <h1 className="mt-4">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground">Last updated: May 12, 2026</p>

      <h2>1. Information We Collect</h2>
      <p>
        When you create an account, we collect your name, email address, and organization details.
        When you use our CRM features, we process lead data, contact information, and business
        records that you import or create within the platform.
      </p>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To provide and maintain the LeadFlow CRM service</li>
        <li>To process CSV imports, AI research, and lead scoring</li>
        <li>To send transactional emails (welcome, import complete, task reminders)</li>
        <li>To improve our service and fix bugs</li>
        <li>To enforce our Terms of Service</li>
      </ul>

      <h2>3. AI Data Processing</h2>
      <p>
        When you use AI Research features, lead data (company name, website, contact info) is sent
        to OpenAI for analysis. We do not use your data to train AI models. AI-generated insights
        are stored in your organization&apos;s database and are not shared with other users.
      </p>

      <h2>4. Data Storage & Security</h2>
      <p>
        Your data is stored in Supabase (PostgreSQL) with Row Level Security ensuring strict
        multi-tenant isolation. All data is encrypted in transit (TLS) and at rest. We use
        security headers, rate limiting, and input validation to protect against common attacks.
      </p>

      <h2>5. Data Sharing</h2>
      <p>
        We do not sell your data. We share data only with service providers necessary to operate
        the platform (Supabase for database, OpenAI for AI features, Resend for email delivery).
        All providers are bound by data processing agreements.
      </p>

      <h2>6. Your Rights</h2>
      <ul>
        <li><strong>Access:</strong> Export your data at any time from Settings</li>
        <li><strong>Deletion:</strong> Request account deletion by contacting support</li>
        <li><strong>Correction:</strong> Update your profile and organization data in Settings</li>
        <li><strong>Portability:</strong> Export leads and contacts as CSV</li>
      </ul>

      <h2>7. Cookies</h2>
      <p>
        We use essential cookies only for authentication session management. We do not use
        tracking cookies or third-party advertising cookies.
      </p>

      <h2>8. Data Retention</h2>
      <p>
        Active account data is retained as long as your account exists. Deleted leads are
        soft-deleted and can be restored from Trash. Permanently deleted data is removed
        within 30 days. Account data is deleted within 90 days of account closure.
      </p>

      <h2>9. Changes to This Policy</h2>
      <p>
        We may update this policy from time to time. We will notify you of significant changes
        via email or in-app notification.
      </p>

      <h2>10. Contact</h2>
      <p>
        For privacy-related questions, contact us at{' '}
        <a href="mailto:privacy@leadflow.app">privacy@leadflow.app</a>.
      </p>
    </div>
  )
}
