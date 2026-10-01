# LeadFlow CRM

**A multi-tenant AI sales CRM.** Upload a CSV of leads, and LeadFlow cleans and de-duplicates them, researches and scores each lead with AI, then moves it through a sales pipeline, from first contact to won deal.

🔗 **Live demo:** [crm-final-zeta.vercel.app](https://crm-final-zeta.vercel.app)

---

## What it does

- **CSV import pipeline:** upload large lead exports; rows are cleaned, validated and de-duplicated against existing leads in a background job, so big files never time out
- **AI research and scoring:** each lead is enriched and scored by an LLM so the best opportunities rise to the top
- **Sales pipeline:** drag-and-drop stages to move leads from new to won, with meetings and outreach tracked along the way
- **Multi-tenant by design:** every workspace's data is isolated with Postgres Row Level Security
- **Dashboards:** pipeline and activity charts at a glance

## Tech stack

| Area | Tools |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| UI | Tailwind CSS, shadcn/ui, Framer Motion, dnd-kit, TanStack Table, Recharts |
| Data & auth | Supabase (Postgres, Auth, Storage) with Row Level Security |
| Background jobs | Trigger.dev |
| AI | Anthropic SDK |
| Email | Resend |
| Rate limiting | Upstash Redis |
| Observability | Sentry, PostHog |
| Testing | Vitest |

## Getting started

```bash
npm install
cp .env.example .env.local   # add your Supabase, Anthropic and other keys
npm run dev                  # http://localhost:3000
```

Other scripts: `npm run build`, `npm run test`, `npm run lint`.

## Docs

- [`LeadFlow_CRM_Production_Plan_v2.md`](LeadFlow_CRM_Production_Plan_v2.md): architecture, data model, security and roadmap
- [`LEADFLOW_TABLES_DEV_PLAN.md`](LEADFLOW_TABLES_DEV_PLAN.md): table-level development plan

---

Built by [Aasir Wahab](https://github.com/Aasirwahab) · [LinkedIn](https://www.linkedin.com/in/aasirwahab/)
