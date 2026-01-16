export interface Event {
  id: string
  slug: string
  title: string
  titleAr: string | null
  description: string | null
  descriptionAr: string | null
  date: string  // YYYY-MM-DD format string (no timezone issues)
  startTime: string | null
  endTime: string | null
  location: string | null
  locationAr: string | null
  isVirtual: boolean
  maxAttendees: number | null
  imageUrl: string | null
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  showJoinButton: boolean
  meetingUrl: string | null
  isHighlighted: boolean
  registrationDeadline: Date | null
  isDeleted: boolean
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface EventWithRegistrationCount extends Event {
  registrationCount: number
  spotsLeft: number | null
}

export interface EventRegistration {
  id: string
  userId: string
  eventId: string
  status: 'registered' | 'attended' | 'no_show' | 'cancelled'
  registeredAt: Date
  attendedAt: Date | null
  cancelledAt: Date | null
  confirmationEmailSentAt: Date | null
  isDeleted: boolean
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

// Admin registration view with user details
export interface RegistrationWithUser extends EventRegistration {
  userEmail: string
  userName: string
}

export interface EventRegistrationWithEvent extends EventRegistration {
  event: Event
}

// API Response types
export interface EventsResponse {
  success: boolean
  events?: EventWithRegistrationCount[]
  message?: string
}

export interface EventResponse {
  success: boolean
  event?: EventWithRegistrationCount
  message?: string
}

export interface RegistrationResponse {
  success: boolean
  registration?: EventRegistration
  message?: string
}

export interface RegistrationCheckResponse {
  success: boolean
  isRegistered: boolean
  isAuthenticated: boolean
  message?: string
}

export interface UserRegistrationsResponse {
  success: boolean
  registrations?: EventRegistrationWithEvent[]
  message?: string
}

// Admin types for event CRUD
export interface CreateEventData {
  slug: string
  title: string
  titleAr?: string
  description?: string
  descriptionAr?: string
  date: string // ISO date string
  startTime?: string
  endTime?: string
  location?: string
  locationAr?: string
  isVirtual?: boolean
  maxAttendees?: number
  imageUrl?: string
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  showJoinButton?: boolean
  meetingUrl?: string
  isHighlighted?: boolean
  registrationDeadlineDate?: string // YYYY-MM-DD
  registrationDeadlineTime?: string // HH:MM
  timezoneOffset?: number // Offset in minutes from UTC (e.g., 300 for EST)
}

export interface UpdateEventData {
  slug?: string
  title?: string
  titleAr?: string
  description?: string
  descriptionAr?: string
  date?: string // ISO date string
  startTime?: string
  endTime?: string
  location?: string
  locationAr?: string
  isVirtual?: boolean
  maxAttendees?: number
  imageUrl?: string
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  showJoinButton?: boolean
  meetingUrl?: string
  isHighlighted?: boolean
  registrationDeadlineDate?: string // YYYY-MM-DD
  registrationDeadlineTime?: string // HH:MM
  timezoneOffset?: number // Offset in minutes from UTC (e.g., 300 for EST)
}
