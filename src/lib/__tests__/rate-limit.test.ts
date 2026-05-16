import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock redis module first (rate-limit imports from it)
vi.mock('../redis', () => ({
  redis: {},
}))

// Mock Upstash ratelimit
const mockLimit = vi.fn().mockResolvedValue({
  success: true,
  limit: 30,
  remaining: 29,
  reset: Date.now() + 60000,
})

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class {
    limit = mockLimit
    static slidingWindow() { return 'sliding-window' }
  },
}))

describe('RATE_LIMITS', () => {
  let RATE_LIMITS: typeof import('../rate-limit').RATE_LIMITS

  beforeEach(async () => {
    vi.resetModules()

    // Re-mock after resetModules
    vi.doMock('../redis', () => ({ redis: {} }))
    vi.doMock('@upstash/ratelimit', () => ({
      Ratelimit: class {
        limit = mockLimit
        static slidingWindow() { return 'sliding-window' }
      },
    }))

    const mod = await import('../rate-limit')
    RATE_LIMITS = mod.RATE_LIMITS
  })

  it('exports all required limiter functions', () => {
    expect(typeof RATE_LIMITS.auth).toBe('function')
    expect(typeof RATE_LIMITS.aiResearch).toBe('function')
    expect(typeof RATE_LIMITS.import).toBe('function')
    expect(typeof RATE_LIMITS.api).toBe('function')
    expect(typeof RATE_LIMITS.write).toBe('function')
    expect(typeof RATE_LIMITS.form).toBe('function')
  })

  it('auth() returns success result', async () => {
    const result = await RATE_LIMITS.auth('test-ip')
    expect(result.success).toBe(true)
  })

  it('write() returns success result', async () => {
    const result = await RATE_LIMITS.write('user-123')
    expect(result.success).toBe(true)
  })

  it('all limiters accept a key string', async () => {
    const fns = ['auth', 'aiResearch', 'import', 'api', 'write', 'form'] as const
    for (const fn of fns) {
      const result = await RATE_LIMITS[fn]('test-key')
      expect(result).toHaveProperty('success')
    }
  })
})
