import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import { PublicLeadForm } from './form'

export default async function PublicFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const service = createServiceClient()

  const { data: form } = await service
    .from('lead_forms')
    .select('id, name, slug, organization_id, fields_json, welcome_message, thank_you_message, is_active')
    .eq('slug', slug)
    .single()

  if (!form || !form.is_active) notFound()

  // Get org name for branding
  const { data: org } = await service
    .from('organizations')
    .select('name')
    .eq('id', form.organization_id)
    .single()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="w-full max-w-lg">
        <div className="rounded-xl border bg-background p-8 shadow-lg">
          <div className="mb-6 text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {org?.name ?? 'LeadFlow'}
            </p>
            <h1 className="mt-1 text-2xl font-bold">{form.name}</h1>
            {form.welcome_message && (
              <p className="mt-2 text-sm text-muted-foreground">{form.welcome_message}</p>
            )}
          </div>
          <PublicLeadForm
            formId={form.id}
            orgId={form.organization_id}
            fields={form.fields_json as string[]}
            thankYouMessage={form.thank_you_message ?? 'Thank you!'}
          />
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Powered by LeadFlow CRM
        </p>
      </div>
    </div>
  )
}
