import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getUserRegistrations } from '@/lib/events'
import type { UserRegistrationsResponse } from '@/lib/types/events'

export async function GET(): Promise<NextResponse<UserRegistrationsResponse>> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Please log in to view your registrations' },
        { status: 401 }
      )
    }

    const registrations = await getUserRegistrations(user.id)

    return NextResponse.json({ success: true, registrations })
  } catch (error) {
    console.error('Get user registrations error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch registrations' },
      { status: 500 }
    )
  }
}
