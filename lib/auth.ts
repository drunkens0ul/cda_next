import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { query } from './db'
import { sendVerificationEmail } from './email'
import type { User, Session, VerificationToken, AuthUser, UserRole, AdminUserListItem, GetUsersParams, GetUsersResult, PaginationInfo, PendingSignup } from './types/auth'
import type { UserExportItem, UserStats, UsersPageStats, PendingSignupItem, GetPendingSignupsParams, GetPendingSignupsResult, PendingSignupsStats, DomainCount } from './types/admin'

const SESSION_COOKIE_NAME = 'cda_session'
const SESSION_EXPIRY_DAYS = parseInt(process.env.SESSION_TOKEN_EXPIRY_DAYS || '30')

export function generateSecureToken(): string {
  return randomBytes(32).toString('hex')
}

export function getUserInitials(firstName: string, lastName: string | null): string {
  if (!lastName) {
    return firstName.substring(0, 2).toUpperCase()
  }
  return (firstName[0] + lastName[0]).toUpperCase()
}

export function getFullName(firstName: string, lastName: string | null): string {
  return lastName ? `${firstName} ${lastName}`.trim() : firstName
}

export async function createSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  const sessionToken = generateSecureToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS)

  await query(
    `INSERT INTO sessions (user_id, session_token, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, sessionToken, expiresAt, ipAddress || null, userAgent || null]
  )

  return sessionToken
}

export async function setSessionCookie(sessionToken: string): Promise<void> {
  const cookieStore = await cookies()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS)

  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  })
}

export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE_NAME)?.value
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function getSessionByToken(token: string): Promise<Session | null> {
  const result = await query<{
    id: string
    user_id: string
    session_token: string
    expires_at: Date
    ip_address: string | null
    user_agent: string | null
    is_deleted: boolean
    deleted_at: Date | null
    created_at: Date
    last_active_at: Date
  }>(
    `SELECT * FROM sessions WHERE session_token = $1 AND expires_at > NOW() AND is_deleted = FALSE`,
    [token]
  )

  if (result.rows.length === 0) {
    return null
  }

  const row = result.rows[0]
  return {
    id: row.id,
    userId: row.user_id,
    sessionToken: row.session_token,
    expiresAt: row.expires_at,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    isDeleted: row.is_deleted,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    lastActiveAt: row.last_active_at,
  }
}

export async function updateSessionActivity(sessionId: string): Promise<void> {
  await query(
    `UPDATE sessions SET last_active_at = NOW() WHERE id = $1`,
    [sessionId]
  )
}

export async function deleteSession(sessionToken: string): Promise<void> {
  // Soft delete instead of hard delete
  await query(
    `UPDATE sessions SET is_deleted = TRUE, deleted_at = NOW() WHERE session_token = $1`,
    [sessionToken]
  )
}

export async function deleteUserSessions(userId: string): Promise<void> {
  // Soft delete instead of hard delete
  await query(
    `UPDATE sessions SET is_deleted = TRUE, deleted_at = NOW() WHERE user_id = $1`,
    [userId]
  )
}

export async function getUserById(userId: string): Promise<User | null> {
  const result = await query<{
    id: string
    email: string
    first_name: string
    last_name: string | null
    phone_number: string | null
    email_verified: boolean
    role: UserRole
    is_deleted: boolean
    deleted_at: Date | null
    last_login_at: Date | null
    created_at: Date
    updated_at: Date
  }>(
    `SELECT * FROM users WHERE id = $1 AND is_deleted = FALSE`,
    [userId]
  )

  if (result.rows.length === 0) {
    return null
  }

  const row = result.rows[0]
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phoneNumber: row.phone_number,
    emailVerified: row.email_verified,
    role: row.role || 'user',
    isDeleted: row.is_deleted,
    deletedAt: row.deleted_at,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await query<{
    id: string
    email: string
    first_name: string
    last_name: string | null
    phone_number: string | null
    email_verified: boolean
    role: UserRole
    is_deleted: boolean
    deleted_at: Date | null
    last_login_at: Date | null
    created_at: Date
    updated_at: Date
  }>(
    `SELECT * FROM users WHERE email = $1 AND is_deleted = FALSE`,
    [email.toLowerCase()]
  )

  if (result.rows.length === 0) {
    return null
  }

  const row = result.rows[0]
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phoneNumber: row.phone_number,
    emailVerified: row.email_verified,
    role: row.role || 'user',
    isDeleted: row.is_deleted,
    deletedAt: row.deleted_at,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function createUser(
  email: string,
  firstName: string,
  lastName?: string,
  phoneNumber?: string
): Promise<User> {
  const result = await query<{
    id: string
    email: string
    first_name: string
    last_name: string | null
    phone_number: string | null
    email_verified: boolean
    role: UserRole
    is_deleted: boolean
    deleted_at: Date | null
    last_login_at: Date | null
    created_at: Date
    updated_at: Date
  }>(
    `INSERT INTO users (email, first_name, last_name, phone_number, email_verified)
     VALUES ($1, $2, $3, $4, true)
     RETURNING *`,
    [email.toLowerCase(), firstName, lastName || null, phoneNumber || null]
  )

  const row = result.rows[0]
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phoneNumber: row.phone_number,
    emailVerified: row.email_verified,
    role: row.role || 'user',
    isDeleted: row.is_deleted,
    deletedAt: row.deleted_at,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function updateUserProfile(
  userId: string,
  firstName: string,
  lastName?: string
): Promise<User | null> {
  const result = await query<{
    id: string
    email: string
    first_name: string
    last_name: string | null
    phone_number: string | null
    email_verified: boolean
    role: UserRole
    is_deleted: boolean
    deleted_at: Date | null
    last_login_at: Date | null
    created_at: Date
    updated_at: Date
  }>(
    `UPDATE users SET first_name = $1, last_name = $2, updated_at = NOW()
     WHERE id = $3 AND is_deleted = FALSE
     RETURNING *`,
    [firstName, lastName || null, userId]
  )

  if (result.rows.length === 0) {
    return null
  }

  const row = result.rows[0]
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phoneNumber: row.phone_number,
    emailVerified: row.email_verified,
    role: row.role || 'user',
    isDeleted: row.is_deleted,
    deletedAt: row.deleted_at,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function updateLastLogin(userId: string): Promise<void> {
  await query(
    `UPDATE users SET last_login_at = NOW() WHERE id = $1`,
    [userId]
  )
}

export function generatePollingToken(): string {
  return randomBytes(16).toString('hex')
}

export async function createVerificationToken(
  email: string,
  tokenType: 'signup' | 'login',
  userId?: string,
  pollingToken?: string
): Promise<VerificationToken & { pollingToken?: string }> {
  const token = generateSecureToken()
  const polling = pollingToken || generatePollingToken()
  const expiryMinutes = tokenType === 'signup'
    ? parseInt(process.env.VERIFICATION_TOKEN_EXPIRY_MINUTES || '30')
    : parseInt(process.env.MAGIC_LINK_EXPIRY_MINUTES || '15')

  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes)

  const result = await query<{
    id: string
    user_id: string | null
    email: string
    token: string
    token_type: 'signup' | 'login'
    expires_at: Date
    used_at: Date | null
    is_deleted: boolean
    deleted_at: Date | null
    polling_token: string | null
    verified_user_id: string | null
    created_at: Date
  }>(
    `INSERT INTO verification_tokens (email, token, token_type, expires_at, user_id, polling_token)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [email.toLowerCase(), token, tokenType, expiresAt, userId || null, polling]
  )

  const row = result.rows[0]
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    token: row.token,
    tokenType: row.token_type,
    expiresAt: row.expires_at,
    usedAt: row.used_at,
    isDeleted: row.is_deleted,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    pollingToken: row.polling_token || undefined,
  }
}

