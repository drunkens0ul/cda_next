import type { UserRole, PaginationInfo } from './auth'

// ============================================================================
// User Export Types
// ============================================================================

export interface UserExportItem {
  id: string
  firstName: string
  lastName: string | null
  email: string
  domain: string
  role: UserRole
  emailVerified: boolean
  createdAt: Date
  lastLoginAt: Date | null
  isRegisteredForEvent: boolean
}

// ============================================================================
// Dashboard Stats Types
// ============================================================================

export interface DomainCount {
  domain: string
  count: number
}

export interface UsersPageStats {
  totalUsers: number
  domainBreakdown: DomainCount[]
}

export interface DailyCount {
  date: string
  count: number
}

export interface UserStats {
  totalRegistered: number      // All users in users table
  totalVerified: number        // Users with email_verified = true (ACTIVE)
  totalUnverified: number      // Users with email_verified = false
  totalPendingSignups: number  // Users in pending_signups table
  expiredPendingSignups: number // Pending signups that have expired
  verifiedByDomain: DomainCount[]
  newVerifiedLast7Days: number
  newVerifiedLast30Days: number
}

export interface EventStatusCount {
  status: string
  count: number
}

export interface EventStats {
  total: number
  byStatus: EventStatusCount[]
}

export interface EventRegistrationCount {
  eventId: string
  eventTitle: string
  count: number
}

export interface RegistrationStats {
  total: number
  byEvent: EventRegistrationCount[]
}

export interface AdminDashboardStats {
  users: UserStats
  events: EventStats
  registrations: RegistrationStats
}

// ============================================================================
// Pending Signups Types
// ============================================================================

export interface PendingSignupItem {
  id: string
  email: string
  firstName: string
  lastName: string | null
  phoneNumber: string | null
  domain: string
  createdAt: Date
  expiresAt: Date
  isExpired: boolean
}

export interface PendingSignupsStats {
  total: number
  expired: number
  active: number
  byDomain: DomainCount[]
  byDay: DailyCount[]
}

export interface GetPendingSignupsParams {
  page?: number
  limit?: number
  search?: string
  domain?: string
}

export interface GetPendingSignupsResult {
  pendingSignups: PendingSignupItem[]
  pagination: PaginationInfo
  stats: {
    total: number
    expired: number
    active: number
    domainBreakdown: DomainCount[]
  }
  domains: string[]
}

// ============================================================================
// Bulk Registration Types
// ============================================================================

export interface UserForBulkRegistration {
  id: string
  email: string
  firstName: string
  lastName: string | null
}

export interface BulkRegistrationResult {
  success: boolean
  registered: number
  emailsSent: number
  failed: {
    userId: string
    email: string
    error: string
  }[]
}

// ============================================================================
// API Response Types
// ============================================================================

export interface AdminStatsResponse {
  success: boolean
  stats?: AdminDashboardStats
  message?: string
}

export interface PendingSignupsResponse {
  success: boolean
  pendingSignups?: PendingSignupItem[]
  pagination?: PaginationInfo
  stats?: {
    total: number
    expired: number
    active: number
    domainBreakdown: DomainCount[]
  }
  domains?: string[]
  message?: string
}

export interface PendingSignupsStatsResponse {
  success: boolean
  stats?: PendingSignupsStats
  message?: string
}

export interface BulkRegistrationResponse {
  success: boolean
  registered?: number
  emailsSent?: number
  failed?: {
    userId: string
    email: string
    error: string
  }[]
  message?: string
}
