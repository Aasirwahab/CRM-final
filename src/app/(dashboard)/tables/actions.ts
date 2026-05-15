'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CustomTableRow = {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string | null
  created_at: string
  column_count: number
  row_count: number
}

export type CustomColumnRow = {
  id: string
  table_id: string
  name: string
  key: string
  field_type: string
  position: number
  is_required: boolean
  options: Record<string, unknown> | null
  archived_at: string | null
}

export type CustomDataRow = {
  id: string
  table_id: string
  cells: Record<string, unknown>
  linked_lead_id: string | null
  linked_company_id: string | null
  linked_deal_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  version: number
}

type FieldType =
  | 'text' | 'number' | 'date' | 'checkbox'
  | 'single_select' | 'url' | 'email' | 'phone'
  | 'link_lead' | 'link_company' | 'link_deal'

const VALID_FIELD_TYPES: FieldType[] = [
  'text', 'number', 'date', 'checkbox',
  'single_select', 'url', 'email', 'phone',
  'link_lead', 'link_company', 'link_deal',
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getAuthContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const service = createServiceClient()

  const { data: profile } = await service
    .from('profiles')
    .select('id, default_organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.default_organization_id) return null

  return { service, profileId: profile.id, orgId: profile.default_organization_id }
}

// ---------------------------------------------------------------------------
// Tables CRUD
// ---------------------------------------------------------------------------

export async function getTables(): Promise<{ tables: CustomTableRow[] }> {
  const ctx = await getAuthContext()
  if (!ctx) return { tables: [] }

  const { data: tables } = await ctx.service
    .from('custom_tables')
    .select('id, name, slug, description, icon, color, created_at')
    .eq('organization_id', ctx.orgId)
    .is('archived_at', null)
    .order('created_at', { ascending: false })

  if (!tables) return { tables: [] }

  const tableIds = tables.map((t: any) => t.id)

  // Get column counts
  const { data: colCounts } = await ctx.service
    .from('custom_columns')
    .select('table_id')
    .in('table_id', tableIds)
    .is('archived_at', null)

  // Get row counts
  const { data: rowCounts } = await ctx.service
    .from('custom_rows')
    .select('table_id')
    .in('table_id', tableIds)
    .is('archived_at', null)

  const colMap: Record<string, number> = {}
  const rowMap: Record<string, number> = {}
  for (const c of colCounts ?? []) {
    colMap[c.table_id] = (colMap[c.table_id] ?? 0) + 1
  }
  for (const r of rowCounts ?? []) {
    rowMap[r.table_id] = (rowMap[r.table_id] ?? 0) + 1
  }

  return {
    tables: tables.map((t: any) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      description: t.description,
      icon: t.icon,
      color: t.color,
      created_at: t.created_at,
      column_count: colMap[t.id] ?? 0,
      row_count: rowMap[t.id] ?? 0,
    })),
  }
}

export async function getTableBySlug(slug: string): Promise<{
  table: (CustomTableRow & { columns: CustomColumnRow[] }) | null
}> {
  const ctx = await getAuthContext()
  if (!ctx) return { table: null }

  const { data: table } = await ctx.service
    .from('custom_tables')
    .select('id, name, slug, description, icon, color, created_at')
    .eq('organization_id', ctx.orgId)
    .eq('slug', slug)
    .is('archived_at', null)
    .single()

  if (!table) return { table: null }

  const { data: columns } = await ctx.service
    .from('custom_columns')
    .select('id, table_id, name, key, field_type, position, is_required, options, archived_at')
    .eq('table_id', table.id)
    .is('archived_at', null)
    .order('position', { ascending: true })

  // Row count
  const { count } = await ctx.service
    .from('custom_rows')
    .select('id', { count: 'exact', head: true })
    .eq('table_id', table.id)
    .is('archived_at', null)

  return {
    table: {
      ...table,
      column_count: (columns ?? []).length,
      row_count: count ?? 0,
      columns: columns ?? [],
    },
  }
}

export async function createTable(data: {
  name: string
  description?: string
  icon?: string
  color?: string
}): Promise<{ slug?: string; error?: string }> {
  const ctx = await getAuthContext()
  if (!ctx) return { error: 'No active organization' }

  const name = data.name.trim()
  if (!name) return { error: 'Name is required' }

  // Generate slug
  const { data: slugResult } = await ctx.service
    .rpc('generate_table_slug', { p_name: name, p_org_id: ctx.orgId })

  const slug = slugResult as string
  if (!slug) return { error: 'Failed to generate slug' }

  const { error } = await ctx.service
    .from('custom_tables')
    .insert({
      organization_id: ctx.orgId,
      name,
      slug,
      description: data.description || null,
      icon: data.icon || null,
      color: data.color || null,
      created_by: ctx.profileId,
    })

  if (error) return { error: 'Failed to create table' }

  await ctx.service.from('activity_logs').insert({
    organization_id: ctx.orgId,
    actor_profile_id: ctx.profileId,
    action: 'created',
    entity_type: 'custom_table',
    entity_id: slug,
  })

  return { slug }
}

