/**
 * In-memory rate limiter using sliding window.
 * For production at scale, replace with Redis (Upstash) based limiter.
 */

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Clean up expired entries every 60 seconds
setInterval(() => {
  const now = Date.now()
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetTime) rateLimitMap.delete(key)
  }
}, 60_000)

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetIn: number // seconds until reset
}

/**
 * Check rate limit for a given key.
 * @param key - unique identifier (e.g. userId, IP)
 * @param limit - max requests per window
 * @param windowMs - time window in milliseconds (default 60s)
 */
export function rateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60_000
): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetTime) {
    // New window
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return { success: true, limit, remaining: limit - 1, resetIn: Math.ceil(windowMs / 1000) }
  }

  if (entry.count >= limit) {
    const resetIn = Math.ceil((entry.resetTime - now) / 1000)
    return { success: false, limit, remaining: 0, resetIn }
  }

  entry.count++
  const resetIn = Math.ceil((entry.resetTime - now) / 1000)
  return { success: true, limit, remaining: limit - entry.count, resetIn }
}

// Pre-configured rate limiters for different actions
export const RATE_LIMITS = {
  // Auth: 5 attempts per minute
  auth: (key: string) => rateLimit(`auth:${key}`, 5, 60_000),
  // AI Research: 10 per minute per user
  aiResearch: (key: string) => rateLimit(`ai:${key}`, 10, 60_000),
  // Import: 3 per minute per user
  import: (key: string) => rateLimit(`import:${key}`, 3, 60_000),
  // General API: 60 per minute per user
  api: (key: string) => rateLimit(`api:${key}`, 60, 60_000),
  // Notes/updates: 30 per minute
  write: (key: string) => rateLimit(`write:${key}`, 30, 60_000),
}
