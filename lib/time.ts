/**
 * Time zone handling utilities for UTC conversion
 * 
 * All timestamps in the database are stored in UTC.
 * Frontend displays times in user's local timezone.
 * 
 * Timezone offset format:
 * - Provided in minutes from UTC
 * - Example: EST (UTC-5) = 300 minutes
 * - Example: Dubai (UTC+4) = -240 minutes
 * - Use new Date().getTimezoneOffset() to get this value
 */

/**
 * Convert local date and time to UTC timestamp
 * 
 * @param dateStr - Date string in format "YYYY-MM-DD" (local to user)
 * @param timeStr - Time string in format "HH:MM" (local to user)
 * @param timezoneOffset - Offset in minutes from UTC (from getTimezoneOffset())
 * @returns Date object in UTC
 */
export function toUTCDateTime(dateStr: string, timeStr: string | null, timezoneOffset: number): Date {
  const [hours, minutes] = timeStr ? timeStr.split(':').map(Number) : [0, 0]
  const [year, month, day] = dateStr.split('-').map(Number)

  // Use Date.UTC to interpret time components without server timezone interference
  // Then adjust by the user's timezone offset to get actual UTC
  // getTimezoneOffset() returns minutes to ADD to local to get UTC
  // So we ADD the offset to convert from "local time as UTC" to actual UTC
  const utcTimestamp = Date.UTC(year, month - 1, day, hours, minutes, 0, 0)
  return new Date(utcTimestamp + (timezoneOffset * 60 * 1000))
}

/**
 * Convert UTC date to local time string for form inputs
 * 
 * @param utcDate - Date object or date string in UTC
 * @param timezoneOffset - Offset in minutes from UTC (from getTimezoneOffset())
 * @returns Time string in format "HH:MM" in local timezone
 */
export function toLocalTimeString(utcDate: Date | string, timezoneOffset: number): string {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate
  // getTimezoneOffset() returns negative for timezones ahead of UTC (e.g., -240 for UTC+4)
  // To convert UTC to local: subtract the offset (subtracting negative = adding)
  const localTimestamp = date.getTime() - (timezoneOffset * 60 * 1000)
  const localDate = new Date(localTimestamp)

  const hours = String(localDate.getUTCHours()).padStart(2, '0')
  const minutes = String(localDate.getUTCMinutes()).padStart(2, '0')

  return `${hours}:${minutes}`
}

/**
 * Convert UTC date to local date string for form inputs
 * 
 * @param utcDate - Date object or date string in UTC
 * @param timezoneOffset - Offset in minutes from UTC (from getTimezoneOffset())
 * @returns Date string in format "YYYY-MM-DD" in local timezone
 */
