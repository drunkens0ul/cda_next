export type UserRole = 'user' | 'admin'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string | null
  phoneNumber: string | null
  emailVerified: boolean
  role: UserRole
  isDeleted: boolean
  deletedAt: Date | null
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface Session {
  id: string
  userId: string
  sessionToken: string
  expiresAt: Date
  ipAddress: string | null
  userAgent: string | null
  isDeleted: boolean
  deletedAt: Date | null
  createdAt: Date
  lastActiveAt: Date
}

export interface VerificationToken {
  id: string
  userId: string | null
  email: string
  token: string
  tokenType: 'signup' | 'login'
  expiresAt: Date
  usedAt: Date | null
  isDeleted: boolean
  deletedAt: Date | null
  createdAt: Date
}

export interface PendingSignup {
  id: string
  email: string
  firstName: string
  lastName: string | null
  phoneNumber: string | null
  tokenId: string
  isDeleted: boolean
  deletedAt: Date | null
  createdAt: Date
  expiresAt: Date
}

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string | null
  fullName: string
  initials: string
  role: UserRole
}

export interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
  updateProfile: (firstName: string, lastName: string) => Promise<boolean>
}

export interface SignupRequest {
  email: string
  firstName: string
  lastName?: string
  phoneNumber?: string
  recaptchaToken: string
}

export interface LoginRequest {
  email: string
  recaptchaToken: string
}

export interface ResendRequest {
  email: string
  type: 'signup' | 'login'
}

export interface AuthResponse {
  success: boolean
  message: string
  error?: string
}

export interface SessionResponse {
  user: AuthUser | null
}

export interface ProfileUpdateRequest {
  firstName: string
  lastName?: string
}

export interface NewsletterSubscribeRequest {
  email: string
}

// Admin types
export interface AdminUserListItem {
  id: string
  email: string
  firstName: string
  lastName: string | null
  role: UserRole
  lastLoginAt: Date | null
  createdAt: Date
}

export interface GetUsersParams {
  page?: number
  limit?: number
  search?: string
  emailDomain?: string
}

export interface PaginationInfo {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface GetUsersResult {
  users: AdminUserListItem[]
  pagination: PaginationInfo
  domains: string[]
}
