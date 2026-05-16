import { describe, it, expect } from 'vitest'
import {
  validate,
  emailSchema,
  profileNameSchema,
  orgNameSchema,
  leadStatusSchema,
  leadQualitySchema,
  pipelineStageSchema,
  createDealSchema,
  createTaskSchema,
  taskStatusSchema,
  createProjectSchema,
  projectStatusSchema,
  noteSchema,
  uuidSchema,
  pageSchema,
  searchSchema,
} from '../validate'

// ---------------------------------------------------------------------------
// validate() helper
// ---------------------------------------------------------------------------

describe('validate()', () => {
  it('returns data on valid input', () => {
    const result = validate(uuidSchema, '550e8400-e29b-41d4-a716-446655440000')
    expect(result.error).toBeUndefined()
    expect(result.data).toBe('550e8400-e29b-41d4-a716-446655440000')
  })

  it('returns error string on invalid input', () => {
    const result = validate(uuidSchema, 'not-a-uuid')
    expect(result.data).toBeUndefined()
    expect(result.error).toBeDefined()
    expect(typeof result.error).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// Scalar schemas
// ---------------------------------------------------------------------------

describe('emailSchema', () => {
  it('accepts valid email', () => {
    expect(validate(emailSchema, 'test@example.com').data).toBe('test@example.com')
  })

  it('rejects invalid email', () => {
    expect(validate(emailSchema, 'not-email').error).toBeDefined()
  })
})

describe('profileNameSchema', () => {
  it('trims and accepts valid name', () => {
    expect(validate(profileNameSchema, '  Alice  ').data).toBe('Alice')
  })

  it('rejects empty string', () => {
    expect(validate(profileNameSchema, '').error).toBeDefined()
  })

  it('rejects name over 100 chars', () => {
    expect(validate(profileNameSchema, 'a'.repeat(101)).error).toBeDefined()
  })
})

describe('orgNameSchema', () => {
  it('trims and accepts valid name', () => {
    expect(validate(orgNameSchema, ' Acme Corp ').data).toBe('Acme Corp')
  })

  it('rejects empty string', () => {
    expect(validate(orgNameSchema, '').error).toBeDefined()
  })
})

describe('uuidSchema', () => {
  it('accepts valid UUID', () => {
    expect(validate(uuidSchema, '550e8400-e29b-41d4-a716-446655440000').data).toBeDefined()
  })

  it('rejects random string', () => {
    expect(validate(uuidSchema, 'abc-123').error).toBeDefined()
  })

  it('rejects empty string', () => {
    expect(validate(uuidSchema, '').error).toBeDefined()
  })
})

describe('noteSchema', () => {
  it('trims and accepts valid note', () => {
    expect(validate(noteSchema, '  Hello world  ').data).toBe('Hello world')
  })

  it('rejects empty note', () => {
    expect(validate(noteSchema, '').error).toBeDefined()
  })

  it('rejects note over 5000 chars', () => {
    expect(validate(noteSchema, 'x'.repeat(5001)).error).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Enum schemas
// ---------------------------------------------------------------------------

describe('leadStatusSchema', () => {
  const valid = ['new', 'contacted', 'qualified', 'unqualified', 'nurture', 'converted', 'lost']

  it.each(valid)('accepts "%s"', (status) => {
    expect(validate(leadStatusSchema, status).data).toBe(status)
  })

  it('rejects invalid status', () => {
    expect(validate(leadStatusSchema, 'deleted').error).toBeDefined()
  })
})

describe('leadQualitySchema', () => {
  it.each(['hot', 'warm', 'cold'])('accepts "%s"', (q) => {
    expect(validate(leadQualitySchema, q).data).toBe(q)
  })

  it('rejects invalid quality', () => {
    expect(validate(leadQualitySchema, 'lukewarm').error).toBeDefined()
  })
})

describe('pipelineStageSchema', () => {
  it('accepts valid stage', () => {
    expect(validate(pipelineStageSchema, 'researched').data).toBe('researched')
  })

  it('rejects invalid stage', () => {
    expect(validate(pipelineStageSchema, 'invalid_stage').error).toBeDefined()
  })
})

describe('taskStatusSchema', () => {
  it.each(['pending', 'in_progress', 'completed', 'cancelled'])('accepts "%s"', (s) => {
    expect(validate(taskStatusSchema, s).data).toBe(s)
  })

  it('rejects invalid status', () => {
    expect(validate(taskStatusSchema, 'done').error).toBeDefined()
  })
})

describe('projectStatusSchema', () => {
  it.each(['active', 'on_hold', 'completed', 'cancelled'])('accepts "%s"', (s) => {
    expect(validate(projectStatusSchema, s).data).toBe(s)
  })
})

// ---------------------------------------------------------------------------
// Object schemas
// ---------------------------------------------------------------------------

describe('createDealSchema', () => {
  it('accepts minimal valid deal', () => {
    const result = validate(createDealSchema, { title: 'Big Deal' })
    expect(result.data?.title).toBe('Big Deal')
  })

  it('trims title', () => {
    const result = validate(createDealSchema, { title: '  Deal  ' })
    expect(result.data?.title).toBe('Deal')
  })

  it('rejects empty title', () => {
    expect(validate(createDealSchema, { title: '' }).error).toBeDefined()
  })

  it('accepts optional value', () => {
    const result = validate(createDealSchema, { title: 'Deal', value: 5000 })
    expect(result.data?.value).toBe(5000)
  })

  it('rejects negative value', () => {
    expect(validate(createDealSchema, { title: 'Deal', value: -1 }).error).toBeDefined()
  })

  it('accepts optional leadId as uuid', () => {
    const result = validate(createDealSchema, {
      title: 'Deal',
      leadId: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.data?.leadId).toBeDefined()
  })

  it('rejects invalid leadId', () => {
    expect(validate(createDealSchema, { title: 'Deal', leadId: 'not-uuid' }).error).toBeDefined()
  })
})

describe('createTaskSchema', () => {
  it('accepts minimal valid task', () => {
    const result = validate(createTaskSchema, { title: 'Do thing' })
    expect(result.data?.title).toBe('Do thing')
    expect(result.data?.priority).toBe('medium') // default
  })

  it('accepts explicit priority', () => {
    const result = validate(createTaskSchema, { title: 'Urgent', priority: 'urgent' })
    expect(result.data?.priority).toBe('urgent')
  })

  it('rejects invalid priority', () => {
    expect(validate(createTaskSchema, { title: 'T', priority: 'critical' }).error).toBeDefined()
  })

  it('rejects description over 2000 chars', () => {
    expect(
      validate(createTaskSchema, { title: 'T', description: 'x'.repeat(2001) }).error
    ).toBeDefined()
  })
})

describe('createProjectSchema', () => {
  it('accepts minimal valid project', () => {
    const result = validate(createProjectSchema, { name: 'My Project' })
    expect(result.data?.name).toBe('My Project')
  })

  it('rejects empty name', () => {
    expect(validate(createProjectSchema, { name: '' }).error).toBeDefined()
  })

  it('rejects negative budget', () => {
    expect(validate(createProjectSchema, { name: 'P', budget: -100 }).error).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Pagination & Search
// ---------------------------------------------------------------------------

describe('pageSchema', () => {
  it('accepts 0', () => {
    expect(validate(pageSchema, 0).data).toBe(0)
  })

  it('accepts positive integer', () => {
    expect(validate(pageSchema, 5).data).toBe(5)
  })

  it('rejects negative', () => {
    expect(validate(pageSchema, -1).error).toBeDefined()
  })

  it('rejects float', () => {
    expect(validate(pageSchema, 1.5).error).toBeDefined()
  })
})

describe('searchSchema', () => {
  it('trims search string', () => {
    expect(validate(searchSchema, '  hello  ').data).toBe('hello')
  })

  it('rejects string over 200 chars', () => {
    expect(validate(searchSchema, 'x'.repeat(201)).error).toBeDefined()
  })
})
