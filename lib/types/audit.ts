// ============================================================================
// Audit Log Types
// ============================================================================

export type AuditCategory =
  | 'user'
  | 'event'
  | 'registration'
  | 'pending_signup'
  | 'export'
  | 'quiz'

export type AuditAction =
  // User actions
  | 'user.role_change'
  // Event actions
  | 'event.create'
  | 'event.update'
  | 'event.delete'
  // Registration actions
  | 'registration.bulk_register'
  | 'registration.send_confirmation_email'
  // Pending signup actions
  | 'pending_signup.delete'
  | 'pending_signup.delete_expired'
  | 'pending_signup.send_verification'
  | 'pending_signup.bulk_send_verification'
  // Export actions
  | 'export.users'
  | 'export.pending_signups'
  // Quiz actions
  | 'quiz.create'
  | 'quiz.update'
  | 'quiz.delete'

export type AuditStatus = 'success' | 'failure'

export type AuditTargetType =
  | 'user'
  | 'event'
  | 'pending_signup'
  | 'export'
  | 'bulk'
  | 'quiz'

export interface AuditLogEntry {
  id: string
  adminId: string
  adminEmail: string
  action: AuditAction
  category: AuditCategory
  targetType: AuditTargetType | null
  targetId: string | null
  targetIdentifier: string | null
  details: Record<string, unknown> | null
  ipAddress: string | null
  userAgent: string | null
  status: AuditStatus
  errorMessage: string | null
  createdAt: Date
}

// Input type for creating audit logs
export interface CreateAuditLogInput {
  adminId: string
  adminEmail: string
  action: AuditAction
  category: AuditCategory
  targetType?: AuditTargetType
  targetId?: string
  targetIdentifier?: string
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  status?: AuditStatus
  errorMessage?: string
}

// Query parameters for fetching audit logs
export interface GetAuditLogsParams {
  page?: number
  limit?: number
  category?: AuditCategory
  action?: AuditAction
  adminId?: string
  targetType?: AuditTargetType
  targetId?: string
  status?: AuditStatus
  startDate?: Date
  endDate?: Date
  search?: string
}

export interface GetAuditLogsResult {
  logs: AuditLogEntry[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// Helper types for specific action details
export interface UserRoleChangeDetails {
  previousRole: 'user' | 'admin'
  newRole: 'user' | 'admin'
  targetUserEmail: string
}

export interface EventCreateDetails {
  eventTitle: string
  eventSlug: string
}

export interface EventUpdateDetails {
  eventTitle: string
  eventSlug: string
  changedFields: string[]
  previousValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
}

export interface EventDeleteDetails {
  eventTitle: string
  eventSlug: string
  registrationCount?: number
}

export interface BulkRegistrationDetails {
  eventTitle: string
  eventSlug: string
  totalAttempted: number
  registered: number
  failed: number
  emailsSent: number
}

export interface PendingSignupDeleteDetails {
  email: string
  firstName?: string
}

export interface BulkDeleteExpiredDetails {
  deletedCount: number
}

export interface SendVerificationDetails {
  email: string
  firstName?: string
}

export interface BulkSendVerificationDetails {
  totalAttempted: number
  sent: number
  failed: number
}

export interface ExportDetails {
  exportType: 'users' | 'pending_signups'
  recordCount: number
  filters?: Record<string, string>
}

export interface QuizCreateDetails {
  quizTitle: string
  quizSlug: string
  questionCount: number
}

export interface QuizUpdateDetails {
  quizTitle: string
  quizSlug: string
  changedFields: string[]
}

export interface QuizDeleteDetails {
  quizTitle: string
  quizSlug: string
  submissionCount?: number
}

