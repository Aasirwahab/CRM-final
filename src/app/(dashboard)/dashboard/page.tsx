export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your sales pipeline and activity
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {['Total Leads', 'Active Deals', 'Tasks Due', 'AI Credits'].map((label) => (
          <div key={label} className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold">0</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Import your first CSV to get started. Head to the Import page in the sidebar.
        </p>
      </div>
    </div>
  )
}