export async function getVerificationToken(token: string): Promise<VerificationToken | null> {
  const result = await query<{
    id: string
    user_id: string | null
    email: string
    token: string
    token_type: 'signup' | 'login'
    expires_at: Date
    used_at: Date | null
    is_deleted: boolean
    deleted_at: Date | null
    created_at: Date
  }>(
    `SELECT * FROM verification_tokens WHERE token = $1 AND is_deleted = FALSE`,
    [token]
  )

  if (result.rows.length === 0) {
    return null
  }

  const row = result.rows[0]
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    token: row.token,
    tokenType: row.token_type,
    expiresAt: row.expires_at,
    usedAt: row.used_at,
    isDeleted: row.is_deleted,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
  }
}

export async function markTokenAsUsed(tokenId: string): Promise<void> {
  await query(
    `UPDATE verification_tokens SET used_at = NOW() WHERE id = $1`,
    [tokenId]
  )
}

export async function invalidateUserTokens(email: string, tokenType: 'signup' | 'login'): Promise<void> {
  // Soft delete instead of hard delete
  await query(
    `UPDATE verification_tokens SET is_deleted = TRUE, deleted_at = NOW()
     WHERE email = $1 AND token_type = $2 AND used_at IS NULL AND is_deleted = FALSE`,
    [email.toLowerCase(), tokenType]
  )
}

