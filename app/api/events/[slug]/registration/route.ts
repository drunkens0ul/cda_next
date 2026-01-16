import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getEventBySlug, isUserRegistered } from '@/lib/events'
import type { RegistrationCheckResponse } from '@/lib/types/events'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse<RegistrationCheckResponse>> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({
        success: true,
        isRegistered: false,
        isAuthenticated: false
      })
    }

    const { slug } = await params
    const event = await getEventBySlug(slug)

    if (!event) {
      return NextResponse.json(
        { success: false, isRegistered: false, isAuthenticated: true, message: 'Event not found' },
        { status: 404 }
      )
    }

    const isRegistered = await isUserRegistered(user.id, event.id)

    return NextResponse.json({
      success: true,
      isRegistered,
      isAuthenticated: true
    })
  } catch (error) {
    console.error('Check registration error:', error)
    return NextResponse.json(
      { success: false, isRegistered: false, isAuthenticated: false, message: 'Failed to check registration' },
      { status: 500 }
    )
  }
}
