import { NextRequest, NextResponse } from 'next/server'
import {
  getSessionToken,
  getSessionByToken,
  getUserById,
  getUsersForExport,
} from '@/lib/auth'
import { generateCSV, createCSVResponse, generateExportFilename, formatDateForCSV } from '@/lib/csv'
import { logAdminAction } from '@/lib/audit'
import type { UserExportItem } from '@/lib/types/admin'

export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const eventId = searchParams.get('eventId') || undefined

    // Get users for export (only verified users)
    const users = await getUsersForExport(eventId)

    // Define CSV columns
    const columns = [
      { key: (user: UserExportItem) => `${user.firstName} ${user.lastName || ''}`.trim(), header: 'Name' },
      { key: 'email' as keyof UserExportItem, header: 'Email' },
      { key: 'domain' as keyof UserExportItem, header: 'Domain' },
      { key: 'role' as keyof UserExportItem, header: 'Role' },
      { key: (user: UserExportItem) => formatDateForCSV(user.createdAt), header: 'Created At' },
      { key: (user: UserExportItem) => formatDateForCSV(user.lastLoginAt), header: 'Last Login' },
      { key: (user: UserExportItem) => user.isRegisteredForEvent ? 'Yes' : 'No', header: eventId ? 'Registered for Event' : 'Registered for Any Event' },
    ]

    // Generate CSV
    const csv = generateCSV(users, columns)

    // Create filename with timestamp
    const filename = generateExportFilename(eventId ? 'users-event-registration' : 'users')

    // Log the admin action
    await logAdminAction(
      { id: currentUser.id, email: currentUser.email },
      'export.users',
      'export',
      {
        targetType: 'export',
        details: {
          exportType: 'users',
          recordCount: users.length,
          filters: eventId ? { eventId } : undefined,
        },
      }
    )

    // Return CSV response
    return createCSVResponse(csv, filename)
  } catch (error) {
    console.error('Export users error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to export users' },
      { status: 500 }
    )
  }
}