export async function createPendingSignup(
  email: string,
  firstName: string,
  tokenId: string,
  lastName?: string,
  phoneNumber?: string
): Promise<void> {
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + parseInt(process.env.VERIFICATION_TOKEN_EXPIRY_MINUTES || '30'))

  await query(
    `INSERT INTO pending_signups (email, first_name, last_name, phone_number, token_id, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (email) DO UPDATE SET
       first_name = EXCLUDED.first_name,
       last_name = EXCLUDED.last_name,
       phone_number = EXCLUDED.phone_number,
       token_id = EXCLUDED.token_id,
       expires_at = EXCLUDED.expires_at,
       is_deleted = FALSE,
       deleted_at = NULL`,
    [email.toLowerCase(), firstName, lastName || null, phoneNumber || null, tokenId, expiresAt]
  )
}

export async function getPendingSignup(tokenId: string): Promise<{
  email: string
  firstName: string
  lastName: string | null
  phoneNumber: string | null
} | null> {
  const result = await query<{
    email: string
    first_name: string
    last_name: string | null
    phone_number: string | null
  }>(
    `SELECT email, first_name, last_name, phone_number FROM pending_signups
     WHERE token_id = $1 AND expires_at > NOW() AND is_deleted = FALSE`,
    [tokenId]
  )

  if (result.rows.length === 0) {
    return null
  }

  const row = result.rows[0]
  return {
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phoneNumber: row.phone_number,
  }
}

export async function deletePendingSignup(email: string): Promise<void> {
  // Soft delete instead of hard delete
  await query(
    `UPDATE pending_signups SET is_deleted = TRUE, deleted_at = NOW() WHERE email = $1`,
    [email.toLowerCase()]
  )
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const sessionToken = await getSessionToken()
  if (!sessionToken) {
    return null
  }

  const session = await getSessionByToken(sessionToken)
  if (!session) {
    return null
  }

  await updateSessionActivity(session.id)

  const user = await getUserById(session.userId)
  if (!user) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: getFullName(user.firstName, user.lastName),
    initials: getUserInitials(user.firstName, user.lastName),
    role: user.role,
  }
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Polling token functions for verify-email page auto-redirect
export async function markPollingTokenVerified(tokenId: string, userId: string): Promise<void> {
  await query(
    `UPDATE verification_tokens SET verified_user_id = $1 WHERE id = $2`,
    [userId, tokenId]
  )
}

export async function checkPollingToken(pollingToken: string): Promise<{
  verified: boolean
  userId: string | null
  expired: boolean
}> {
  const result = await query<{
    verified_user_id: string | null
    expires_at: Date
    used_at: Date | null
  }>(
    `SELECT verified_user_id, expires_at, used_at FROM verification_tokens
     WHERE polling_token = $1 AND is_deleted = FALSE`,
    [pollingToken]
  )

  if (result.rows.length === 0) {
    return { verified: false, userId: null, expired: true }
  }

  const row = result.rows[0]
  const isExpired = new Date() > row.expires_at

  if (isExpired) {
    return { verified: false, userId: null, expired: true }
  }

  if (row.verified_user_id) {
    return { verified: true, userId: row.verified_user_id, expired: false }
  }

  return { verified: false, userId: null, expired: false }
}

