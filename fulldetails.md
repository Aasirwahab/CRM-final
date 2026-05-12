# LeadFlow CRM - Complete Feature Documentation

**Product:** LeadFlow CRM
**Tagline:** AI-powered CRM that turns CSV exports into scored leads, actionable insights, and closed deals.
**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Supabase (Auth + Database + Storage), Tailwind CSS 4, Recharts, dnd-kit, Resend (email), OpenAI API, Zod v4, Framer Motion, PostHog Analytics, Sentry Error Tracking

---

## Table of Contents

1. [Landing Page](#1-landing-page)
2. [Authentication System](#2-authentication-system)
3. [Onboarding Flow](#3-onboarding-flow)
4. [Dashboard Layout](#4-dashboard-layout)
5. [Sidebar Navigation](#5-sidebar-navigation)
6. [Top Bar](#6-top-bar)
7. [Dashboard Analytics](#7-dashboard-analytics)
8. [Leads Management](#8-leads-management)
9. [Lead Detail Page](#9-lead-detail-page)
10. [AI Research Engine](#10-ai-research-engine)
11. [Lead Scoring System](#11-lead-scoring-system)
12. [Pipeline (Kanban Board)](#12-pipeline-kanban-board)
13. [Deals Management](#13-deals-management)
14. [Tasks Management](#14-tasks-management)
15. [Calendar View](#15-calendar-view)
16. [Lead Capture Forms](#16-lead-capture-forms)
17. [Public Form Pages](#17-public-form-pages)
18. [CSV Import System](#18-csv-import-system)
19. [Projects Management](#19-projects-management)
20. [Settings](#20-settings)
21. [Audit Log](#21-audit-log)
22. [Trash & Soft Delete](#22-trash--soft-delete)
23. [Email Notifications](#23-email-notifications)
24. [Cron Jobs (Automation)](#24-cron-jobs-automation)
25. [Rate Limiting](#25-rate-limiting)
26. [Validation Layer](#26-validation-layer)
27. [Multi-Tenancy & Organizations](#27-multi-tenancy--organizations)
28. [Database Architecture](#28-database-architecture)
29. [Error Handling](#29-error-handling)
30. [Security Features](#30-security-features)
31. [Legal Pages](#31-legal-pages)

---

## 1. Landing Page

**File:** `src/app/page.tsx`

The public-facing homepage for unauthenticated users.

- **Hero Section:** Displays the LeadFlow brand with tagline: "AI-powered CRM that turns CSV exports into scored leads, actionable insights, and closed deals."
- **CTA Buttons:**
  - "Get started" - links to `/sign-up`
  - "Sign in" - links to `/sign-in`
- **Design:** Centered layout with clean typography, minimal design, dark/light mode support.

---

## 2. Authentication System

**Files:** `src/app/(auth)/sign-in/page.tsx`, `src/app/(auth)/sign-up/page.tsx`, `src/app/(auth)/reset-password/page.tsx`, `src/app/auth/callback/route.ts`, `src/app/auth/confirm/route.ts`

**Provider:** Supabase Auth

### 2.1 Sign In (`/sign-in`)
- **Email + Password Login:** Standard email/password form with validation.
- **Magic Link Login:** Passwordless login via email OTP. Sends a magic link to the user's email, redirects via `/auth/callback`.
- **Split-Screen Layout:** Left panel shows LeadFlow branding with tagline; right panel shows the sign-in form. Mobile shows form only with compact logo.
- **Error Handling:** Inline error messages displayed in a styled destructive alert.
- **Links to:** Sign Up page, Forgot Password page.

### 2.2 Sign Up (`/sign-up`)
- **Fields:** Full Name, Email, Password (min 12 characters).
- **Confirmation Flow:** After signup, shows a "Check your email" screen prompting users to click the confirmation link.
- **User Metadata:** Stores `full_name` in Supabase user metadata.
- **Redirect:** After confirmation, redirects to `/auth/callback` then to `/dashboard`.

### 2.3 Password Reset (`/reset-password`)
- **Flow:** User enters email, receives reset link via Supabase.
- **Security:** Shows "If an account exists" message to prevent email enumeration.
- **Redirect:** Back to sign-in page after sending.

### 2.4 Auth Callback (`/auth/callback`)
- **Purpose:** Handles OAuth/magic link code exchange.
- **Logic:** Exchanges the `code` query parameter for a Supabase session, then redirects to `/dashboard` (or a custom `next` URL).
- **Error:** Redirects to `/sign-in?error=auth_callback_failed` on failure.

### 2.5 Email Confirmation (`/auth/confirm`)
- **Purpose:** Handles email verification via `token_hash` + `type` parameters.
- **Logic:** Calls `supabase.auth.verifyOtp()` with the token hash.
- **Redirect:** Dashboard on success, sign-in with error on failure.

---

## 3. Onboarding Flow

**Files:** `src/app/(dashboard)/onboarding/page.tsx`, `src/app/(dashboard)/onboarding/actions.ts`

- **Purpose:** First-time user setup after account creation.
- **Workspace Naming:** Prompts user to name their organization/workspace (e.g., "Acme Corp").
- **Slug Generation:** Auto-generates a URL-friendly slug from the organization name + random UUID suffix.
- **Welcome Email:** Sends a welcome email via Resend after setup (fire-and-forget).
- **Redirect:** After completing onboarding, redirects to `/dashboard`.

---

## 4. Dashboard Layout

**File:** `src/app/(dashboard)/layout.tsx`

- **Auth Guard:** Server-side check via `supabase.auth.getUser()`. Redirects to `/sign-in` if not authenticated.
- **Profile Lookup:** Fetches user profile with `full_name`, `avatar_url`, and `default_organization_id`.
- **Multi-Org Support:** Loads all active memberships with roles and organization details.
- **Layout Structure:**
  - Left: `Sidebar` component (220px, hidden on mobile)
  - Top: `TopBar` component (56px height)
  - Main: Scrollable content area, max-width 7xl, padded

---

## 5. Sidebar Navigation

**File:** `src/components/layout/sidebar.tsx`

### Structure:
- **Brand Header:** LeadFlow logo (Sparkles icon) + brand name.
- **Organization Switcher:** Dropdown showing all organizations the user belongs to, with role badges. Allows switching between organizations.
- **Search Shortcut:** Search bar placeholder with `/` keyboard shortcut indicator.

### Navigation Sections:
1. **Overview:**
   - Dashboard (`/dashboard`) - LayoutDashboard icon
   - Leads (`/leads`) - Users icon
   - Pipeline (`/pipeline`) - Kanban icon
   - Deals (`/deals`) - Handshake icon

2. **Manage:**
   - Tasks (`/tasks`) - CheckSquare icon
   - Calendar (`/calendar`) - Calendar icon
   - Projects (`/projects`) - FolderKanban icon

3. **Data:**
   - Lead Forms (`/lead-forms`) - FileInput icon
   - Import (`/import`) - Upload icon

4. **Footer:**
   - Settings (`/settings`) - Settings icon

- **Active State:** Highlighted background + primary-colored icon for the current page.
- **Design:** 220px width, dark sidebar theme, collapsible on mobile (hidden with `lg:flex`).

---

## 6. Top Bar

**File:** `src/components/layout/top-bar.tsx`

- **Breadcrumbs:** Auto-generated from the current URL path segments. Shows up to 2 levels.
- **Quick Search:** Search button with `Ctrl K` keyboard shortcut indicator.
- **Notifications:** Bell icon button (placeholder for future notifications).
- **User Menu:** Avatar with initials dropdown containing:
  - User's full name and active organization name
  - "Profile & Settings" link
  - "Sign out" button (calls `supabase.auth.signOut()`)

---

## 7. Dashboard Analytics

**Files:** `src/app/(dashboard)/dashboard/page.tsx`, `src/app/(dashboard)/dashboard/actions.ts`

### Primary Metric Cards (4 cards, responsive grid):
1. **Total Leads** - Count of all active leads + new leads this week.
2. **Qualified Leads** - Leads with `status = 'qualified'`, shows percentage of total.
3. **Hot Leads** - Leads with `lead_quality = 'hot'`, shows percentage of total.
4. **Active Deals** - Count of open deals + total pipeline value in dollars.

Each card is clickable and links to its respective page.

### Secondary Metrics Row (3 cards):
1. **Tasks Due** - Count of overdue tasks (status todo/in_progress, past due date).
2. **Completed This Week** - Tasks marked done in the last 7 days.
3. **AI Spend Today** - Total AI usage cost in USD for the current day.

### Charts & Visualizations:
1. **Lead Growth Chart (Area Chart):**
   - 30-day trend showing daily new leads and cumulative total.
   - Dual-area chart with gradient fills (indigo for cumulative, green for daily).
   - Custom tooltip component.

2. **Pipeline Overview (Horizontal Bar Chart):**
   - Breakdown by pipeline stage with proportional bars.
   - Shows count and percentage for each stage.
   - Color-coded bars (indigo, violet, purple, fuchsia, etc.).
   - Link to Pipeline page.

3. **Lead Quality Donut Chart (Pie Chart):**
   - Distribution by hot/warm/cold quality.
   - Center label showing total count.
   - Color-coded: red (hot), orange (warm), indigo (cold).
   - Horizontal pill legend.

4. **Recent Activity Feed:**
   - Shows latest 8 activities: new leads created and tasks completed.
   - Each item has an icon, label, detail, and relative timestamp ("2h ago").
   - Sorted by most recent.

### Empty State:
- When no leads exist, shows a CTA card: "Get started with your first import" with a link to the Import page.

### Welcome Header:
- Personalized greeting: "Welcome back, [First Name]!"
- Shows current date.

---

## 8. Leads Management

**Files:** `src/app/(dashboard)/leads/page.tsx`, `src/app/(dashboard)/leads/actions.ts`

### Leads List Page

#### Header:
- Title: "Leads" with total count.
- **Export Button:** Exports filtered leads as CSV file (up to 5,000 leads). Includes all lead, company, and contact fields. Logs export activity.
- **Import CSV Button:** Links to `/import`.

#### Metrics Bar (4 cards):
- New Leads count
- Qualified Leads count
- Hot Leads count
- Average Score

#### Filtering:
- **Status Tabs:** All, New, Contacted, Qualified, Nurture, Converted, Lost - tabs with active underline indicator.
- **Search:** Debounced search (300ms) across company name, contact name, and email.
- **Quality Filter:** Dropdown for All Quality, Hot, Warm, Cold.

#### Data Table:
- **Columns:** Customer (avatar + company/contact), Email, Status, Quality, Score, Source, Date.
- **Sorting:** Clickable column headers for created_at, status, lead_quality, lead_score. Shows sort direction indicator.
- **Inline Editing:** Status and Quality badges are clickable - opens a dropdown for inline editing. Updates optimistically and logs to audit trail.
- **Score Bar:** Visual progress bar with color coding: green (70+), amber (40-69), red (<40).
- **Row Click:** Navigates to lead detail page.
- **Pagination:** 25 leads per page with Previous/Next buttons and "Showing X-Y of Z" indicator.

#### Server Actions:
- `getLeads()` - Paginated lead fetching with filters, sorting, and joins to companies/contacts.
- `getLeadMetrics()` - Aggregated metrics (new, qualified, hot counts + avg score).
- `exportLeadsCSV()` - Full CSV export with 21 columns including company, contact, and lead data.
- `inlineUpdateLead()` - Optimistic concurrency control with version checking, audit logging.

---

## 9. Lead Detail Page

**Files:** `src/app/(dashboard)/leads/[id]/page.tsx`, `src/app/(dashboard)/leads/[id]/actions.ts`

### Layout: 2-column (main + sidebar)

#### Left Column (Main):
1. **Header:** Company name, contact name, quality badge, score badge, Delete button (soft delete with confirmation).
2. **Status Selector:** Pill buttons for all 7 status options (new, contacted, qualified, unqualified, nurture, converted, lost). Active status highlighted with primary color.
3. **Company Info Card:** Name, Website (clickable link), Industry, Size, Location. AI Summary section if available.
4. **Contact Info Card:** Name, Email, Phone, Job Title, LinkedIn (clickable link), Decision Maker flag.
5. **AI Research Section:** (See [AI Research Engine](#10-ai-research-engine))
6. **Threaded Comments:**
   - Post new comments with a textarea.
   - Top-level comments and nested replies.
   - Each comment shows author avatar (initial), name, timestamp.
   - Reply button on each comment expands inline reply form.
   - Replies indented with lighter background.

#### Right Column (Sidebar):
1. **Details Card:** Source, Created date, Last Updated, Last Contacted, Follow Up date.
2. **Lead Score Card:** Large score display (X/100) with color-coded progress bar (red 60+, orange 35-59, blue <35).
3. **Activity Timeline:** Chronological list of all actions (Created, Updated, Imported, Scored, Researched, Deleted, Restored) with timestamps.

#### Server Actions:
- `getLeadDetail()` - Fetches lead with company, contact, research report, activity logs, and threaded notes.
- `updateLeadStatus()` - Updates status with optimistic concurrency (version check) and audit logging.
- `addNote()` - Creates a new comment on the lead.
- `addReply()` - Creates a threaded reply to an existing comment (uses `parent_id`).

---

## 10. AI Research Engine

**Files:** `src/app/(dashboard)/leads/[id]/ai-actions.ts`, `src/lib/ai/openai.ts`

### Two Research Tiers:
1. **Basic Research** - Uses `gpt-4o-mini` (faster, cheaper).
2. **Standard Research** - Uses `gpt-4o` (more thorough, higher quality).

### AI Research Output (Structured JSON):
- **Company Summary:** 1-2 sentence description (max 280 chars).
- **Website Analysis:** Assessment of web presence and signals (max 500 chars).
- **Pain Points:** Up to 3 likely pain points based on industry and role.
- **Recommended Offer:** Service/product angle that would resonate (max 200 chars).
- **Lead Score:** 0-100 numeric score.
- **Lead Quality:** hot / warm / cold classification.
- **Outreach Angle:** How to approach this lead specifically (max 400 chars).
- **Next Best Action:** Single most important next step (max 200 chars).
- **Confidence Score:** 0.0-1.0 confidence level.

### Safety & Controls:
- **Rate Limiting:** 10 AI requests per minute per user.
- **Daily Budget Cap:** Organization-level daily AI spending cap (configurable, default $1.00/day). Prevents runaway costs.
- **Input Validation:** UUID validation on lead ID using Zod.
- **Cost Tracking:** Calculates token-based costs and logs to `ai_usage_log` table.
- **Status Tracking:** Lead AI status transitions: pending -> running -> completed/failed.
- **Error Handling:** On failure, marks research report as failed and reverts lead AI status.

### AI Usage Logging:
Each AI call logs: organization_id, lead_id, model, tier, prompt_tokens, completion_tokens, cost_usd_cents, latency_ms, status.

---

## 11. Lead Scoring System

**File:** `src/lib/scoring.ts`

### Rule-Based Scoring (0-100):

| Signal | Points | Notes |
|--------|--------|-------|
| Has email | +15 | Base signal |
| Business email domain | +5 | Non-free provider (not Gmail, Yahoo, etc.) |
| Has phone | +10 | |
| Has website | +10 | |
| Has LinkedIn | +10 | |
| Has job title | +10 | |
| Decision maker title | +15 | CEO, CTO, VP, Director, Founder, etc. |
| Decision maker flag | +10 | Explicit flag |
| Has company name | +5 | |
| Has industry | +5 | |
| Has location | +5 | |

### Quality Classification:
- **Hot:** Score >= 60
- **Warm:** Score 35-59
- **Cold:** Score < 35

### Decision Maker Keywords:
CEO, CTO, CFO, COO, CMO, Founder, Co-Founder, Owner, President, Director, VP, Vice President, Head of, Chief, Partner, Managing.

### Usage:
- Applied during CSV import for immediate scoring.
- Applied when converting lead form submissions to leads.
- AI research can override the score with its own assessment.

---

## 12. Pipeline (Kanban Board)

**Files:** `src/app/(dashboard)/pipeline/page.tsx`, `src/app/(dashboard)/pipeline/actions.ts`, `src/app/(dashboard)/pipeline/stage-column.tsx`, `src/app/(dashboard)/pipeline/lead-card.tsx`

### Pipeline Stages (11 stages):
1. Imported
2. Researched
3. Qualified
4. Contacted
5. Replied
6. Meeting Booked
7. Proposal Sent
8. Negotiation
9. Won
10. Lost
11. Nurture

### Features:
- **Drag & Drop:** Built with `@dnd-kit/core`. PointerSensor with 5px activation distance.
- **Optimistic Updates:** UI updates immediately on drag; reverts on server error.
- **Concurrency Control:** Uses version-based optimistic locking. If another user modified the lead, shows conflict error and reverts.
- **Lead Cards:** Each card shows company name, contact name, email, quality badge, and score.
- **DragOverlay:** Shows a ghost card while dragging.
- **Audit Logging:** Every stage change is logged with before/after values.
- **Stage Columns:** Scrollable columns showing lead count per stage.

---

## 13. Deals Management

**Files:** `src/app/(dashboard)/deals/page.tsx`, `src/app/(dashboard)/deals/actions.ts`

### Features:
- **Create Deal:** Inline form with title, value (dollar amount), and expected close date.
- **Deal Filtering:** Filter by status: All, Open, Won, Lost.
- **Summary Metrics:** Total deal count and combined pipeline value.

### Deal Table Columns:
- Deal (title + contact name avatar)
- Company name
- Stage (pipeline stage label)
- Value (formatted as USD)
- Status (badge: open/won/lost)
- Close Date

### Data Model:
- `title`, `value`, `stage`, `probability`, `expected_close_date`, `status` (open/won/lost)
- Links to leads (company/contact info derived from lead relationships)
- Owner and creator tracking
- Soft delete support

---

## 14. Tasks Management

**Files:** `src/app/(dashboard)/tasks/page.tsx`, `src/app/(dashboard)/tasks/actions.ts`

### Features:
- **Create Task:** Inline form with title, priority selector (Low/Medium/High/Urgent), and due date/time picker.
- **Status Management:** Quick toggle (click checkbox to mark done), plus dropdown for todo/in_progress/done/cancelled.
- **Filtering:** Status filter tabs: All, Todo, In Progress, Done, Cancelled.
- **Overdue Detection:** Tasks past due date highlighted with red border and destructive text. Count shown in header.
- **Auto-Generated Tasks:** Tasks created by the stale leads cron job show an "Auto" badge.
- **Lead Linking:** Tasks linked to leads show the company name as a clickable link to the lead detail page.

### Priority System:
- **Urgent:** Red styling
- **High:** Orange styling
- **Medium:** Amber styling
- **Low:** Gray styling

### Status Icons:
- Todo: Circle
- In Progress: Clock
- Done: CheckCircle2 (green, with strikethrough text)
- Cancelled: XCircle

---

## 15. Calendar View

**Files:** `src/app/(dashboard)/calendar/page.tsx`, `src/app/(dashboard)/calendar/actions.ts`

### Features:
- **Monthly Calendar Grid:** Standard 7-column grid with day numbers.
- **Navigation:** Previous/Next month buttons + "Today" button.
- **Two Event Types:**
  - **Tasks** (blue dots) - shown by due date with priority-colored dots
  - **Deals** (green dots) - shown by expected close date
- **Day Cell Content:** Shows up to 4 items with "+N more" overflow indicator.
- **Today Highlight:** Current date shown with primary-colored circle.
- **Selection:** Click a day to see details in the side panel.

### Side Panel (272px wide):
- Shows full date (e.g., "Monday, May 12").
- Lists all tasks for that day with title, priority badge, status, and company name.
- Lists all deals for that day with title, status badge, value, and company name.
- "Nothing scheduled" message for empty days.

### Legend:
- Blue dot = Task
- Green dot = Deal

---

## 16. Lead Capture Forms

**Files:** `src/app/(dashboard)/lead-forms/page.tsx`, `src/app/(dashboard)/lead-forms/actions.ts`

### Form Management:
- **Create Form:** Enter a form name (e.g., "Website Contact Form"). Auto-generates a unique slug.
- **Form List:** Shows all forms with name, active/inactive status badge, submission count, and creation date.
- **Toggle Active/Inactive:** Activate or deactivate forms with a button.
- **Copy Link:** Copy the public form URL to clipboard (shows "Copied!" feedback).
- **Public URL Display:** Shows the shareable URL: `{origin}/f/{slug}`.

### Submission Management:
- **View Submissions:** Expandable panel showing all submissions for a form.
- **Submission Data:** Displays all submitted field key-value pairs.
- **Convert to Lead:** One-click button to convert a submission into a full lead:
  - Creates Company record
  - Creates Contact record
  - Runs lead scoring
  - Creates Lead record (source: `web_form`)
  - Marks submission as converted (shows "Converted" badge)
  - Logs activity

### Slug Generation:
- Lowercased, special chars replaced with hyphens, appended with 8-char UUID suffix for uniqueness.

---

## 17. Public Form Pages

**Files:** `src/app/f/[slug]/page.tsx`, `src/app/f/[slug]/form.tsx`, `src/app/f/[slug]/actions.ts`

### Features:
- **Public URL:** Accessible at `/f/{slug}` without authentication.
- **Organization Branding:** Shows the organization name above the form title.
- **Welcome Message:** Optional custom welcome text below the title.
- **Dynamic Fields:** Form fields configured via `fields_json` on the lead_form record.
- **Thank You Message:** Custom message shown after successful submission.
- **Inactive Guard:** Returns 404 if the form is inactive.
- **Design:** Centered card layout with gradient background, "Powered by LeadFlow CRM" footer.

---

## 18. CSV Import System

**Files:** `src/app/(dashboard)/import/page.tsx`, `src/app/(dashboard)/import/actions.ts`, plus 5 step components

### 5-Step Import Wizard:

#### Step 1: Upload
- **File Validation:** CSV only, max 5MB (free plan), max 1,000 rows.
- **Rate Limiting:** 3 imports per minute per user.
- **Signed Upload:** Creates import batch record, generates signed upload URL for Supabase Storage.
- **Idempotency:** Each batch has a unique idempotency key.

#### Step 2: Preview
- **CSV Parsing:** Auto-detects delimiter (comma, tab, semicolon, pipe).
- **Preview Display:** Shows headers + first 200 rows in a table.
- **Row Count:** Shows total number of data rows.

#### Step 3: Column Mapping
- **CRM Fields:** company_name, website, industry, location, contact_name, email, phone, job_title, linkedin_url, source (or "skip").
- **Sample Data:** Shows sample values from the first row to help with mapping.
- **Mapping Persistence:** Saves column mapping to the batch record.

#### Step 4: Processing
- **Chunk Processing:** Processes rows in chunks of 100 for reliability.
- **Progress Tracking:** Real-time updates: successful_rows, failed_rows, duplicate_rows.
- **For Each Row:**
  1. Parse and map CSV values to CRM fields.
  2. **CSV Injection Protection:** Sanitizes cells starting with `=`, `+`, `-`, `@`, `\t`, `\r`.
  3. **Validation:** Requires company_name or contact_name AND email.
  4. **Deduplication:** Checks for existing contacts by email, companies by website, contacts by phone.
  5. **Company Upsert:** Creates or reuses existing company (case-insensitive match).
  6. **Contact Upsert:** Creates or reuses existing contact (case-insensitive email match).
  7. **Lead Scoring:** Applies rule-based scoring on import.
  8. **Lead Creation:** Creates lead with source "csv_import", status "new", AI status "pending".
  9. **Row Logging:** Each row result (imported/failed/skipped) recorded in `csv_import_rows`.
  10. **Activity Logging:** Each successful import logged.

#### Step 5: Summary
- Shows final statistics: successful, failed, duplicates.
- Allows viewing failed/skipped rows with error messages.

### Import History:
- **Visible on Upload Step:** Shows last 20 import batches.
- **Per Batch:** File name, status, row counts (total/successful/failed/duplicate), timestamps.

### Post-Import:
- **Email Notification:** Sends import completion email with statistics via Resend.

---

## 19. Projects Management

**Files:** `src/app/(dashboard)/projects/page.tsx`, `src/app/(dashboard)/projects/actions.ts`

### Features:
- **Create Project:** Manual creation with name, type, budget, and deadline fields.
- **Convert from Won Deal:** Select from won deals that haven't been converted yet. Auto-populates name and budget from the deal.
- **Project Fields:** name, type, status, budget, deadline, github_repo, staging_url, live_url, deal_id, client_company_id.

### Status Management:
- **Statuses:** Active (green), On Hold (yellow), Completed (blue), Cancelled (red).
- **Inline Status Change:** Dropdown to change project status.

### Project Table/Cards:
- Shows project name, company name, type, status badge, budget, deadline, and linked URLs (GitHub, staging, live).

---

## 20. Settings

**Files:** `src/app/(dashboard)/settings/page.tsx`, `src/app/(dashboard)/settings/actions.ts`

### Profile Section:
- **Edit Full Name:** Input field with Save button.

### Organization Section:
- **Edit Organization Name:** Input field with Save button.
- **Plan Badge:** Shows current plan (e.g., "free plan").
- **Read-Only Info:** Organization slug, AI daily cap (displayed as USD).

### Team Members Section:
- **Member List:** Shows all team members with avatar (initial), full name, and role badge.
- **Role Badges:** Owner (purple), Admin (blue), Sales (green), Viewer (gray).

### Quick Links:
- Audit Log - View all activity and changes
- Projects - Manage client projects from won deals
- Trash - Restore or permanently remove deleted leads
- Backups & Security - Data protection and security overview
- Privacy Policy - How we handle your data
- Terms of Service - Usage terms and conditions

---

## 21. Audit Log

**Files:** `src/app/(dashboard)/settings/audit-log/page.tsx`, `src/app/(dashboard)/settings/audit-log/actions.ts`

### Features:
- **Activity Feed:** Chronological list of all actions across the organization.
- **Action Types:** Created (green), Updated (blue), Deleted (red), Imported (purple), Researched (yellow), Scored (orange), Restored (emerald).
- **Log Entry Data:** Actor name, action type, entity type, entity ID, before/after JSON diff, timestamp.
- **Pagination:** 50 entries per page with Previous/Next navigation.
- **Total Count:** Shows total number of audit events.

### Logged Actions:
- Lead CRUD (create, update, delete, restore)
- Lead imports
- AI research runs
- Score updates
- Status/quality changes (with before/after values)
- CSV exports
- Task completions
- Pipeline stage moves

---

## 22. Trash & Soft Delete

**Files:** `src/app/(dashboard)/trash/page.tsx`, `src/app/(dashboard)/trash/actions.ts`

### Soft Delete:
- Leads are never permanently deleted from the UI.
- `softDeleteLead()` sets `deleted_at` timestamp on the lead.
- Deleted leads are excluded from all queries (`is('deleted_at', null)`).
- Activity log records the deletion.

### Trash Page:
- Lists up to 100 most recently deleted leads.
- Shows company name, contact info, status, quality, score, deletion date.

### Restore:
- `restoreLead()` clears the `deleted_at` timestamp.
- Lead reappears in all views.
- Activity log records the restoration.

---

## 23. Email Notifications

**File:** `src/lib/email.ts`

**Provider:** Resend

### Email Templates:

1. **Welcome Email** (`sendWelcomeEmail`)
   - Sent after onboarding completion.
   - Content: Getting started steps (Import, Score & Research, Manage Pipeline, Close Deals).
   - CTA button: "Go to Dashboard".

2. **Import Complete Email** (`sendImportCompleteEmail`)
   - Sent after CSV import finishes processing.
   - Content: Table with file name, total rows, imported count (green), duplicates (orange), failed (red).
   - CTA button: "View Leads".

3. **Task Reminder Email** (`sendTaskReminderEmail`)
   - Sent daily by cron job for tasks due today.
   - Content: Table of tasks with title, priority badge (color-coded), and due date.
   - CTA button: "View Tasks".

### Security:
- All user-supplied strings are HTML-escaped to prevent XSS in emails.
- Configurable FROM address via `NEXT_PUBLIC_EMAIL_FROM` env var.

---

## 24. Cron Jobs (Automation)

### 24.1 Stale Leads Auto-Follow-Up

**File:** `src/app/api/cron/stale-leads/route.ts`
**Schedule:** Daily
**Endpoint:** `GET /api/cron/stale-leads?key=CRON_SECRET`

**Logic:**
1. Finds leads with no activity for 7+ days (based on `updated_at`).
2. Excludes converted and lost leads.
3. Skips leads that already have an open task.
4. Auto-creates follow-up tasks:
   - Title: "Follow up: [Company] ([Contact])"
   - Description: Mentions days of inactivity.
   - Priority: "high" if 14+ days inactive, otherwise "medium".
   - Due: Tomorrow.
5. Logs activity for each auto-created task.
6. Processes up to 500 stale leads per run.

### 24.2 Task Reminder Emails

**File:** `src/app/api/cron/task-reminders/route.ts`
**Schedule:** Daily at 8:00 AM
**Endpoint:** `GET /api/cron/task-reminders?key=CRON_SECRET`

**Logic:**
1. Finds all tasks due today that are still pending/in_progress.
2. Groups tasks by assigned user.
3. Looks up each user's email from Supabase Auth.
4. Sends a consolidated reminder email per user with all their due tasks.

### Security:
Both cron endpoints validate a `CRON_SECRET` query parameter to prevent unauthorized access.

---

## 25. Rate Limiting

**File:** `src/lib/rate-limit.ts`

### Implementation:
- **Type:** In-memory sliding window rate limiter.
- **Cleanup:** Expired entries cleaned every 60 seconds.
- **Note:** For production at scale, should be replaced with Redis (Upstash).

### Pre-Configured Limits:

| Action | Limit | Window |
|--------|-------|--------|
| Auth | 5 attempts | 1 minute |
| AI Research | 10 requests | 1 minute |
| CSV Import | 3 imports | 1 minute |
| General API | 60 requests | 1 minute |
| Notes/Updates | 30 writes | 1 minute |

### Return Value:
Each check returns: `success` (boolean), `limit`, `remaining`, `resetIn` (seconds).

---

## 26. Validation Layer

**File:** `src/lib/validate.ts`

**Library:** Zod v4

### Schemas:

| Schema | Validation |
|--------|-----------|
| `emailSchema` | Valid email format |
| `passwordSchema` | Min 8 characters |
| `profileNameSchema` | 1-100 chars, trimmed |
| `orgNameSchema` | 1-100 chars, trimmed |
| `leadStatusSchema` | Enum: new, contacted, qualified, unqualified, nurture, converted, lost |
| `leadQualitySchema` | Enum: hot, warm, cold |
| `pipelineStageSchema` | Enum: 11 pipeline stages |
| `createDealSchema` | Title (required, max 200), value (optional, min 0), leadId (optional UUID), stage (optional) |
| `dealStatusSchema` | Enum: open, won, lost |
| `createTaskSchema` | Title (required, max 200), description (max 2000), priority enum, dueDate, leadId, dealId |
| `taskStatusSchema` | Enum: pending, in_progress, completed, cancelled |
| `createProjectSchema` | Name (required, max 200), type (max 100), budget (min 0), deadline, dealId |
| `projectStatusSchema` | Enum: active, on_hold, completed, cancelled |
| `noteSchema` | 1-5000 chars, trimmed |
| `uuidSchema` | Valid UUID format |
| `pageSchema` | Integer >= 0, default 0 |
| `searchSchema` | Max 200 chars, trimmed, optional |

### Helper Function:
`validate(schema, input)` - Safe parse returning `{ data }` or `{ error: string }`.

---

## 27. Multi-Tenancy & Organizations

### Architecture:
- Every data record is scoped to an `organization_id`.
- Users have a `profiles` table linked to their Supabase auth user via `user_id`.
- Membership model: `memberships` table connects profiles to organizations with roles.

### Roles:
- **Owner** - Full access
- **Admin** - Administrative access
- **Sales** - Standard sales user
- **Viewer** - Read-only access

### Organization Switching:
- Users can belong to multiple organizations.
- `default_organization_id` on the profile determines the active org.
- Organization switcher in the sidebar allows switching between orgs.

### Data Isolation:
- All queries filter by `organization_id`.
- Service client (bypasses RLS) used for server actions after auth verification.
- User's organization membership is verified before data access.

---

## 28. Database Architecture

### Supabase Configuration:

**Files:** `src/lib/supabase/client.ts` (browser client), `src/lib/supabase/server.ts` (server client with cookie handling), `src/lib/supabase/service.ts` (service role client, bypasses RLS)

### Core Tables (inferred from queries):

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `profiles` | User profiles | id, user_id, full_name, avatar_url, default_organization_id |
| `organizations` | Tenants/workspaces | id, name, slug, plan, ai_daily_cap_cents |
| `memberships` | User-org relationships | profile_id, organization_id, role, status |
| `leads` | Sales leads | id, organization_id, company_id, contact_id, source, status, lead_score, lead_quality, ai_status, pipeline_stage, version, deleted_at |
| `companies` | Company records | id, organization_id, name, website, industry, size_band, location, ai_summary |
| `contacts` | Contact records | id, organization_id, company_id, full_name, email, phone, job_title, linkedin_url, is_decision_maker |
| `deals` | Sales deals | id, organization_id, title, value, stage, probability, expected_close_date, status, lead_id, owner_id |
| `tasks` | To-do items | id, organization_id, title, description, status, priority, due_at, lead_id, deal_id, assigned_to |
| `projects` | Client projects | id, organization_id, name, type, status, budget, deadline, github_repo, staging_url, live_url, deal_id, client_company_id |
| `notes` | Comments/notes | id, organization_id, entity_type, entity_id, parent_id, content, created_by |
| `research_reports` | AI research results | id, organization_id, lead_id, tier, status, model, company_summary, website_analysis, pain_points_json, etc. |
| `activity_logs` | Audit trail | id, organization_id, actor_profile_id, action, entity_type, entity_id, before_json, after_json |
| `ai_usage_log` | AI cost tracking | id, organization_id, lead_id, model, tier, prompt_tokens, completion_tokens, cost_usd_cents, latency_ms |
| `csv_import_batches` | Import jobs | id, organization_id, file_name, storage_path, status, column_mapping, total_rows, successful_rows, failed_rows, duplicate_rows, idempotency_key |
| `csv_import_rows` | Per-row import results | batch_id, row_number, raw_data_json, mapped_data_json, status, error_message, created_lead_id |
| `lead_forms` | Form definitions | id, organization_id, name, slug, fields_json, welcome_message, thank_you_message, is_active, submission_count |
| `lead_form_submissions` | Form submissions | id, form_id, organization_id, data_json, converted_lead_id |

### Key Patterns:
- **Soft Delete:** `deleted_at` timestamp (null = active).
- **Optimistic Concurrency:** `version` field on leads for conflict detection.
- **Audit Trail:** All mutations logged to `activity_logs` with before/after JSON diffs.
- **Supabase Storage:** CSV files stored in `csv-imports` bucket with signed URLs.

---

## 29. Error Handling

**Files:** `src/app/(dashboard)/error.tsx`, `src/app/global-error.tsx`, `src/app/(dashboard)/not-found.tsx`, `src/app/(dashboard)/loading.tsx`

- **Dashboard Error Boundary:** Catches errors within the dashboard layout.
- **Global Error Boundary:** Catches errors at the root level.
- **Not Found Page:** Custom 404 page for dashboard routes.
- **Loading State:** Spinner component shown during page transitions.
- **Sentry Integration:** `@sentry/nextjs` installed for error tracking and monitoring.

---

## 30. Security Features

### Authentication:
- Supabase Auth with email/password and magic link OTP.
- Server-side auth checks on every dashboard route and server action.
- Password minimum: 12 characters for signup.

### Data Access:
- Row-Level Security (RLS) via Supabase.
- Service client used server-side after explicit auth verification.
- Organization-scoped data isolation.

### Input Validation:
- Zod schemas for all user inputs.
- CSV injection protection (sanitizes formula-starting characters).
- HTML escaping in email templates.

### Rate Limiting:
- Per-user, per-action rate limits on sensitive operations.
- AI research, imports, and auth protected.

### Concurrency Control:
- Version-based optimistic locking on lead updates.
- Prevents data corruption from concurrent edits.

### Cron Security:
- `CRON_SECRET` environment variable required for cron endpoints.

### Other:
- PostHog analytics for usage tracking.
- Idempotency keys on import batches to prevent duplicate processing.
- Duplicate detection during imports (by email, website, phone).

---

## 31. Legal Pages

**Files:** `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`

- **Privacy Policy** (`/privacy`) - Data handling and privacy information.
- **Terms of Service** (`/terms`) - Usage terms and conditions.
- Linked from the Settings page.

---

## Tech Stack Summary

| Category | Technology |
|----------|-----------|
| Framework | Next.js 16 (App Router) |
| Runtime | React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4, tw-animate-css |
| UI Components | shadcn/ui, Lucide React icons |
| Charts | Recharts |
| Drag & Drop | @dnd-kit/core + sortable |
| Forms | React Hook Form + @hookform/resolvers |
| Validation | Zod v4 |
| Animation | Framer Motion |
| Auth & Database | Supabase (Auth, PostgreSQL, Storage) |
| AI | OpenAI API (gpt-4o, gpt-4o-mini) |
| Email | Resend |
| Analytics | PostHog |
| Error Tracking | Sentry |
| Background Jobs | Trigger.dev SDK |
| Package Manager | pnpm |

---

## Environment Variables Required

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side) |
| `OPENAI_API_KEY` | OpenAI API key for AI research |
| `RESEND_API_KEY` | Resend API key for emails |
| `NEXT_PUBLIC_EMAIL_FROM` | Email sender address |
| `NEXT_PUBLIC_APP_URL` | Application URL for email links |
| `CRON_SECRET` | Secret key for cron job endpoints |
