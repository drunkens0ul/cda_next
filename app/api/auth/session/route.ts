import { NextResponse } from 'next/server'
import {
  getCurrentUser,
  getSessionToken,
  deleteSession,
  clearSessionCookie,
} from '@/lib/auth'
import type { SessionResponse, AuthResponse } from '@/lib/types/auth'

export async function GET(): Promise<NextResponse<SessionResponse>> {
  try {
    const user = await getCurrentUser()
    return NextResponse.json({ user })
  } catch (error) {
    console.error('Get session error:', error)
    return NextResponse.json({ user: null })
  }
}

export async function DELETE(): Promise<NextResponse<AuthResponse>> {
  try {
    const sessionToken = await getSessionToken()

    if (sessionToken) {
      await deleteSession(sessionToken)
      await clearSessionCookie()
    }

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
