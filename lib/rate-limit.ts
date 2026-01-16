import { query } from './db'

interface RateLimitConfig {
  maxRequests: number
  windowMinutes: number
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  email_send: {
    maxRequests: parseInt(process.env.RATE_LIMIT_EMAIL_MAX || '5'),
    windowMinutes: parseInt(process.env.RATE_LIMIT_EMAIL_WINDOW_MINUTES || '15'),
  },
  login_attempt: {
    maxRequests: parseInt(process.env.RATE_LIMIT_LOGIN_MAX || '10'),
    windowMinutes: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW_MINUTES || '60'),
  },
  resend_email: {
    maxRequests: 3,
    windowMinutes: 15,
  },
  admin_bulk_verification: {
    maxRequests: 1,
    windowMinutes: 30,
  },
  admin_email_to_recipient: {
    maxRequests: 3,
    windowMinutes: 60,
  },
}

export async function checkRateLimit(
  identifier: string,
  actionType: string
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const config = RATE_LIMITS[actionType]
  if (!config) {
    return { allowed: true, remaining: Infinity, resetAt: new Date() }
  }

  const windowStart = new Date()
  windowStart.setMinutes(windowStart.getMinutes() - config.windowMinutes)

  const result = await query<{ total_count: string }>(
    `SELECT COALESCE(SUM(request_count), 0) as total_count
     FROM rate_limits
     WHERE identifier = $1 AND action_type = $2 AND window_start > $3`,
    [identifier, actionType, windowStart]
  )

  const currentCount = parseInt(result.rows[0]?.total_count || '0')
  const remaining = Math.max(0, config.maxRequests - currentCount)
  const resetAt = new Date()
  resetAt.setMinutes(resetAt.getMinutes() + config.windowMinutes)

  return {
    allowed: currentCount < config.maxRequests,
    remaining,
    resetAt,
  }
}

export async function incrementRateLimit(
  identifier: string,
  actionType: string
): Promise<void> {
  const now = new Date()
  // Round to nearest minute for grouping
  now.setSeconds(0, 0)

  await query(
    `INSERT INTO rate_limits (identifier, action_type, window_start, request_count)
     VALUES ($1, $2, $3, 1)
     ON CONFLICT (identifier, action_type, window_start)
     DO UPDATE SET request_count = rate_limits.request_count + 1`,
    [identifier, actionType, now]
  )
}

export async function cleanupExpiredRateLimits(): Promise<void> {
  const maxWindow = Math.max(
    ...Object.values(RATE_LIMITS).map(c => c.windowMinutes)
  )
  const cutoff = new Date()
  cutoff.setMinutes(cutoff.getMinutes() - maxWindow * 2)

  await query(
    `DELETE FROM rate_limits WHERE window_start < $1`,
    [cutoff]
  )
}
