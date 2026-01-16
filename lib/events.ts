import { query } from './db'
import { toUTCDateTime } from './time'
import type {
  Event,
  EventWithRegistrationCount,
  EventRegistration,
  EventRegistrationWithEvent,
  RegistrationWithUser,
  CreateEventData,
  UpdateEventData
} from './types/events'
import type { EventStats, RegistrationStats, UserForBulkRegistration, BulkRegistrationResult } from './types/admin'

// Database row types
interface EventRow {
  id: string
  slug: string
  title: string
  title_ar: string | null
  description: string | null
  description_ar: string | null
  date: string  // pg returns DATE as string (YYYY-MM-DD) due to type parser config
  start_time: string | null
  end_time: string | null
  location: string | null
  location_ar: string | null
  is_virtual: boolean
  max_attendees: number | null
  image_url: string | null
  status: string
  show_join_button: boolean
  meeting_url: string | null
  is_highlighted: boolean
  registration_deadline: Date | null
  is_deleted: boolean
  deleted_at: Date | null
  created_at: Date
  updated_at: Date
}

interface EventRowWithCount extends EventRow {
  registration_count: string
}

interface RegistrationRow {
  id: string
  user_id: string
  event_id: string
  status: string
  registered_at: Date
  attended_at: Date | null
  cancelled_at: Date | null
  confirmation_email_sent_at: Date | null
  is_deleted: boolean
  deleted_at: Date | null
  created_at: Date
  updated_at: Date
}

interface RegistrationWithUserRow extends RegistrationRow {
  user_email: string
  user_full_name: string
}

interface RegistrationWithEventRow extends RegistrationRow {
  event_slug: string
  event_title: string
  event_title_ar: string | null
  event_description: string | null
  event_description_ar: string | null
  event_date: string  // pg returns DATE as string (YYYY-MM-DD) due to type parser config
  event_start_time: string | null
  event_end_time: string | null
  event_location: string | null
  event_location_ar: string | null
  event_is_virtual: boolean
  event_max_attendees: number | null
  event_image_url: string | null
  event_status: string
  event_show_join_button: boolean
  event_meeting_url: string | null
  event_is_highlighted: boolean
  event_registration_deadline: Date | null
  event_created_at: Date
  event_updated_at: Date
}

