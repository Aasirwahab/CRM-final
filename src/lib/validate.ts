import { z } from 'zod/v4'

// ============================================================
// Shared validation schemas for server actions
// ============================================================

// -- Auth / Profile --
export const emailSchema = z.email('Invalid email address')
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters')

export const profileNameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must be under 100 characters')
  .transform((s) => s.trim())

export const orgNameSchema = z
  .string()
  .min(1, 'Organization name is required')
  .max(100, 'Organization name must be under 100 characters')
  .transform((s) => s.trim())

// -- Leads --
export const leadStatusSchema = z.enum([
  'new', 'contacted', 'qualified', 'unqualified', 'nurture', 'converted', 'lost',
])

export const leadQualitySchema = z.enum(['hot', 'warm', 'cold'])

export const pipelineStageSchema = z.enum([
  'imported', 'researched', 'qualified', 'contacted', 'replied',
  'meeting_booked', 'proposal_sent', 'negotiation', 'won', 'lost', 'nurture',
])

// -- Deals --
export const createDealSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200).transform((s) => s.trim()),
  value: z.number().min(0).optional(),
  leadId: z.string().uuid().optional(),
  stage: z.string().max(50).optional(),
})

export const dealStatusSchema = z.enum(['open', 'won', 'lost'])

// -- Tasks --
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200).transform((s) => s.trim()),
  description: z.string().max(2000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  dueDate: z.string().optional(),
  leadId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
})

export const taskStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'cancelled'])

// -- Projects --
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200).transform((s) => s.trim()),
  type: z.string().max(100).optional(),
  budget: z.number().min(0).optional(),
  deadline: z.string().optional(),
  dealId: z.string().uuid().optional(),
})

export const projectStatusSchema = z.enum(['active', 'on_hold', 'completed', 'cancelled'])

// -- Notes --
export const noteSchema = z
  .string()
  .min(1, 'Note cannot be empty')
  .max(5000, 'Note must be under 5000 characters')
  .transform((s) => s.trim())

// -- UUID --
export const uuidSchema = z.string().uuid('Invalid ID')

// -- Pagination --
export const pageSchema = z.number().int().min(0).default(0)

// -- Search --
export const searchSchema = z
  .string()
  .max(200)
  .transform((s) => s.trim())
  .optional()

// ============================================================
// Helper: safe parse that returns { data } or { error }
// ============================================================
export function validate<T>(schema: z.ZodType<T>, input: unknown): { data: T; error?: never } | { data?: never; error: string } {
  const result = schema.safeParse(input)
  if (result.success) return { data: result.data }
  const msg = result.error.issues.map((i) => i.message).join(', ')
  return { error: msg }
}
