import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, getUserById } from '@/lib/auth'
import { getEventBySlug, registerForEvent, updateEmailSentAt } from '@/lib/events'
import { sendEventRegistrationEmail } from '@/lib/email'
import { formatEventTimeGST, formatDateInGST } from '@/lib/time'
import type { RegistrationResponse } from '@/lib/types/events'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse<RegistrationResponse>> {
  try {
    // Check authentication
    const authUser = await getCurrentUser()
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Please log in to register for this event' },
        { status: 401 }
      )
    }

    // Verify user's email is verified (defensive check)
    const user = await getUserById(authUser.id)
    if (!user || !user.emailVerified) {
      return NextResponse.json(
        { success: false, message: 'Please verify your email before registering for events' },
        { status: 403 }
      )
    }

    const { slug } = await params
    const event = await getEventBySlug(slug)

    if (!event) {
      return NextResponse.json(
        { success: false, message: 'Event not found' },
        { status: 404 }
      )
    }

    // Check if event is still accepting registrations
    if (event.status !== 'upcoming') {
      return NextResponse.json(
        { success: false, message: 'This event is not accepting registrations' },
        { status: 400 }
      )
    }

    // Check capacity
    if (event.maxAttendees && event.spotsLeft !== null && event.spotsLeft <= 0) {
      return NextResponse.json(
        { success: false, message: 'This event is full' },
        { status: 400 }
      )
    }

    // Check registration deadline
    if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
      return NextResponse.json(
        { success: false, message: 'Registration deadline has passed' },
        { status: 400 }
      )
    }

    const registration = await registerForEvent(user.id, event.id)

    // Send confirmation email and track when sent
    try {
      // Format date in GST as "21 January 2026"
      const formattedDate = formatDateInGST(event.date, 'en-GB')

      // Format time in GST as "10:00 AM – 11:00 AM"
      const startTimeGST = formatEventTimeGST(event.date, event.startTime)
      const endTimeGST = event.endTime ? formatEventTimeGST(event.date, event.endTime) : ''
      const formattedTime = endTimeGST ? `${startTimeGST} – ${endTimeGST}` : startTimeGST

      const emailSent = await sendEventRegistrationEmail(user.email, authUser.fullName.split(' ')[0], {
        title: event.title,
        titleAr: event.titleAr ?? undefined,
        date: formattedDate,
        time: formattedTime,
        isVirtual: event.isVirtual,
        location: event.location ?? undefined,
        locationAr: event.locationAr ?? undefined
      })

      // Track email sent timestamp
      if (emailSent) {
        await updateEmailSentAt(registration.id)
      }
    } catch (emailError) {
      console.error('Error sending registration email:', emailError)
      // Don't fail registration if email fails
    }

    return NextResponse.json({ success: true, registration })
  } catch (error) {
    if (error instanceof Error && error.message === 'Already registered for this event') {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 409 }
      )
    }
    console.error('Register for event error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to register for event' },
      { status: 500 }
    )
  }
}
