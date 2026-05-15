# LeadFlow Tables — Dev Plan for Aasir

*Purpose: Build specification for the Tables feature*  
*Date: 2026-05-15*  
*Status: Build spec — not the full product roadmap*

---

## 1. The Vision

LeadFlow is not a generic CRM. It is an enterprise lead-generation engine with CRM/database functions that make clients stay long term. We are adding one feature called Tables. Tables work like Airtable tables inside LeadFlow. Users can create tables, add columns, add rows, and link records to Leads, Companies, or Deals. This lets clients adapt LeadFlow to their sector without needing code changes.

---

## 2. What Stays Unchanged

All existing LeadFlow pages remain exactly as they are:

- Dashboard
- Leads
- Pipeline (stages: Imported, Researched, Qualified, Contacted, Replied, Meeting Booked, Proposal Sent, Negotiation, Won, Lost, Nurture)
- Deals
- Tasks
- Calendar
- Projects
- Lead Forms
- Import
- Settings

The Pipeline stays for lead movement. Tables do not live inside Pipeline.

---

## 3. What We Build — Tables

### Sidebar change

Add one new item to the sidebar:

```text
Data
  Lead Forms
  Import
  Tables          <- NEW
```

### Routes

```text
/tables                      -> hub page listing all custom tables
/tables/[table-slug]         -> table rows/list page
/tables/[table-slug]/new     -> create a new row
/tables/[table-slug]/[row-id] -> view/edit a single row
```

### Example tables inside the hub

- Campaign Tracker
- Property Tracker
- Proposal Tracker
- Referral Partners
- Client Documents

### Sidebar rule

Do not list every table directly in the sidebar by default. If a table is important enough to pin, that can be added later.

---

## 4. How It Works

A Table is:
- a name (and optional description/icon)
- columns with field types
- rows with data
- links to Lead, Company, or Deal
- a generated list page and detail/edit page
- stored in Supabase so n8n can automate later

### Supported field types (V1)

- text
- number
- date
- checkbox
- single select (with user-defined options)
- URL
- email
- phone
- link to Lead
- link to Company
- link to Deal

### Rules for columns

- If a column has data and is deleted, hide/archive it — do not destroy data.
- Changing a field type after data exists is not allowed in V1.

---

## 5. Examples (with column lists)

### Campaign Tracker

Columns:
- Campaign Name (text)
- Niche (text)
- Location (text)
- Offer Type (single select)
- Status (single select: Planning, Active, Complete, Paused)
- Linked Leads (link to Lead)

Use case: marketing agencies tracking campaign data per lead. n8n can create leads from campaign details.

### Proposal Tracker

Columns:
- Proposal Name (text)
- Deal Value (number)
- Status (single select: Draft, Sent, Accepted, Rejected)
- Sent Date (date)
- Follow-up Date (date)
- Linked Deal (link to Deal)

Use case: sales teams tracking proposal status. n8n can create a row when a lead reaches the Proposal Sent stage.

### Property Tracker

Columns:
- Property Name (text)
- Location (text)
- Type (single select: Commercial, Residential, Mixed Use)
- Value (number)
- Status (single select: Active, Under Offer, Sold, Let)
- Linked Lead (link to Lead)
- Linked Company (link to Company)

Use case: real estate clients tracking properties linked to leads and companies.

### Referral Partners

Columns:
- Partner Name (text)
- Contact (text)
- Commission % (number)
- Active Deals (number)
- Linked Leads (link to Lead)
- Linked Deals (link to Deal)

Use case: agencies with referral networks.

---

## 6. Build Priority

### Must Build Now (10 items)

1. **Tables Hub** — a page at /tables that lists all custom tables with a create button
2. **Create/rename/archive table** — name, description, icon/color
3. **Add/edit/archive columns** — supported field types listed in Section 4
4. **Add/edit/archive rows** — standard create, edit, soft-delete
5. **Generated list page per table** — /tables/[slug] with basic search and sort/filter if easy
6. **Generated detail/edit page per row** — /tables/[slug]/[row-id]
7. **Link rows to Lead, Company, or Deal** — a picker/dropdown when creating or editing rows
8. **Stable IDs and slugs** — immutable table_id, row_id, and slug so n8n can reference them
9. **Supabase storage + CRUD API** — rows read/write through Supabase so n8n can automate later
10. **Permissions** — Admin (create/edit/archive tables and columns), Editor (create/edit/archive rows), Viewer (read rows)

### Recommended If Easy (5 items)

1. Basic saved views (All rows, Active rows, My rows)
2. Recently opened tables
3. Favourite/pinned tables for the sidebar
4. Table startup templates (Campaign Tracker, Proposal Tracker, Property Tracker)
5. Linked records panel on Lead/Company/Deal detail pages showing related table rows

### Optional For Aasir To Decide (5 items)

1. Webhook events for row.created, row.updated, row.archived
2. Event log for debugging future n8n automations
3. REST API endpoints for n8n if easier than direct Supabase access
4. Global search across all tables from the hub
5. CSV export per table

### Later / Not Now

CSV import for tables, Kanban view, calendar view, gallery view, public forms into tables, formulas, rollups, lookup fields, cross-table linking between custom tables, AI search/embeddings, automation builder UI, interface designer, table templates marketplace, advanced permissions for specific columns, version history per row, row comments

---

## 7. What NOT To Build Now

- Do not change the Pipeline section
- Do not create custom table Kanban views yet
- Do not move Leads into Tables
- Do not build a full Airtable clone (formulas, rollups, automation builder, custom dashboards)
- Do not build Zones
- Do not build CSV import for Tables
- Do not hardcode Proposals or Proposal Phases. They can be created as custom tables later.

---

## 8. Technical Notes

- Table data is stored in Supabase generic structures behind the scenes.
- n8n can read and write table rows through the Supabase API.
- Each table has an immutable ID and a stable slug.
- Each row has an immutable ID.
- Do not use display names as automation/API identifiers.
- The data layer should be designed so webhook events, API endpoints, and logs can be added easily without rewriting storage.

---

## 9. Why This Matters

- Clients can adapt LeadFlow to their specific sector (real estate, marketing, legal, services) without needing you or any developer.
- Once clients build workflows inside Tables, they accumulate data inside LeadFlow. Leaving becomes harder over time. That is intentional.
- Tables are designed to be automation-ready through Supabase/n8n. Future automations can create rows when leads move through Pipeline stages, or create leads when a Campaign row is added.
- A single Tables feature (instead of separate custom fields and custom entities systems) is simpler to build, simpler to explain, and simpler to maintain.