export async function updateTable(
  tableId: string,
  data: { name?: string; description?: string; icon?: string; color?: string }
): Promise<{ success?: boolean; error?: string }> {
  const ctx = await getAuthContext()
  if (!ctx) return { error: 'No active organization' }

  const updates: Record<string, unknown> = {}
  if (data.name !== undefined) updates.name = data.name.trim()
  if (data.description !== undefined) updates.description = data.description || null
  if (data.icon !== undefined) updates.icon = data.icon || null
  if (data.color !== undefined) updates.color = data.color || null

  if (Object.keys(updates).length === 0) return { error: 'Nothing to update' }

  const { error } = await ctx.service
    .from('custom_tables')
    .update(updates)
    .eq('id', tableId)
    .eq('organization_id', ctx.orgId)

  if (error) return { error: 'Failed to update table' }
  return { success: true }
}

export async function archiveTable(
  tableId: string
): Promise<{ success?: boolean; error?: string }> {
  const ctx = await getAuthContext()
  if (!ctx) return { error: 'No active organization' }

  const { error } = await ctx.service
    .from('custom_tables')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', tableId)
    .eq('organization_id', ctx.orgId)

  if (error) return { error: 'Failed to archive table' }

  await ctx.service.from('activity_logs').insert({
    organization_id: ctx.orgId,
    actor_profile_id: ctx.profileId,
    action: 'deleted',
    entity_type: 'custom_table',
    entity_id: tableId,
  })

  return { success: true }
}

// ---------------------------------------------------------------------------
// Columns CRUD
// ---------------------------------------------------------------------------

export async function addColumn(
  tableId: string,
  data: {
    name: string
    field_type: string
    is_required?: boolean
    options?: Record<string, unknown>
  }
): Promise<{ column?: CustomColumnRow; error?: string }> {
  const ctx = await getAuthContext()
  if (!ctx) return { error: 'No active organization' }

  const name = data.name.trim()
  if (!name) return { error: 'Column name is required' }

  if (!VALID_FIELD_TYPES.includes(data.field_type as FieldType)) {
    return { error: 'Invalid field type' }
  }

  // Generate stable key from name
  const key = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'col'

  // Get next position
  const { data: existing } = await ctx.service
    .from('custom_columns')
    .select('position')
    .eq('table_id', tableId)
    .is('archived_at', null)
    .order('position', { ascending: false })
    .limit(1)

  const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0

  const { data: column, error } = await ctx.service
    .from('custom_columns')
    .insert({
      table_id: tableId,
      organization_id: ctx.orgId,
      name,
      key,
      field_type: data.field_type,
      position: nextPosition,
      is_required: data.is_required ?? false,
      options: data.options ?? null,
    })
    .select()
    .single()

  if (error) return { error: 'Failed to add column — key may already exist' }
  return { column }
}

export async function updateColumn(
  columnId: string,
  data: { name?: string; position?: number; is_required?: boolean; options?: Record<string, unknown> }
): Promise<{ success?: boolean; error?: string }> {
  const ctx = await getAuthContext()
  if (!ctx) return { error: 'No active organization' }

  const updates: Record<string, unknown> = {}
  if (data.name !== undefined) updates.name = data.name.trim()
  if (data.position !== undefined) updates.position = data.position
  if (data.is_required !== undefined) updates.is_required = data.is_required
  if (data.options !== undefined) updates.options = data.options

  if (Object.keys(updates).length === 0) return { error: 'Nothing to update' }

  const { error } = await ctx.service
    .from('custom_columns')
    .update(updates)
    .eq('id', columnId)
    .eq('organization_id', ctx.orgId)

  if (error) return { error: 'Failed to update column' }
  return { success: true }
}

export async function archiveColumn(
  columnId: string
): Promise<{ success?: boolean; error?: string }> {
  const ctx = await getAuthContext()
  if (!ctx) return { error: 'No active organization' }

  const { error } = await ctx.service
    .from('custom_columns')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', columnId)
    .eq('organization_id', ctx.orgId)

  if (error) return { error: 'Failed to archive column' }
  return { success: true }
}

// ---------------------------------------------------------------------------
// Rows CRUD
// ---------------------------------------------------------------------------

export async function getRows(
  tableId: string,
  params: { page: number; pageSize: number; search?: string }
): Promise<{ rows: CustomDataRow[]; total: number }> {
  const ctx = await getAuthContext()
  if (!ctx) return { rows: [], total: 0 }

  const { page, pageSize, search } = params
  const from = (page - 1) * pageSize

  const { count } = await ctx.service
    .from('custom_rows')
    .select('id', { count: 'exact', head: true })
    .eq('table_id', tableId)
    .eq('organization_id', ctx.orgId)
    .is('archived_at', null)

  let query = ctx.service
    .from('custom_rows')
    .select('id, table_id, cells, linked_lead_id, linked_company_id, linked_deal_id, created_by, created_at, updated_at, version')
    .eq('table_id', tableId)
    .eq('organization_id', ctx.orgId)
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1)

  const { data } = await query

  let rows: CustomDataRow[] = data ?? []

  if (search) {
    const term = search.toLowerCase()
    rows = rows.filter((r) => {
      const cellValues = Object.values(r.cells ?? {})
      return cellValues.some((v) =>
        typeof v === 'string' && v.toLowerCase().includes(term)
      )
    })
  }

  return { rows, total: count ?? 0 }
}

