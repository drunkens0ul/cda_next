import { query } from './db'
import { headers } from 'next/headers'
import type {
  AuditLogEntry,
  CreateAuditLogInput,
  GetAuditLogsParams,
  GetAuditLogsResult,
  AuditCategory,
  AuditAction,
  AuditStatus,
  AuditTargetType,
} from './types/audit'

// ============================================================================
// Core Audit Functions
// ============================================================================

/**
 * Create an audit log entry
 * This is the main function to be called from API routes
 */
export async function createAuditLog(input: CreateAuditLogInput): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_logs (
        admin_id, admin_email, action, category,
        target_type, target_id, target_identifier,
        details, ip_address, user_agent, status, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::inet, $10, $11, $12)`,
      [
        input.adminId,
        input.adminEmail,
        input.action,
        input.category,
        input.targetType || null,
        input.targetId || null,
        input.targetIdentifier || null,
        input.details ? JSON.stringify(input.details) : null,
        input.ipAddress || null,
        input.userAgent || null,
        input.status || 'success',
        input.errorMessage || null,
      ]
    )
  } catch (error) {
    // Log error but don't throw - audit logging should not break main functionality
    console.error('Failed to create audit log:', error)
  }
}

/**
 * Validate if a string is a valid IP address (IPv4 or IPv6)
 */
function isValidIpAddress(ip: string): boolean {
  // IPv4 pattern
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/
  // IPv6 pattern (simplified - covers most cases)
  const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/

  if (ipv4Pattern.test(ip)) {
    // Validate each octet is 0-255
    const octets = ip.split('.')
    return octets.every(o => parseInt(o, 10) <= 255)
  }

  return ipv6Pattern.test(ip)
}

/**
 * Helper to get IP address and user agent from request headers
 */
export async function getRequestContext(): Promise<{
  ipAddress: string | null
  userAgent: string | null
}> {
  try {
    const headersList = await headers()
    const forwardedFor = headersList.get('x-forwarded-for')
    let ipAddress = forwardedFor?.split(',')[0]?.trim() ||
                    headersList.get('x-real-ip') ||
                    null

    // Strip port if present (e.g., "94.204.4.27:59904" → "94.204.4.27")
    if (ipAddress) {
      const colonCount = (ipAddress.match(/:/g) || []).length
      // IPv4 with port has exactly 1 colon, IPv6 has multiple
      if (colonCount === 1) {
        ipAddress = ipAddress.split(':')[0]
      }
    }

    // Validate IP address format for PostgreSQL INET type
    if (ipAddress && !isValidIpAddress(ipAddress)) {
      console.warn(`Invalid IP address format: ${ipAddress}`)
      ipAddress = null
    }

    const userAgent = headersList.get('user-agent') || null
    return { ipAddress, userAgent }
  } catch {
    return { ipAddress: null, userAgent: null }
  }
}

/**
 * Convenience function to log an admin action with automatic request context
 */
export async function logAdminAction(
  admin: { id: string; email: string },
  action: AuditAction,
  category: AuditCategory,
  options?: {
    targetType?: AuditTargetType
    targetId?: string
    targetIdentifier?: string
    details?: Record<string, unknown>
    status?: AuditStatus
    errorMessage?: string
  }
): Promise<void> {
  const { ipAddress, userAgent } = await getRequestContext()

  await createAuditLog({
    adminId: admin.id,
    adminEmail: admin.email,
    action,
    category,
    targetType: options?.targetType,
    targetId: options?.targetId,
    targetIdentifier: options?.targetIdentifier,
    details: options?.details,
    ipAddress: ipAddress || undefined,
    userAgent: userAgent || undefined,
    status: options?.status,
    errorMessage: options?.errorMessage,
  })
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get audit logs with filtering and pagination
 */
export async function getAuditLogs(
  params: GetAuditLogsParams = {}
): Promise<GetAuditLogsResult> {
  const page = Math.max(1, params.page || 1)
  const limit = Math.min(100, Math.max(1, params.limit || 50))
  const offset = (page - 1) * limit

  // Build WHERE conditions
  const conditions: string[] = []
  const queryParams: (string | number | Date)[] = []
  let paramIndex = 1

  if (params.category) {
    conditions.push(`category = $${paramIndex++}`)
    queryParams.push(params.category)
  }

  if (params.action) {
    conditions.push(`action = $${paramIndex++}`)
    queryParams.push(params.action)
  }

  if (params.adminId) {
    conditions.push(`admin_id = $${paramIndex++}`)
    queryParams.push(params.adminId)
  }

  if (params.targetType) {
    conditions.push(`target_type = $${paramIndex++}`)
    queryParams.push(params.targetType)
  }

  if (params.targetId) {
    conditions.push(`target_id = $${paramIndex++}`)
    queryParams.push(params.targetId)
  }

  if (params.status) {
    conditions.push(`status = $${paramIndex++}`)
    queryParams.push(params.status)
  }

  if (params.startDate) {
    conditions.push(`created_at >= $${paramIndex++}`)
    queryParams.push(params.startDate)
  }

  if (params.endDate) {
    conditions.push(`created_at <= $${paramIndex++}`)
    queryParams.push(params.endDate)
  }

  if (params.search) {
    conditions.push(`(admin_email ILIKE $${paramIndex} OR target_identifier ILIKE $${paramIndex})`)
    queryParams.push(`%${params.search}%`)
    paramIndex++
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : ''

  // Get logs with total count
  const result = await query<{
    id: string
    admin_id: string
    admin_email: string
    action: AuditAction
    category: AuditCategory
    target_type: AuditTargetType | null
    target_id: string | null
    target_identifier: string | null
    details: Record<string, unknown> | null
    ip_address: string | null
    user_agent: string | null
    status: AuditStatus
    error_message: string | null
    created_at: Date
    total_count: string
  }>(
    `SELECT *,
            COUNT(*) OVER() as total_count
     FROM audit_logs
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...queryParams, limit, offset]
  )

  const total = result.rows.length > 0
    ? parseInt(result.rows[0].total_count, 10)
    : 0
  const totalPages = Math.ceil(total / limit)

  const logs: AuditLogEntry[] = result.rows.map(row => ({
    id: row.id,
    adminId: row.admin_id,
    adminEmail: row.admin_email,
    action: row.action,
    category: row.category,
    targetType: row.target_type,
    targetId: row.target_id,
    targetIdentifier: row.target_identifier,
    details: row.details,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    status: row.status,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  }))

  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  }
}

/**
 * Get audit log statistics for dashboard
 */
export async function getAuditStats(): Promise<{
  totalLogs: number
  last24Hours: number
  last7Days: number
  byCategory: { category: string; count: number }[]
  recentFailures: number
}> {
  const result = await query<{
    total_logs: string
    last_24_hours: string
    last_7_days: string
    recent_failures: string
  }>(`
    SELECT
      COUNT(*) as total_logs,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as last_24_hours,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as last_7_days,
      COUNT(*) FILTER (WHERE status = 'failure' AND created_at >= NOW() - INTERVAL '24 hours') as recent_failures
    FROM audit_logs
  `)

  const categoryResult = await query<{ category: string; count: string }>(`
    SELECT category, COUNT(*) as count
    FROM audit_logs
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY category
    ORDER BY count DESC
  `)

  const stats = result.rows[0]

  return {
    totalLogs: parseInt(stats.total_logs, 10),
    last24Hours: parseInt(stats.last_24_hours, 10),
    last7Days: parseInt(stats.last_7_days, 10),
    byCategory: categoryResult.rows.map(row => ({
      category: row.category,
      count: parseInt(row.count, 10),
    })),
    recentFailures: parseInt(stats.recent_failures, 10),
  }
}