// Marketing email list functions
export async function subscribeToNewsletter(
  email: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; alreadySubscribed: boolean }> {
  // Check if already subscribed and active
  const existing = await query<{ id: string; is_active: boolean }>(
    `SELECT id, is_active FROM marketing_email_list WHERE email = $1`,
    [email.toLowerCase()]
  )

  if (existing.rows.length > 0) {
    if (existing.rows[0].is_active) {
      return { success: true, alreadySubscribed: true }
    }
    // Reactivate if previously unsubscribed
    await query(
      `UPDATE marketing_email_list SET is_active = TRUE, unsubscribed_at = NULL, updated_at = NOW()
       WHERE email = $1`,
      [email.toLowerCase()]
    )
    return { success: true, alreadySubscribed: false }
  }

  // Insert new subscription
  await query(
    `INSERT INTO marketing_email_list (email, ip_address, user_agent)
     VALUES ($1, $2, $3)`,
    [email.toLowerCase(), ipAddress || null, userAgent || null]
  )

  return { success: true, alreadySubscribed: false }
}

// Admin functions
export async function getAllUsers(): Promise<AdminUserListItem[]> {
  const result = await query<{
    id: string
    email: string
    first_name: string
    last_name: string | null
    role: UserRole
    last_login_at: Date | null
    created_at: Date
  }>(
    `SELECT id, email, first_name, last_name, role, last_login_at, created_at
     FROM users
     WHERE is_deleted = FALSE
     ORDER BY created_at DESC`
  )

  return result.rows.map(row => ({
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role || 'user',
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
  }))
}

export async function updateUserRole(userId: string, role: UserRole): Promise<boolean> {
  const result = await query(
    `UPDATE users SET role = $1, updated_at = NOW()
     WHERE id = $2 AND is_deleted = FALSE`,
    [role, userId]
  )

  return (result.rowCount ?? 0) > 0
}

