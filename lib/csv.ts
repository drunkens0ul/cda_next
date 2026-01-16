/**
 * CSV Generation Utilities
 *
 * Provides functions to generate CSV strings from data arrays
 * and create proper HTTP responses for file downloads.
 */

export interface CSVColumn<T> {
  key: keyof T | ((item: T) => string | number | boolean | null | undefined)
  header: string
}

/**
 * Escape a value for CSV format
 * - Wraps in quotes if contains comma, quote, or newline
 * - Doubles any existing quotes
 */
function escapeCSVValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return ''
  }

  const stringValue = String(value)

  // Check if we need to escape
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    // Escape quotes by doubling them and wrap in quotes
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

/**
 * Format a date value for CSV export
 */
export function formatDateForCSV(date: Date | string | null | undefined): string {
  if (!date) return ''

  const d = typeof date === 'string' ? new Date(date) : date

  // Format as YYYY-MM-DD HH:mm:ss
  return d.toISOString().replace('T', ' ').substring(0, 19)
}

/**
 * Generate a CSV string from an array of data objects
 *
 * @param data Array of objects to convert to CSV
 * @param columns Column definitions with keys and headers
 * @returns CSV string with headers and data rows
 */
export function generateCSV<T>(
  data: T[],
  columns: CSVColumn<T>[]
): string {
  // Generate header row
  const headers = columns.map(col => escapeCSVValue(col.header)).join(',')

  // Generate data rows
  const rows = data.map(item => {
    return columns.map(col => {
      let value: string | number | boolean | null | undefined

      if (typeof col.key === 'function') {
        value = col.key(item)
      } else {
        value = item[col.key] as string | number | boolean | null | undefined
      }

      return escapeCSVValue(value)
    }).join(',')
  })

  // Combine headers and rows
  return [headers, ...rows].join('\r\n')
}

/**
 * Create an HTTP Response object for CSV file download
 *
 * @param csv CSV string content
 * @param filename Name for the downloaded file (without .csv extension)
 * @returns Response object with proper headers for file download
 */
export function createCSVResponse(csv: string, filename: string): Response {
  // Add BOM for Excel UTF-8 compatibility
  const bom = '\uFEFF'
  const csvWithBom = bom + csv

  return new Response(csvWithBom, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.csv"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  })
}

/**
 * Generate a timestamped filename for exports
 *
 * @param prefix Base name for the file (e.g., 'users', 'pending-signups')
 * @returns Filename with timestamp (e.g., 'users-2024-01-15-143052')
 */
export function generateExportFilename(prefix: string): string {
  const now = new Date()
  const timestamp = now.toISOString()
    .replace(/[T:]/g, '-')
    .replace(/\..+/, '')

  return `${prefix}-${timestamp}`
}
