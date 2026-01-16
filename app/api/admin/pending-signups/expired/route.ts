import { NextResponse } from 'next/server'
import {
  getSessionToken,
  getSessionByToken,
  getUserById,
  deleteExpiredPendingSignups,
} from '@/lib/auth'
import { logAdminAction } from '@/lib/audit'

export async function DELETE() {
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

    // Delete all expired pending signups
    const deletedCount = await deleteExpiredPendingSignups()

    // Log the admin action
    await logAdminAction(
      { id: currentUser.id, email: currentUser.email },
      'pending_signup.delete_expired',
      'pending_signup',
      {
        targetType: 'bulk',
        details: {
          deletedCount,
        },
      }
    )

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedCount} expired pending signup(s)`,
      deletedCount,
    })
  } catch (error) {
    console.error('Delete expired pending signups error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete expired pending signups' },
      { status: 500 }
    )
  }
}
