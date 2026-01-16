import { NextRequest, NextResponse } from 'next/server'
import {
  getSessionToken,
  getSessionByToken,
  getUserById,
  deletePendingSignupById,
  getPendingSignupById,
} from '@/lib/auth'
import { logAdminAction } from '@/lib/audit'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Get pending signup info before deleting (for audit log)
    const pendingSignup = await getPendingSignupById(id)
    if (!pendingSignup) {
      return NextResponse.json(
        { success: false, message: 'Pending signup not found' },
        { status: 404 }
      )
    }

    // Delete the pending signup
    const deleted = await deletePendingSignupById(id)

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Failed to delete pending signup' },
        { status: 500 }
      )
    }

    // Log the admin action
    await logAdminAction(
      { id: currentUser.id, email: currentUser.email },
      'pending_signup.delete',
      'pending_signup',
      {
        targetType: 'pending_signup',
        targetId: id,
        targetIdentifier: pendingSignup.email,
        details: {
          email: pendingSignup.email,
          firstName: pendingSignup.firstName,
        },
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Pending signup deleted successfully',
    })
  } catch (error) {
    console.error('Delete pending signup error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete pending signup' },
      { status: 500 }
    )
  }
}