export function toLocalDateString(utcDate: Date | string, timezoneOffset: number): string {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate
  // getTimezoneOffset() returns negative for timezones ahead of UTC (e.g., -240 for UTC+4)
  // To convert UTC to local: subtract the offset (subtracting negative = adding)
  const localTimestamp = date.getTime() - (timezoneOffset * 60 * 1000)
  const localDate = new Date(localTimestamp)

  const year = localDate.getUTCFullYear()
  const month = String(localDate.getUTCMonth() + 1).padStart(2, '0')
  const day = String(localDate.getUTCDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * Format datetime for display in user's local timezone
 * 
 * @param utcDate - Date object or string in UTC
 * @param locale - Locale string (e.g., 'en-US', 'ar-AE')
 * @param options - Optional Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDateTimeDisplay(
  utcDate: Date | string,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = new Date(utcDate)
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  }

  return date.toLocaleDateString(locale, defaultOptions)
}

/**
 * Format time for display in user's local timezone
 * 
 * @param utcDate - Date object or string in UTC
 * @param locale - Locale string (e.g., 'en-US', 'ar-AE')
 * @returns Formatted time string
 */
export function formatTimeDisplay(
  utcDate: Date | string,
  locale: string
): string {
  const date = new Date(utcDate)

  return date.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Combine UTC date and time strings into a single Date object
 * 
 * @param dateStr - Date string in format "YYYY-MM-DD" or Date object (from database DATE type)
 * @param timeStr - Time string in format "HH:MM:SS+TZ" (TIME WITH TIME ZONE) or "HH:MM:SS" (old TIME format)
 * @returns Date object (interpreted as UTC)
 */
export function combineDateAndTime(dateStr: string | Date, timeStr: string | null): Date {
  // Handle both Date objects and string inputs
  // If string, it might be a full ISO string "2026-01-16T00:00:00.000Z" or date-only "2026-01-16"
  let dateInput: string
  if (typeof dateStr === 'string') {
    // Extract just the date portion if it's a full ISO string
    dateInput = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr
  } else {
    dateInput = dateStr.toISOString().split('T')[0]
  }
  
  if (!timeStr) {
    return new Date(dateInput + 'T00:00:00Z')
  }

  let timeWithoutZone = timeStr
  let offsetHours = 0, offsetMinutes = 0
  
  const tzMatch = timeStr.match(/([+-])(\d{2}):?(\d{2})$/)
  if (tzMatch) {
    timeWithoutZone = timeStr.slice(0, tzMatch.index)
    const sign = tzMatch[1] === '+' ? 1 : -1
    offsetHours = parseInt(tzMatch[2]) * sign
    offsetMinutes = parseInt(tzMatch[3]) * sign
  }
  
  const [hours, minutes] = timeWithoutZone.split(':').slice(0, 2).map(Number)
  const date = new Date(dateInput + 'T00:00:00Z')
  date.setUTCHours(hours - offsetHours, minutes - offsetMinutes, 0, 0)

  return date
}

/**
 * Get the current timezone offset in minutes
 * 
 * @returns Offset in minutes from UTC (e.g., 300 for EST UTC-5)
 */
export function getCurrentTimezoneOffset(): number {
  return new Date().getTimezoneOffset()
}

/**
 * Format a Date object as ISO string (UTC)
 * 
 * @param date - Date object
 * @returns ISO string in UTC
 */
export function toISOStringUTC(date: Date): string {
  return date.toISOString()
}

/**
 * Check if a date/time is in the past
 * 
 * @param utcDate - Date object or string in UTC
 * @returns true if date is in the past
 */
export function isPast(utcDate: Date | string): boolean {
  return new Date(utcDate) < new Date()
}

/**
 * Check if a date/time is in the future
 * 
 * @param utcDate - Date object or string in UTC
 * @returns true if date is in the future
 */
export function isFuture(utcDate: Date | string): boolean {
  return new Date(utcDate) > new Date()
}

/**
 * Calculate the difference in milliseconds between two dates
 * 
 * @param date1 - First date (UTC)
 * @param date2 - Second date (UTC)
 * @returns Difference in milliseconds
 */
export function dateDifference(date1: Date | string, date2: Date | string): number {
  return new Date(date1).getTime() - new Date(date2).getTime()
}

/**
 * Format a countdown timer (days, hours, minutes, seconds)
 * 
 * @param milliseconds - Time difference in milliseconds
 * @returns Object with days, hours, minutes, seconds
 */
export function formatCountdown(milliseconds: number): {
  days: number
  hours: number
  minutes: number
  seconds: number
} {
  const absMs = Math.abs(milliseconds)
  const days = Math.floor(absMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((absMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((absMs % (1000 * 60)) / 1000)

  return { days, hours, minutes, seconds }
}

/**
 * Format event time for display (handles timezone-aware times from database)
 * 
 * @param date - Event date (Date object or string)
 * @param timeStr - Event time string from database (TIME WITH TIME ZONE format)
 * @param locale - Locale string (e.g., 'en-US', 'ar-AE')
 * @returns Formatted time string for display
 */
export function formatEventTime(
  date: Date | string,
  timeStr: string | null,
  locale: string
): string {
  if (!timeStr) return ''
  
  const eventDate = combineDateAndTime(date, timeStr)
  return formatTimeDisplay(eventDate, locale)
}

/**
 * Calculate days remaining until an event
 * 
 * @param date - Event date (Date object or string)
 * @param timeStr - Event time string from database (TIME WITH TIME ZONE format)
 * @returns Number of days remaining (0 if event has passed)
 */
export function getDaysUntilEvent(date: Date | string, timeStr: string | null): number {
  const fullEventDate = timeStr ? combineDateAndTime(date, timeStr) : new Date(date)
  const now = new Date()
  now.setUTCHours(0, 0, 0, 0)
  const eventUtc = new Date(fullEventDate)
  eventUtc.setUTCHours(0, 0, 0, 0)
  const diffTime = eventUtc.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
}

// ============================================================================
// GST (Gulf Standard Time) Utilities
// GST is UTC+4, offset in minutes = -240
// All times should be displayed in GST for consistency across the application
// ============================================================================

/**
 * GST timezone offset in minutes (same format as getTimezoneOffset())
 * GST is UTC+4, which means offset is -240 minutes
 */
export const GST_OFFSET = -240

/**
 * Get GST timezone offset (for admin forms and other timezone-aware operations)
 *
 * @returns GST offset in minutes (-240)
 */
export function getGSTOffset(): number {
  return GST_OFFSET
}

/**
 * Format a UTC date/time to GST timezone for display
 *
 * @param utcDate - Date object or ISO string in UTC
 * @returns Formatted time string in GST (e.g., "2:00 PM")
 */
export function formatTimeInGST(utcDate: Date | string): string {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate

  // Convert UTC to GST (UTC+4): add 4 hours
  const gstDate = new Date(date.getTime() + (4 * 60 * 60 * 1000))

  const hours = gstDate.getUTCHours()
  const minutes = gstDate.getUTCMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12

  return `${hour12}:${String(minutes).padStart(2, '0')} ${ampm}`
}

/**
 * Format event time from database to GST
 * This is the main function to use for displaying event times on frontend
 *
 * @param date - Event date (Date object or string)
 * @param timeStr - Event time string from database (TIME WITH TIME ZONE format)
 * @returns Formatted time string in GST (e.g., "2:00 PM")
 */
export function formatEventTimeGST(date: Date | string, timeStr: string | null): string {
  if (!timeStr) return ''
  const eventDate = combineDateAndTime(date, timeStr)
  return formatTimeInGST(eventDate)
}

/**
 * Format date for display in GST timezone
 *
 * @param utcDate - Date object or ISO string in UTC
 * @param locale - Locale string (e.g., 'en-US', 'ar-AE')
 * @returns Formatted date string in GST timezone
 */
export function formatDateInGST(
  utcDate: Date | string,
  locale: string
): string {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate

  // Convert UTC to GST (UTC+4): add 4 hours
  const gstDate = new Date(date.getTime() + (4 * 60 * 60 * 1000))

  // Format using Intl with UTC to avoid any browser timezone conversion
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(gstDate)
}