export async function getRowById(
  tableId: string,
  rowId: string
): Promise<{ row: CustomDataRow | null }> {
  const ctx = await getAuthContext()
  if (!ctx) return { row: null }

  const { data } = await ctx.service
    .from('custom_rows')
    .select('id, table_id, cells, linked_lead_id, linked_company_id, linked_deal_id, created_by, created_at, updated_at, version')
    .eq('id', rowId)
    .eq('table_id', tableId)
    .eq('organization_id', ctx.orgId)
    .is('archived_at', null)
    .single()

  return { row: data ?? null }
}

export async function createRow(
  tableId: string,
  data: {
    cells: Record<string, unknown>
    linked_lead_id?: string
    linked_company_id?: string
    linked_deal_id?: string
  }
): Promise<{ row?: CustomDataRow; error?: string }> {
  const ctx = await getAuthContext()
  if (!ctx) return { error: 'No active organization' }

  const { data: row, error } = await ctx.service
    .from('custom_rows')
    .insert({
      table_id: tableId,
      organization_id: ctx.orgId,
      cells: data.cells,
      linked_lead_id: data.linked_lead_id || null,
      linked_company_id: data.linked_company_id || null,
      linked_deal_id: data.linked_deal_id || null,
      created_by: ctx.profileId,
    })
    .select()
    .single()

  if (error) return { error: 'Failed to create row' }

  await ctx.service.from('activity_logs').insert({
    organization_id: ctx.orgId,
    actor_profile_id: ctx.profileId,
    action: 'created',
    entity_type: 'custom_row',
    entity_id: row.id,
    after_json: { table_id: tableId, cells: data.cells },
  })

  return { row }
}

export async function updateRow(
  rowId: string,
  data: {
    cells: Record<string, unknown>
    linked_lead_id?: string | null
    linked_company_id?: string | null
    linked_deal_id?: string | null
    version: number
  }
): Promise<{ success?: boolean; error?: string }> {
  const ctx = await getAuthContext()
  if (!ctx) return { error: 'No active organization' }

  const { data: current } = await ctx.service
    .from('custom_rows')
    .select('cells, version')
    .eq('id', rowId)
    .eq('organization_id', ctx.orgId)
    .single()

  if (!current) return { error: 'Row not found' }

  if (current.version !== data.version) {
    return { error: 'Update conflict — please refresh' }
  }

  const updates: Record<string, unknown> = {
    cells: data.cells,
    version: current.version + 1,
  }

  if (data.linked_lead_id !== undefined) updates.linked_lead_id = data.linked_lead_id
  if (data.linked_company_id !== undefined) updates.linked_company_id = data.linked_company_id
  if (data.linked_deal_id !== undefined) updates.linked_deal_id = data.linked_deal_id

  const { error } = await ctx.service
    .from('custom_rows')
    .update(updates)
    .eq('id', rowId)
    .eq('version', current.version)

  if (error) return { error: 'Failed to update row' }

  await ctx.service.from('activity_logs').insert({
    organization_id: ctx.orgId,
    actor_profile_id: ctx.profileId,
    action: 'updated',
    entity_type: 'custom_row',
    entity_id: rowId,
    before_json: { cells: current.cells },
    after_json: { cells: data.cells },
  })

  return { success: true }
}

export async function inlineUpdateCell(
  rowId: string,
  columnKey: string,
  value: unknown,
  version: number
): Promise<{ version?: number; error?: string }> {
  const ctx = await getAuthContext()
  if (!ctx) return { error: 'No active organization' }

  const { data: current } = await ctx.service
    .from('custom_rows')
    .select('cells, version')
    .eq('id', rowId)
    .eq('organization_id', ctx.orgId)
    .single()

  if (!current) return { error: 'Row not found' }
  if (current.version !== version) return { error: 'Update conflict — please refresh' }

  const newCells = { ...current.cells, [columnKey]: value }
  const newVersion = current.version + 1

  const { error } = await ctx.service
    .from('custom_rows')
    .update({ cells: newCells, version: newVersion })
    .eq('id', rowId)
    .eq('version', current.version)

  if (error) return { error: 'Failed to save' }
  return { version: newVersion }
}

export async function archiveRow(
  rowId: string
): Promise<{ success?: boolean; error?: string }> {
  const ctx = await getAuthContext()
  if (!ctx) return { error: 'No active organization' }

  const { error } = await ctx.service
    .from('custom_rows')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', rowId)
    .eq('organization_id', ctx.orgId)

  if (error) return { error: 'Failed to archive row' }

  await ctx.service.from('activity_logs').insert({
    organization_id: ctx.orgId,
    actor_profile_id: ctx.profileId,
    action: 'deleted',
    entity_type: 'custom_row',
    entity_id: rowId,
  })

  return { success: true }
}