export async function getUsersPaginated(params: GetUsersParams = {}): Promise<GetUsersResult> {
  const page = Math.max(1, params.page || 1)
  const limit = Math.min(100, Math.max(1, params.limit || 20))
  const offset = (page - 1) * limit
  const search = params.search?.trim() || ''
  const emailDomain = params.emailDomain?.trim() || ''

  // Build WHERE conditions
  const conditions: string[] = ['is_deleted = FALSE']
  const queryParams: (string | number)[] = []
  let paramIndex = 1

  if (search) {
    conditions.push(`(
      email ILIKE $${paramIndex} OR
      first_name ILIKE $${paramIndex} OR
      last_name ILIKE $${paramIndex}
    )`)
    queryParams.push(`%${search}%`)
    paramIndex++
  }

  if (emailDomain) {
    conditions.push(`email ILIKE $${paramIndex}`)
    queryParams.push(`%@${emailDomain}`)
    paramIndex++
  }

  const whereClause = conditions.join(' AND ')

  // Get users with total count using window function
  const usersResult = await query<{
    id: string
    email: string
    first_name: string
    last_name: string | null
    role: UserRole
    last_login_at: Date | null
    created_at: Date
    total_count: string
  }>(
    `SELECT id, email, first_name, last_name, role, last_login_at, created_at,
            COUNT(*) OVER() as total_count
     FROM users
     WHERE ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...queryParams, limit, offset]
  )

  const total = usersResult.rows.length > 0 ? parseInt(usersResult.rows[0].total_count, 10) : 0
  const totalPages = Math.ceil(total / limit)

  const users: AdminUserListItem[] = usersResult.rows.map(row => ({
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role || 'user',
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
  }))

  // Get unique email domains
  const domains = await getEmailDomains()

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
    domains,
  }
}

export async function getEmailDomains(): Promise<string[]> {
  const result = await query<{ domain: string }>(
    `SELECT DISTINCT SUBSTRING(email FROM '@(.*)$') as domain
     FROM users
     WHERE is_deleted = FALSE AND email LIKE '%@%'
     ORDER BY domain`
  )

  return result.rows.map(row => row.domain).filter(Boolean)
}

// ============================================================================
// Admin Export Functions
// ============================================================================

/**
 * Get users for CSV export with event registration status
 * Only includes verified users (email_verified = true)
 */
export async function getUsersForExport(eventId?: string): Promise<UserExportItem[]> {
  let queryText: string
  const queryParams: string[] = []

  if (eventId) {
    queryText = `
      SELECT
        u.id, u.first_name, u.last_name, u.email,
        SUBSTRING(u.email FROM '@(.*)$') as domain,
        u.role, u.email_verified, u.created_at, u.last_login_at,
        CASE WHEN er.id IS NOT NULL THEN TRUE ELSE FALSE END as is_registered
      FROM users u
      LEFT JOIN event_registrations er ON u.id = er.user_id
        AND er.event_id = $1 AND er.status = 'registered' AND er.is_deleted = FALSE
      WHERE u.is_deleted = FALSE AND u.email_verified = TRUE
      ORDER BY u.created_at DESC
    `
    queryParams.push(eventId)
  } else {
    // If no eventId, check if registered for ANY event
    queryText = `
      SELECT
        u.id, u.first_name, u.last_name, u.email,
        SUBSTRING(u.email FROM '@(.*)$') as domain,
        u.role, u.email_verified, u.created_at, u.last_login_at,
        CASE WHEN EXISTS (
          SELECT 1 FROM event_registrations er
          WHERE er.user_id = u.id AND er.status = 'registered' AND er.is_deleted = FALSE
        ) THEN TRUE ELSE FALSE END as is_registered
      FROM users u
      WHERE u.is_deleted = FALSE AND u.email_verified = TRUE
      ORDER BY u.created_at DESC
    `
  }

  const result = await query<{
    id: string
    first_name: string
    last_name: string | null
    email: string
    domain: string
    role: UserRole
    email_verified: boolean
    created_at: Date
    last_login_at: Date | null
    is_registered: boolean
  }>(queryText, queryParams)

  return result.rows.map(row => ({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    domain: row.domain,
    role: row.role || 'user',
    emailVerified: row.email_verified,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
    isRegisteredForEvent: row.is_registered,
  }))
}

// ============================================================================
// Admin Dashboard Stats Functions
// ============================================================================

/**
 * Get comprehensive user statistics for admin dashboard
 */
export async function getUserStats(): Promise<UserStats> {
  // Get user counts (total, verified, unverified)
  const userCountsResult = await query<{
    total_registered: string
    total_verified: string
    total_unverified: string
    new_7_days: string
    new_30_days: string
  }>(`
    SELECT
      COUNT(*) FILTER (WHERE is_deleted = FALSE) as total_registered,
      COUNT(*) FILTER (WHERE is_deleted = FALSE AND email_verified = TRUE) as total_verified,
      COUNT(*) FILTER (WHERE is_deleted = FALSE AND email_verified = FALSE) as total_unverified,
      COUNT(*) FILTER (WHERE is_deleted = FALSE AND email_verified = TRUE AND created_at >= NOW() - INTERVAL '7 days') as new_7_days,
      COUNT(*) FILTER (WHERE is_deleted = FALSE AND email_verified = TRUE AND created_at >= NOW() - INTERVAL '30 days') as new_30_days
    FROM users
  `)

  // Get pending signups counts
  const pendingCountsResult = await query<{
    total_pending: string
    expired_pending: string
  }>(`
    SELECT
      COUNT(*) FILTER (WHERE is_deleted = FALSE) as total_pending,
      COUNT(*) FILTER (WHERE is_deleted = FALSE AND expires_at < NOW()) as expired_pending
    FROM pending_signups
  `)

  // Get verified users by domain
  const domainResult = await query<{ domain: string; count: string }>(`
    SELECT
      SUBSTRING(email FROM '@(.*)$') as domain,
      COUNT(*) as count
    FROM users
    WHERE is_deleted = FALSE AND email_verified = TRUE
    GROUP BY domain
    ORDER BY count DESC
  `)

  const userCounts = userCountsResult.rows[0]
  const pendingCounts = pendingCountsResult.rows[0]

  return {
    totalRegistered: parseInt(userCounts.total_registered, 10) + parseInt(pendingCounts.total_pending, 10),
    totalVerified: parseInt(userCounts.total_verified, 10),
    totalUnverified: parseInt(userCounts.total_unverified, 10),
    totalPendingSignups: parseInt(pendingCounts.total_pending, 10),
    expiredPendingSignups: parseInt(pendingCounts.expired_pending, 10),
    verifiedByDomain: domainResult.rows.map(row => ({
      domain: row.domain,
      count: parseInt(row.count, 10),
    })),
    newVerifiedLast7Days: parseInt(userCounts.new_7_days, 10),
    newVerifiedLast30Days: parseInt(userCounts.new_30_days, 10),
  }
}

/**
 * Get user statistics for the Users admin page
 * Includes total verified users count and domain breakdown
 */
export async function getUsersPageStats(): Promise<UsersPageStats> {
  // Get total verified users count
  const totalResult = await query<{ count: string }>(`
    SELECT COUNT(*) as count
    FROM users
    WHERE is_deleted = FALSE AND email_verified = TRUE
  `)

  // Get domain breakdown for verified users
  const domainResult = await query<{ domain: string; count: string }>(`
    SELECT
      SUBSTRING(email FROM '@(.*)$') as domain,
      COUNT(*) as count
    FROM users
    WHERE is_deleted = FALSE AND email_verified = TRUE
    GROUP BY domain
    ORDER BY count DESC
  `)

  return {
    totalUsers: parseInt(totalResult.rows[0]?.count || '0', 10),
    domainBreakdown: domainResult.rows.map(row => ({
      domain: row.domain,
      count: parseInt(row.count, 10),
    })),
  }
}

// ============================================================================
// Pending Signups Admin Functions
// ============================================================================

/**
 * Get pending signups with pagination, search, and domain filtering
 */
export async function getPendingSignupsPaginated(params: GetPendingSignupsParams = {}): Promise<GetPendingSignupsResult> {
  const page = Math.max(1, params.page || 1)
  const limit = Math.min(100, Math.max(1, params.limit || 20))
  const offset = (page - 1) * limit
  const search = params.search?.trim() || ''
  const domain = params.domain?.trim() || ''

  // Build WHERE conditions
  const conditions: string[] = ['is_deleted = FALSE']
  const queryParams: (string | number)[] = []
  let paramIndex = 1

  if (search) {
    conditions.push(`(
      email ILIKE $${paramIndex} OR
      first_name ILIKE $${paramIndex} OR
      last_name ILIKE $${paramIndex}
    )`)
    queryParams.push(`%${search}%`)
    paramIndex++
  }

  if (domain) {
    conditions.push(`email ILIKE $${paramIndex}`)
    queryParams.push(`%@${domain}`)
    paramIndex++
  }

  const whereClause = conditions.join(' AND ')

  // Get pending signups with stats
  const pendingResult = await query<{
    id: string
    email: string
    first_name: string
    last_name: string | null
    phone_number: string | null
    created_at: Date
    expires_at: Date
    is_expired: boolean
    domain: string
    total_count: string
  }>(
    `SELECT
      id, email, first_name, last_name, phone_number, created_at, expires_at,
      SUBSTRING(email FROM '@(.*)$') as domain,
      CASE WHEN expires_at < NOW() THEN TRUE ELSE FALSE END as is_expired,
      COUNT(*) OVER() as total_count
     FROM pending_signups
     WHERE ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...queryParams, limit, offset]
  )

  const total = pendingResult.rows.length > 0 ? parseInt(pendingResult.rows[0].total_count, 10) : 0
  const totalPages = Math.ceil(total / limit)

  const pendingSignups: PendingSignupItem[] = pendingResult.rows.map(row => ({
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phoneNumber: row.phone_number,
    domain: row.domain,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    isExpired: row.is_expired,
  }))

  // Get stats for the filtered results
  const statsResult = await query<{
    total: string
    expired: string
    active: string
  }>(`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE expires_at < NOW()) as expired,
      COUNT(*) FILTER (WHERE expires_at >= NOW()) as active
    FROM pending_signups
    WHERE is_deleted = FALSE
  `)

  // Get unique domains for filter dropdown
  const domainsResult = await query<{ domain: string }>(`
    SELECT DISTINCT SUBSTRING(email FROM '@(.*)$') as domain
    FROM pending_signups
    WHERE is_deleted = FALSE AND email LIKE '%@%'
    ORDER BY domain
  `)

  // Get domain breakdown with counts
  const domainBreakdownResult = await query<{ domain: string; count: string }>(`
    SELECT
      SUBSTRING(email FROM '@(.*)$') as domain,
      COUNT(*) as count
    FROM pending_signups
    WHERE is_deleted = FALSE
    GROUP BY domain
    ORDER BY count DESC
  `)

  const stats = statsResult.rows[0]

  return {
    pendingSignups,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
    stats: {
      total: parseInt(stats.total, 10),
      expired: parseInt(stats.expired, 10),
      active: parseInt(stats.active, 10),
      domainBreakdown: domainBreakdownResult.rows.map(row => ({
        domain: row.domain,
        count: parseInt(row.count, 10),
      })),
    },
    domains: domainsResult.rows.map(row => row.domain).filter(Boolean),
  }
}

