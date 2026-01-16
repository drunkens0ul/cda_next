import { NextRequest, NextResponse } from 'next/server'
import {
  getSessionToken,
  getSessionByToken,
  getUserById,
} from '@/lib/auth'
import {
  getEventBySlug,
  getEventRegistrations,
  getRegistrationById,
  updateEmailSentAt
} from '@/lib/events'
import { sendEventRegistrationEmail } from '@/lib/email'
import { formatEventTimeGST, formatDateInGST } from '@/lib/time'
import { logAdminAction } from '@/lib/audit'
import { checkRateLimit, incrementRateLimit } from '@/lib/rate-limit'
import type { RegistrationWithUser } from '@/lib/types/events'

interface RegistrationsResponse {
  success: boolean
  registrations?: RegistrationWithUser[]
  event?: {
    id: string
    title: string
    titleAr: string | null
  }
  message?: string
}

interface SendEmailResponse {
  success: boolean
  message?: string
}

/**
 * GET /api/admin/events/[slug]/registrations
 * Get all registrations for an event
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse<RegistrationsResponse>> {
  try {
    const { slug } = await params

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

    // Find the event by slug
    const event = await getEventBySlug(slug)
    if (!event) {
      return NextResponse.json(
        { success: false, message: 'Event not found' },
        { status: 404 }
      )
    }

    // Get all registrations for this event
    const registrations = await getEventRegistrations(event.id)

    return NextResponse.json({
      success: true,
      registrations,
      event: {
        id: event.id,
        title: event.title,
        titleAr: event.titleAr
      }
    })
  } catch (error) {
    console.error('Get registrations error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to get registrations' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/events/[slug]/registrations
 * Send confirmation email to a registration
 * Body: { registrationId: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse<SendEmailResponse>> {
  try {
    const { slug } = await params

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

    // Find the event by slug
    const event = await getEventBySlug(slug)
    if (!event) {
      return NextResponse.json(
        { success: false, message: 'Event not found' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { registrationId } = body

    if (!registrationId) {
      return NextResponse.json(
        { success: false, message: 'registrationId is required' },
        { status: 400 }
      )
    }

    // Get the registration with user details
    const registration = await getRegistrationById(registrationId)
    if (!registration) {
      return NextResponse.json(
        { success: false, message: 'Registration not found' },
        { status: 404 }
      )
    }

    // Verify registration belongs to this event
    if (registration.eventId !== event.id) {
      return NextResponse.json(
        { success: false, message: 'Registration does not belong to this event' },
        { status: 400 }
      )
    }

    // Check per-recipient rate limit
    const recipientRateLimit = await checkRateLimit(
      `admin_email:${registration.userEmail}`,
      'admin_email_to_recipient'
    )
    if (!recipientRateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many emails sent to this user. Please try again later.' },
        { status: 429 }
      )
    }

    // Format date and time in GST
    const formattedDate = formatDateInGST(event.date, 'en-GB')
    const startTimeGST = formatEventTimeGST(event.date, event.startTime)
    const endTimeGST = event.endTime ? formatEventTimeGST(event.date, event.endTime) : ''
    const formattedTime = endTimeGST ? `${startTimeGST} – ${endTimeGST}` : startTimeGST

    // Send the email
    const emailSent = await sendEventRegistrationEmail(
      registration.userEmail,
      registration.userName.split(' ')[0],
      {
        title: event.title,
        titleAr: event.titleAr ?? undefined,
        date: formattedDate,
        time: formattedTime,
        isVirtual: event.isVirtual,
        location: event.location ?? undefined,
        locationAr: event.locationAr ?? undefined
      }
    )

    if (!emailSent) {
      return NextResponse.json(
        { success: false, message: 'Failed to send email' },
        { status: 500 }
      )
    }

    // Update email sent timestamp
    await updateEmailSentAt(registrationId)

    // Increment rate limit for this recipient
    await incrementRateLimit(`admin_email:${registration.userEmail}`, 'admin_email_to_recipient')

    // Log the admin action
    await logAdminAction(
      { id: currentUser.id, email: currentUser.email },
      'registration.send_confirmation_email',
      'registration',
      {
        targetType: 'user',
        targetId: registration.userId,
        targetIdentifier: registration.userEmail,
        details: {
          registrationId,
          eventTitle: event.title,
          eventSlug: event.slug,
        },
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully'
    })
  } catch (error) {
    console.error('Send email error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to send email' },
      { status: 500 }
    )
  }
}
