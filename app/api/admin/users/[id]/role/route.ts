import { NextRequest, NextResponse } from 'next/server'
import {
  getSessionToken,
  getSessionByToken,
  getUserById,
  updateUserRole,
} from '@/lib/auth'
import { logAdminAction } from '@/lib/audit'
import type { UserRole } from '@/lib/types/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    // Prevent self-demotion
    if (id === currentUser.id) {
      return NextResponse.json(
        { success: false, message: 'Cannot change your own role' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { role } = body as { role: UserRole }

    if (!role || !['user', 'admin'].includes(role)) {
      return NextResponse.json(
        { success: false, message: 'Invalid role' },
        { status: 400 }
      )
    }

    // Get the target user's current info before updating
    const targetUser = await getUserById(id)
    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    const previousRole = targetUser.role

    // Update the role
    const success = await updateUserRole(id, role)

    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Failed to update role' },
        { status: 500 }
      )
    }

    // Log the admin action
    await logAdminAction(
      { id: currentUser.id, email: currentUser.email },
      'user.role_change',
      'user',
      {
        targetType: 'user',
        targetId: id,
        targetIdentifier: targetUser.email,
        details: {
          previousRole,
          newRole: role,
          targetUserEmail: targetUser.email,
          targetUserName: `${targetUser.firstName} ${targetUser.lastName || ''}`.trim(),
        },
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Role updated successfully',
    })
  } catch (error) {
    console.error('Update role error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update role' },
      { status: 500 }
    )
  }
}
