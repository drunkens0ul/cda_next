import { NextResponse } from 'next/server'
import {
  getSessionToken,
  getSessionByToken,
  getUserById,
  getPendingSignupsForExport,
} from '@/lib/auth'
import { generateCSV, createCSVResponse, generateExportFilename, formatDateForCSV } from '@/lib/csv'
import { logAdminAction } from '@/lib/audit'
import type { PendingSignupItem } from '@/lib/types/admin'

export async function GET() {
  try {
    // Verify admin access
    const sessionToken = await getSessionToken()
    if (!sessionToken) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const session = await getSessionByToken(sessionToken)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session expired' },
        { status: 401 }
      )
    }

    const currentUser = await getUserById(session.userId)
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get all pending signups for export
    const pendingSignups = await getPendingSignupsForExport()

    // Define CSV columns
    const columns = [
      { key: 'email' as keyof PendingSignupItem, header: 'Email' },
      { key: 'firstName' as keyof PendingSignupItem, header: 'First Name' },
      { key: (ps: PendingSignupItem) => ps.lastName || '', header: 'Last Name' },
      { key: (ps: PendingSignupItem) => ps.phoneNumber || '', header: 'Phone' },
      { key: 'domain' as keyof PendingSignupItem, header: 'Domain' },
      { key: (ps: PendingSignupItem) => formatDateForCSV(ps.createdAt), header: 'Created At' },
      { key: (ps: PendingSignupItem) => formatDateForCSV(ps.expiresAt), header: 'Expires At' },
      { key: (ps: PendingSignupItem) => ps.isExpired ? 'Expired' : 'Active', header: 'Status' },
    ]

    // Generate CSV
    const csv = generateCSV(pendingSignups, columns)

    // Create filename with timestamp
    const filename = generateExportFilename('pending-signups')

    // Log the admin action
    await logAdminAction(
      { id: currentUser.id, email: currentUser.email },
      'export.pending_signups',
      'export',
      {
        targetType: 'export',
        details: {
          exportType: 'pending_signups',
          recordCount: pendingSignups.length,
        },
      }
    )

    // Return CSV response
    return createCSVResponse(csv, filename)
  } catch (error) {
    console.error('Export pending signups error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to export pending signups' },
      { status: 500 }
    )
  }
}