/**
 * Get pending signups statistics with domain breakdown
 */
export async function getPendingSignupsStats(): Promise<PendingSignupsStats> {
  // Get counts
  const countsResult = await query<{
    total: string
    expired: string
    active: string
  }>(`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE expires_at < NOW()) as expired,
      COUNT(*) FILTER (WHERE expires_at >= NOW()) as active
    FROM pending_signups
    WHERE is_deleted = FALSE
  `)

  // Get by domain
  const domainResult = await query<{ domain: string; count: string }>(`
    SELECT
      SUBSTRING(email FROM '@(.*)$') as domain,
      COUNT(*) as count
    FROM pending_signups
    WHERE is_deleted = FALSE
    GROUP BY domain
    ORDER BY count DESC
  `)

  // Get by day (last 30 days)
  const dailyResult = await query<{ date: string; count: string }>(`
    SELECT
      DATE(created_at) as date,
      COUNT(*) as count
    FROM pending_signups
    WHERE is_deleted = FALSE AND created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY date
  `)

  const counts = countsResult.rows[0]

  return {
    total: parseInt(counts.total, 10),
    expired: parseInt(counts.expired, 10),
    active: parseInt(counts.active, 10),
    byDomain: domainResult.rows.map(row => ({
      domain: row.domain,
      count: parseInt(row.count, 10),
    })),
    byDay: dailyResult.rows.map(row => ({
      date: row.date,
      count: parseInt(row.count, 10),
    })),
  }
}

