import { NextRequest, NextResponse } from 'next/server'
import {
  getSessionToken,
  getSessionByToken,
  getUserById,
  updateUserProfile,
  getFullName,
  getUserInitials,
} from '@/lib/auth'
import type { ProfileUpdateRequest, AuthResponse, AuthUser } from '@/lib/types/auth'

export async function PATCH(request: NextRequest): Promise<NextResponse<AuthResponse & { user?: AuthUser }>> {
  try {
    // Get session
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

    // Get current user
    const currentUser = await getUserById(session.userId)
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Parse request body
    const body: ProfileUpdateRequest = await request.json()
    const { firstName, lastName } = body

    // Validate input
    if (!firstName || firstName.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: 'First name is required and must be at least 2 characters' },
        { status: 400 }
      )
    }

    // Input length validation
    if (firstName.trim().length > 100) {
      return NextResponse.json(
        { success: false, message: 'First name is too long (max 100 characters)' },
        { status: 400 }
      )
    }

    if (lastName && lastName.trim().length > 100) {
      return NextResponse.json(
        { success: false, message: 'Last name is too long (max 100 characters)' },
        { status: 400 }
      )
    }

    // Update profile
    const updatedUser = await updateUserProfile(
      session.userId,
      firstName.trim(),
      lastName?.trim()
    )

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: 'Failed to update profile' },
        { status: 500 }
      )
    }

    // Return updated user data
    const authUser: AuthUser = {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      fullName: getFullName(updatedUser.firstName, updatedUser.lastName),
      initials: getUserInitials(updatedUser.firstName, updatedUser.lastName),
      role: updatedUser.role,
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: authUser,
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