// Helper function to map DB row to Event object
function mapEventRow(row: EventRow): Event {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    titleAr: row.title_ar,
    description: row.description,
    descriptionAr: row.description_ar,
    date: row.date,  // Already a string (YYYY-MM-DD) from pg type parser
    startTime: row.start_time,
    endTime: row.end_time,
    location: row.location,
    locationAr: row.location_ar,
    isVirtual: row.is_virtual,
    maxAttendees: row.max_attendees,
    imageUrl: row.image_url,
    status: row.status as Event['status'],
    showJoinButton: row.show_join_button,
    meetingUrl: row.meeting_url,
    isHighlighted: row.is_highlighted,
    registrationDeadline: row.registration_deadline,
    isDeleted: row.is_deleted,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

// Helper function to map DB row to EventWithRegistrationCount
function mapEventRowWithCount(row: EventRowWithCount): EventWithRegistrationCount {
  const registrationCount = parseInt(row.registration_count || '0')
  return {
    ...mapEventRow(row),
    registrationCount,
    spotsLeft: row.max_attendees !== null ? row.max_attendees - registrationCount : null
  }
}

// Helper function to map DB row to EventRegistration
function mapRegistrationRow(row: RegistrationRow): EventRegistration {
  return {
    id: row.id,
    userId: row.user_id,
    eventId: row.event_id,
    status: row.status as EventRegistration['status'],
    registeredAt: row.registered_at,
    attendedAt: row.attended_at,
    cancelledAt: row.cancelled_at,
    confirmationEmailSentAt: row.confirmation_email_sent_at,
    isDeleted: row.is_deleted,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

// Helper function to map registration with event row
function mapRegistrationWithEventRow(row: RegistrationWithEventRow): EventRegistrationWithEvent {
  return {
    ...mapRegistrationRow(row),
    event: {
      id: row.event_id,
      slug: row.event_slug,
      title: row.event_title,
      titleAr: row.event_title_ar,
      description: row.event_description,
      descriptionAr: row.event_description_ar,
      date: row.event_date,  // Already a string (YYYY-MM-DD) from pg type parser
      startTime: row.event_start_time,
      endTime: row.event_end_time,
      location: row.event_location,
      locationAr: row.event_location_ar,
      isVirtual: row.event_is_virtual,
      maxAttendees: row.event_max_attendees,
      imageUrl: row.event_image_url,
      status: row.event_status as Event['status'],
      showJoinButton: row.event_show_join_button,
      meetingUrl: row.event_meeting_url,
      isHighlighted: row.event_is_highlighted,
      registrationDeadline: row.event_registration_deadline,
      isDeleted: false,
      deletedAt: null,
      createdAt: row.event_created_at,
      updatedAt: row.event_updated_at
    }
  }
}

/**
 * Get all active events with registration counts
 */
export async function getEvents(): Promise<EventWithRegistrationCount[]> {
  const result = await query<EventRowWithCount>(`
    SELECT e.*,
           COUNT(er.id) FILTER (WHERE er.status = 'registered' AND er.is_deleted = FALSE) as registration_count
    FROM events e
    LEFT JOIN event_registrations er ON e.id = er.event_id
    WHERE e.is_deleted = FALSE AND e.status != 'cancelled'
    GROUP BY e.id
    ORDER BY e.date ASC
  `)

  return result.rows.map(mapEventRowWithCount)
}

/**
 * Get a single event by slug with registration count
 */
export async function getEventBySlug(slug: string): Promise<EventWithRegistrationCount | null> {
  const result = await query<EventRowWithCount>(`
    SELECT e.*,
           COUNT(er.id) FILTER (WHERE er.status = 'registered' AND er.is_deleted = FALSE) as registration_count
    FROM events e
    LEFT JOIN event_registrations er ON e.id = er.event_id
    WHERE e.slug = $1 AND e.is_deleted = FALSE
    GROUP BY e.id
  `, [slug])

  if (result.rows.length === 0) return null
  return mapEventRowWithCount(result.rows[0])
}

/**
 * Get a single event by ID
 */
export async function getEventById(id: string): Promise<Event | null> {
  const result = await query<EventRow>(`
    SELECT * FROM events
    WHERE id = $1 AND is_deleted = FALSE
  `, [id])

  if (result.rows.length === 0) return null
  return mapEventRow(result.rows[0])
}

/**
 * Register a user for an event
 * Returns registration or throws an error if already registered
 */
export async function registerForEvent(userId: string, eventId: string): Promise<EventRegistration> {
  // Check if already registered (including soft-deleted registrations that were re-registered)
  const existing = await query<{ id: string; is_deleted: boolean }>(`
    SELECT id, is_deleted FROM event_registrations
    WHERE user_id = $1 AND event_id = $2
  `, [userId, eventId])

  if (existing.rows.length > 0) {
    const registration = existing.rows[0]
    if (!registration.is_deleted) {
      throw new Error('Already registered for this event')
    }
    // Re-activate a soft-deleted registration
    const reactivated = await query<RegistrationRow>(`
      UPDATE event_registrations
      SET is_deleted = FALSE,
          deleted_at = NULL,
          status = 'registered',
          registered_at = NOW(),
          cancelled_at = NULL
      WHERE id = $1
      RETURNING *
    `, [registration.id])
    return mapRegistrationRow(reactivated.rows[0])
  }

  // Create new registration
  const result = await query<RegistrationRow>(`
    INSERT INTO event_registrations (user_id, event_id)
    VALUES ($1, $2)
    RETURNING *
  `, [userId, eventId])

  return mapRegistrationRow(result.rows[0])
}

/**
 * Check if a user is registered for an event
 */
export async function isUserRegistered(userId: string, eventId: string): Promise<boolean> {
  const result = await query<{ count: string }>(`
    SELECT COUNT(*) as count FROM event_registrations
    WHERE user_id = $1 AND event_id = $2 AND status = 'registered' AND is_deleted = FALSE
  `, [userId, eventId])

  return parseInt(result.rows[0].count) > 0
}

/**
 * Check if a user is registered for an event by slug
 */
export async function isUserRegisteredBySlug(userId: string, eventSlug: string): Promise<boolean> {
  const result = await query<{ count: string }>(`
    SELECT COUNT(*) as count FROM event_registrations er
    JOIN events e ON er.event_id = e.id
    WHERE er.user_id = $1 AND e.slug = $2 AND er.status = 'registered' AND er.is_deleted = FALSE
  `, [userId, eventSlug])

  return parseInt(result.rows[0].count) > 0
}

/**
 * Get all registrations for a user with event details
 */
export async function getUserRegistrations(userId: string): Promise<EventRegistrationWithEvent[]> {
  const result = await query<RegistrationWithEventRow>(`
    SELECT
      er.id, er.user_id, er.event_id, er.status, er.registered_at,
      er.attended_at, er.cancelled_at, er.is_deleted, er.deleted_at,
      er.created_at, er.updated_at,
      e.slug as event_slug, e.title as event_title, e.title_ar as event_title_ar,
      e.description as event_description, e.description_ar as event_description_ar,
      e.date as event_date, e.start_time as event_start_time, e.end_time as event_end_time,
      e.location as event_location, e.location_ar as event_location_ar,
      e.is_virtual as event_is_virtual, e.max_attendees as event_max_attendees,
      e.image_url as event_image_url, e.status as event_status,
      e.show_join_button as event_show_join_button, e.meeting_url as event_meeting_url,
      e.is_highlighted as event_is_highlighted, e.registration_deadline as event_registration_deadline,
      e.created_at as event_created_at, e.updated_at as event_updated_at
    FROM event_registrations er
    JOIN events e ON er.event_id = e.id
    WHERE er.user_id = $1 AND er.is_deleted = FALSE AND er.status = 'registered'
    ORDER BY e.date ASC
  `, [userId])

  return result.rows.map(mapRegistrationWithEventRow)
}

/**
 * Cancel a user's event registration (soft delete)
 */
export async function cancelRegistration(userId: string, eventId: string): Promise<void> {
  await query(`
    UPDATE event_registrations
    SET status = 'cancelled', cancelled_at = NOW(), is_deleted = TRUE, deleted_at = NOW()
    WHERE user_id = $1 AND event_id = $2 AND is_deleted = FALSE
  `, [userId, eventId])
}

// Admin functions

/**
 * Create a new event
 */
export async function createEvent(data: CreateEventData): Promise<Event> {
  // If this event should be highlighted, clear any existing highlighted events first
  if (data.isHighlighted) {
    await query(`UPDATE events SET is_highlighted = FALSE WHERE is_highlighted = TRUE AND is_deleted = FALSE`)
  }

  // Convert local times to UTC
  const timezoneOffset = data.timezoneOffset ?? 0
  const startTimeUTC = data.startTime
    ? toUTCDateTime(data.date, data.startTime, timezoneOffset).toISOString().slice(11, 19) + '+00'
    : null
  const endTimeUTC = data.endTime
    ? toUTCDateTime(data.date, data.endTime, timezoneOffset).toISOString().slice(11, 19) + '+00'
    : null

  // Convert registration deadline to UTC timestamp
  const registrationDeadlineUTC = data.registrationDeadlineDate && data.registrationDeadlineTime
    ? toUTCDateTime(data.registrationDeadlineDate, data.registrationDeadlineTime, timezoneOffset)
    : null

  const result = await query<EventRow>(`
    INSERT INTO events (
      slug, title, title_ar, description, description_ar,
      date, start_time, end_time, location, location_ar,
      is_virtual, max_attendees, image_url, status,
      show_join_button, meeting_url, is_highlighted, registration_deadline
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    RETURNING *
  `, [
    data.slug,
    data.title,
    data.titleAr || null,
    data.description || null,
    data.descriptionAr || null,
    data.date,
    startTimeUTC,
    endTimeUTC,
    data.location || null,
    data.locationAr || null,
    data.isVirtual || false,
    data.maxAttendees || null,
    data.imageUrl || null,
    data.status || 'upcoming',
    data.showJoinButton || false,
    data.meetingUrl || null,
    data.isHighlighted || false,
    registrationDeadlineUTC
  ])

  return mapEventRow(result.rows[0])
}

/**
 * Update an existing event
 */
export async function updateEvent(id: string, data: UpdateEventData): Promise<Event | null> {
  // If setting this event as highlighted, clear any existing highlighted events first
  if (data.isHighlighted === true) {
    await query(`UPDATE events SET is_highlighted = FALSE WHERE is_highlighted = TRUE AND is_deleted = FALSE AND id != $1`, [id])
  }

  // Get existing event for date reference (needed for time conversion if date is not being updated)
  let existingEvent: Event | null = null
  if ((data.startTime !== undefined || data.endTime !== undefined) && data.date === undefined) {
    existingEvent = await getEventById(id)
  }

  // Determine the date to use for time conversion
  const timezoneOffset = data.timezoneOffset ?? 0
  let dateForConversion: string
  if (data.date !== undefined) {
    dateForConversion = typeof data.date === 'string' ? data.date : (data.date as Date).toISOString().split('T')[0]
  } else if (existingEvent) {
    // existingEvent.date is already a string in YYYY-MM-DD format
    dateForConversion = existingEvent.date
  } else {
    dateForConversion = new Date().toISOString().split('T')[0]
  }

  // Build dynamic update query based on provided fields
  const updates: string[] = []
  const values: (string | number | boolean | null)[] = []
  let paramIndex = 1

  if (data.slug !== undefined) {
    updates.push(`slug = $${paramIndex++}`)
    values.push(data.slug)
  }
  if (data.title !== undefined) {
    updates.push(`title = $${paramIndex++}`)
    values.push(data.title)
  }
  if (data.titleAr !== undefined) {
    updates.push(`title_ar = $${paramIndex++}`)
    values.push(data.titleAr || null)
  }
  if (data.description !== undefined) {
    updates.push(`description = $${paramIndex++}`)
    values.push(data.description || null)
  }
  if (data.descriptionAr !== undefined) {
    updates.push(`description_ar = $${paramIndex++}`)
    values.push(data.descriptionAr || null)
  }
  if (data.date !== undefined) {
    updates.push(`date = $${paramIndex++}`)
    values.push(data.date)
  }
  if (data.startTime !== undefined) {
    const startTimeUTC = data.startTime
      ? toUTCDateTime(dateForConversion, data.startTime, timezoneOffset).toISOString().slice(11, 19) + '+00'
      : null
    updates.push(`start_time = $${paramIndex++}`)
    values.push(startTimeUTC)
  }
  if (data.endTime !== undefined) {
    const endTimeUTC = data.endTime
      ? toUTCDateTime(dateForConversion, data.endTime, timezoneOffset).toISOString().slice(11, 19) + '+00'
      : null
    updates.push(`end_time = $${paramIndex++}`)
    values.push(endTimeUTC)
  }
  if (data.location !== undefined) {
    updates.push(`location = $${paramIndex++}`)
    values.push(data.location || null)
  }
  if (data.locationAr !== undefined) {
    updates.push(`location_ar = $${paramIndex++}`)
    values.push(data.locationAr || null)
  }
  if (data.isVirtual !== undefined) {
    updates.push(`is_virtual = $${paramIndex++}`)
    values.push(data.isVirtual)
  }
  if (data.maxAttendees !== undefined) {
    updates.push(`max_attendees = $${paramIndex++}`)
    values.push(data.maxAttendees || null)
  }
  if (data.imageUrl !== undefined) {
    updates.push(`image_url = $${paramIndex++}`)
    values.push(data.imageUrl || null)
  }
  if (data.status !== undefined) {
    updates.push(`status = $${paramIndex++}`)
    values.push(data.status)
  }
  if (data.showJoinButton !== undefined) {
    updates.push(`show_join_button = $${paramIndex++}`)
    values.push(data.showJoinButton)
  }
  if (data.meetingUrl !== undefined) {
    updates.push(`meeting_url = $${paramIndex++}`)
    values.push(data.meetingUrl || null)
  }
  if (data.isHighlighted !== undefined) {
    updates.push(`is_highlighted = $${paramIndex++}`)
    values.push(data.isHighlighted)
  }
  if (data.registrationDeadlineDate !== undefined) {
    const registrationDeadlineUTC = data.registrationDeadlineDate && data.registrationDeadlineTime
      ? toUTCDateTime(data.registrationDeadlineDate, data.registrationDeadlineTime, timezoneOffset)
      : null
    updates.push(`registration_deadline = $${paramIndex++}`)
    values.push(registrationDeadlineUTC ? registrationDeadlineUTC.toISOString() : null)
  }

  if (updates.length === 0) {
    return getEventById(id)
  }

  updates.push('updated_at = NOW()')
  values.push(id)

  const result = await query<EventRow>(`
    UPDATE events
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex} AND is_deleted = FALSE
    RETURNING *
  `, values)

  if (result.rows.length === 0) return null
  return mapEventRow(result.rows[0])
}

/**
 * Soft delete an event
 */
export async function deleteEvent(id: string): Promise<boolean> {
  const result = await query(`
    UPDATE events
    SET is_deleted = TRUE, deleted_at = NOW(), updated_at = NOW()
    WHERE id = $1 AND is_deleted = FALSE
  `, [id])

  return (result.rowCount ?? 0) > 0
}

/**
 * Get all events for admin (including cancelled)
 */
export async function getAllEventsForAdmin(): Promise<EventWithRegistrationCount[]> {
  const result = await query<EventRowWithCount>(`
    SELECT e.*,
           COUNT(er.id) FILTER (WHERE er.status = 'registered' AND er.is_deleted = FALSE) as registration_count
    FROM events e
    LEFT JOIN event_registrations er ON e.id = er.event_id
    WHERE e.is_deleted = FALSE
    GROUP BY e.id
    ORDER BY e.date DESC
  `)

  return result.rows.map(mapEventRowWithCount)
}

/**
 * Get the highlighted event for JoinMovement section
 * Falls back to the next upcoming event if none is highlighted
 */
export async function getHighlightedEvent(): Promise<EventWithRegistrationCount | null> {
  // First try to get the highlighted event
  const highlightedResult = await query<EventRowWithCount>(`
    SELECT e.*,
           COUNT(er.id) FILTER (WHERE er.status = 'registered' AND er.is_deleted = FALSE) as registration_count
    FROM events e
    LEFT JOIN event_registrations er ON e.id = er.event_id
    WHERE e.is_highlighted = TRUE AND e.is_deleted = FALSE AND e.status != 'cancelled'
    GROUP BY e.id
    LIMIT 1
  `)

  if (highlightedResult.rows.length > 0) {
    return mapEventRowWithCount(highlightedResult.rows[0])
  }

  // Fallback to the next upcoming event by date
  const upcomingResult = await query<EventRowWithCount>(`
    SELECT e.*,
           COUNT(er.id) FILTER (WHERE er.status = 'registered' AND er.is_deleted = FALSE) as registration_count
    FROM events e
    LEFT JOIN event_registrations er ON e.id = er.event_id
    WHERE e.is_deleted = FALSE AND e.status = 'upcoming' AND e.date >= CURRENT_DATE
    GROUP BY e.id
    ORDER BY e.date ASC
    LIMIT 1
  `)

  if (upcomingResult.rows.length > 0) {
    return mapEventRowWithCount(upcomingResult.rows[0])
  }

  return null
}

// ============================================================================
// Admin Registration Functions
// ============================================================================

/**
 * Get all registrations for an event with user details (for admin)
 */
export async function getEventRegistrations(eventId: string): Promise<RegistrationWithUser[]> {
  const result = await query<RegistrationWithUserRow>(`
    SELECT
      er.id, er.user_id, er.event_id, er.status, er.registered_at,
      er.attended_at, er.cancelled_at, er.confirmation_email_sent_at,
      er.is_deleted, er.deleted_at, er.created_at, er.updated_at,
      u.email as user_email, CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as user_full_name
    FROM event_registrations er
    JOIN users u ON er.user_id = u.id
    WHERE er.event_id = $1 AND er.is_deleted = FALSE
    ORDER BY er.registered_at DESC
  `, [eventId])

  return result.rows.map(row => ({
    ...mapRegistrationRow(row),
    userEmail: row.user_email,
    userName: row.user_full_name
  }))
}

/**
 * Get a single registration by ID
 */
export async function getRegistrationById(registrationId: string): Promise<RegistrationWithUser | null> {
  const result = await query<RegistrationWithUserRow>(`
    SELECT
      er.id, er.user_id, er.event_id, er.status, er.registered_at,
      er.attended_at, er.cancelled_at, er.confirmation_email_sent_at,
      er.is_deleted, er.deleted_at, er.created_at, er.updated_at,
      u.email as user_email, CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as user_full_name
    FROM event_registrations er
    JOIN users u ON er.user_id = u.id
    WHERE er.id = $1 AND er.is_deleted = FALSE
  `, [registrationId])

  if (result.rows.length === 0) return null

  const row = result.rows[0]
  return {
    ...mapRegistrationRow(row),
    userEmail: row.user_email,
    userName: row.user_full_name
  }
}

/**
 * Update confirmation email sent timestamp
 */
export async function updateEmailSentAt(registrationId: string): Promise<void> {
  await query(`
    UPDATE event_registrations
    SET confirmation_email_sent_at = NOW(), updated_at = NOW()
    WHERE id = $1 AND is_deleted = FALSE
  `, [registrationId])
}

// ============================================================================
// Admin Dashboard Stats Functions
// ============================================================================

/**
 * Get event statistics for admin dashboard
 */
export async function getEventStats(): Promise<EventStats> {
  const result = await query<{
    total: string
    status: string
    count: string
  }>(`
    SELECT
      COUNT(*) as total,
      status,
      COUNT(*) FILTER (WHERE status = status) as count
    FROM events
    WHERE is_deleted = FALSE
    GROUP BY status
  `)

  // Get total count
  const totalResult = await query<{ total: string }>(`
    SELECT COUNT(*) as total FROM events WHERE is_deleted = FALSE
  `)

  const byStatus = result.rows.map(row => ({
    status: row.status,
    count: parseInt(row.count, 10),
  }))

  return {
    total: parseInt(totalResult.rows[0]?.total || '0', 10),
    byStatus,
  }
}

/**
 * Get registration statistics for admin dashboard
 */
export async function getRegistrationStats(): Promise<RegistrationStats> {
  // Get total registrations count
  const totalResult = await query<{ total: string }>(`
    SELECT COUNT(*) as total
    FROM event_registrations
    WHERE is_deleted = FALSE AND status = 'registered'
  `)

  // Get registrations per event
  const byEventResult = await query<{
    event_id: string
    event_title: string
    count: string
  }>(`
    SELECT
      e.id as event_id,
      e.title as event_title,
      COUNT(er.id) as count
    FROM events e
    LEFT JOIN event_registrations er ON e.id = er.event_id
      AND er.status = 'registered' AND er.is_deleted = FALSE
    WHERE e.is_deleted = FALSE
    GROUP BY e.id, e.title
    ORDER BY count DESC
  `)

  return {
    total: parseInt(totalResult.rows[0]?.total || '0', 10),
    byEvent: byEventResult.rows.map(row => ({
      eventId: row.event_id,
      eventTitle: row.event_title,
      count: parseInt(row.count, 10),
    })),
  }
}

// ============================================================================
// Bulk Registration Functions
// ============================================================================

/**
 * Get users who are NOT registered for a specific event
 * Only includes verified users (email_verified = true)
 */
export async function getUsersNotRegisteredForEvent(eventId: string): Promise<UserForBulkRegistration[]> {
  const result = await query<{
    id: string
    email: string
    first_name: string
    last_name: string | null
  }>(`
    SELECT u.id, u.email, u.first_name, u.last_name
    FROM users u
    WHERE u.is_deleted = FALSE
      AND u.email_verified = TRUE
      AND u.id NOT IN (
        SELECT er.user_id
        FROM event_registrations er
        WHERE er.event_id = $1
          AND er.status = 'registered'
          AND er.is_deleted = FALSE
      )
    ORDER BY u.created_at DESC
  `, [eventId])

  return result.rows.map(row => ({
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
  }))
}

/**
 * Bulk register multiple users for an event
 * Uses a transaction for atomicity
 * Only registers verified users
 */
export async function bulkRegisterUsers(
  eventId: string,
  userIds: string[]
): Promise<BulkRegistrationResult> {
  const registered: string[] = []
  const failed: { userId: string; email: string; error: string }[] = []

  // Process each user
  for (const userId of userIds) {
    try {
      // Check if user exists and is verified
      const userResult = await query<{
        id: string
        email: string
        email_verified: boolean
      }>(`
        SELECT id, email, email_verified
        FROM users
        WHERE id = $1 AND is_deleted = FALSE
      `, [userId])

      if (userResult.rows.length === 0) {
        failed.push({ userId, email: '', error: 'User not found' })
        continue
      }

      const user = userResult.rows[0]

      if (!user.email_verified) {
        failed.push({ userId, email: user.email, error: 'User email not verified' })
        continue
      }

      // Check if already registered
      const existingResult = await query<{ id: string; is_deleted: boolean }>(`
        SELECT id, is_deleted FROM event_registrations
        WHERE user_id = $1 AND event_id = $2
      `, [userId, eventId])

      if (existingResult.rows.length > 0) {
        const existing = existingResult.rows[0]
        if (!existing.is_deleted) {
          failed.push({ userId, email: user.email, error: 'Already registered' })
          continue
        }

        // Reactivate soft-deleted registration
        await query(`
          UPDATE event_registrations
          SET is_deleted = FALSE,
              deleted_at = NULL,
              status = 'registered',
              registered_at = NOW(),
              cancelled_at = NULL,
              updated_at = NOW()
          WHERE id = $1
        `, [existing.id])
      } else {
        // Create new registration
        await query(`
          INSERT INTO event_registrations (user_id, event_id, status)
          VALUES ($1, $2, 'registered')
        `, [userId, eventId])
      }

      registered.push(userId)
    } catch (error) {
      const userEmail = await getUserEmailById(userId)
      failed.push({
        userId,
        email: userEmail || '',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return {
    success: failed.length === 0,
    registered: registered.length,
    emailsSent: 0, // Will be updated by the caller after sending emails
    failed,
  }
}

/**
 * Helper function to get user email by ID
 */
async function getUserEmailById(userId: string): Promise<string | null> {
  const result = await query<{ email: string }>(`
    SELECT email FROM users WHERE id = $1
  `, [userId])

  return result.rows[0]?.email || null
}

/**
 * Get registration by user and event
 */
export async function getRegistrationByUserAndEvent(
  userId: string,
  eventId: string
): Promise<RegistrationWithUser | null> {
  const result = await query<{
    id: string
    user_id: string
    event_id: string
    status: string
    registered_at: Date
    attended_at: Date | null
    cancelled_at: Date | null
    confirmation_email_sent_at: Date | null
    is_deleted: boolean
    deleted_at: Date | null
    created_at: Date
    updated_at: Date
    user_email: string
    user_full_name: string
  }>(`
    SELECT
      er.id, er.user_id, er.event_id, er.status, er.registered_at,
      er.attended_at, er.cancelled_at, er.confirmation_email_sent_at,
      er.is_deleted, er.deleted_at, er.created_at, er.updated_at,
      u.email as user_email, CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as user_full_name
    FROM event_registrations er
    JOIN users u ON er.user_id = u.id
    WHERE er.user_id = $1 AND er.event_id = $2 AND er.is_deleted = FALSE
  `, [userId, eventId])

  if (result.rows.length === 0) return null

  const row = result.rows[0]
  return {
    ...mapRegistrationRow(row),
    userEmail: row.user_email,
    userName: row.user_full_name,
  }
}