/**
 * Get all pending signups for CSV export
 */
export async function getPendingSignupsForExport(): Promise<PendingSignupItem[]> {
  const result = await query<{
    id: string
    email: string
    first_name: string
    last_name: string | null
    phone_number: string | null
    created_at: Date
    expires_at: Date
    is_expired: boolean
    domain: string
  }>(`
    SELECT
      id, email, first_name, last_name, phone_number, created_at, expires_at,
      SUBSTRING(email FROM '@(.*)$') as domain,
      CASE WHEN expires_at < NOW() THEN TRUE ELSE FALSE END as is_expired
    FROM pending_signups
    WHERE is_deleted = FALSE
    ORDER BY created_at DESC
  `)

  return result.rows.map(row => ({
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phoneNumber: row.phone_number,
    domain: row.domain,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    isExpired: row.is_expired,
  }))
}

/**
 * Delete all expired pending signups (soft delete)
 * Returns the count of deleted records
 */
export async function deleteExpiredPendingSignups(): Promise<number> {
  const result = await query(`
    UPDATE pending_signups
    SET is_deleted = TRUE, deleted_at = NOW()
    WHERE is_deleted = FALSE AND expires_at < NOW()
  `)

  return result.rowCount ?? 0
}

/**
 * Delete a specific pending signup by ID (soft delete)
 */
export async function deletePendingSignupById(id: string): Promise<boolean> {
  const result = await query(`
    UPDATE pending_signups
    SET is_deleted = TRUE, deleted_at = NOW()
    WHERE id = $1 AND is_deleted = FALSE
  `, [id])

  return (result.rowCount ?? 0) > 0
}

/**
 * Get a pending signup by ID
 */
export async function getPendingSignupById(id: string): Promise<PendingSignup | null> {
  const result = await query<{
    id: string
    email: string
    first_name: string
    last_name: string | null
    phone_number: string | null
    token_id: string
    is_deleted: boolean
    deleted_at: Date | null
    created_at: Date
    expires_at: Date
  }>(`
    SELECT * FROM pending_signups
    WHERE id = $1 AND is_deleted = FALSE
  `, [id])

  if (result.rows.length === 0) {
    return null
  }

  const row = result.rows[0]
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phoneNumber: row.phone_number,
    tokenId: row.token_id,
    isDeleted: row.is_deleted,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  }
}

/**
 * Create a new verification token for a pending signup and update expires_at
 * Used to resend verification emails
 */
export async function refreshPendingSignupToken(pendingSignupId: string): Promise<{
  token: string
  email: string
  firstName: string
} | null> {
  // Get the pending signup
  const pendingSignup = await getPendingSignupById(pendingSignupId)
  if (!pendingSignup) {
    return null
  }

  // Invalidate old tokens for this email
  await invalidateUserTokens(pendingSignup.email, 'signup')

  // Create new verification token
  const newToken = await createVerificationToken(pendingSignup.email, 'signup')

  // Update the pending signup with the new token and extended expiry
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + parseInt(process.env.VERIFICATION_TOKEN_EXPIRY_MINUTES || '30'))

  await query(`
    UPDATE pending_signups
    SET token_id = $1, expires_at = $2
    WHERE id = $3
  `, [newToken.id, expiresAt, pendingSignupId])

  return {
    token: newToken.token,
    email: pendingSignup.email,
    firstName: pendingSignup.firstName,
  }
}

/**
 * Bulk send verification emails to multiple pending signups
 * Processes in batches to avoid overwhelming the email service
 */
export async function bulkRefreshAndSendVerification(
  ids: string[],
  lang: 'en' | 'ar'
): Promise<{
  sent: number
  failed: number
  errors: { id: string; email: string; error: string }[]
}> {
  const results: {
    sent: number
    failed: number
    errors: { id: string; email: string; error: string }[]
  } = { sent: 0, failed: 0, errors: [] }

  const BATCH_SIZE = 10
  const DELAY_BETWEEN_BATCHES = 500 // ms

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE)

    await Promise.all(
      batch.map(async (id) => {
        try {
          const tokenInfo = await refreshPendingSignupToken(id)
          if (!tokenInfo) {
            results.failed++
            results.errors.push({ id, email: 'unknown', error: 'Pending signup not found' })
            return
          }

          const sent = await sendVerificationEmail(
            tokenInfo.email,
            tokenInfo.firstName,
            tokenInfo.token,
            lang
          )

          if (sent) {
            results.sent++
          } else {
            results.failed++
            results.errors.push({ id, email: tokenInfo.email, error: 'Failed to send email' })
          }
        } catch (error) {
          results.failed++
          results.errors.push({
            id,
            email: 'unknown',
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      })
    )

    // Rate limiting delay between batches
    if (i + BATCH_SIZE < ids.length) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
    }
  }

  return results
}

/**
 * Get all pending signup IDs matching the given filters
 * Used for bulk operations
 */
export async function getPendingSignupIds(params: {
  domain?: string
  search?: string
}): Promise<string[]> {
  const conditions: string[] = ['is_deleted = FALSE']
  const queryParams: string[] = []
  let paramIndex = 1

  if (params.search) {
    conditions.push(`(
      email ILIKE $${paramIndex} OR
      first_name ILIKE $${paramIndex} OR
      last_name ILIKE $${paramIndex}
    )`)
    queryParams.push(`%${params.search}%`)
    paramIndex++
  }

  if (params.domain) {
    conditions.push(`email ILIKE $${paramIndex}`)
    queryParams.push(`%@${params.domain}`)
    paramIndex++
  }

  const whereClause = conditions.join(' AND ')

  const result = await query<{ id: string }>(
    `SELECT id FROM pending_signups WHERE ${whereClause} ORDER BY created_at DESC`,
    queryParams
  )

  return result.rows.map((row) => row.id)
}
