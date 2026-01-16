import { NextRequest, NextResponse } from 'next/server'
import {
  getSessionToken,
  getSessionByToken,
  getUserById,
} from '@/lib/auth'
import {
  getEventBySlug,
  getUsersNotRegisteredForEvent,
  bulkRegisterUsers,
  getRegistrationByUserAndEvent,
  updateEmailSentAt,
} from '@/lib/events'
import { sendEventRegistrationEmail } from '@/lib/email'
import { formatEventTimeGST, formatDateInGST } from '@/lib/time'
import { logAdminAction } from '@/lib/audit'
import { checkRateLimit, incrementRateLimit } from '@/lib/rate-limit'
import type { BulkRegistrationResponse } from '@/lib/types/admin'

// GET: Get users not registered for the event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
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

    const { slug } = await params

    // Get the event
    const event = await getEventBySlug(slug)
    if (!event) {
      return NextResponse.json(
        { success: false, message: 'Event not found' },
        { status: 404 }
      )
    }

    // Get users not registered for this event
    const unregisteredUsers = await getUsersNotRegisteredForEvent(event.id)

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        slug: event.slug,
        title: event.title,
        registrationCount: event.registrationCount,
        maxAttendees: event.maxAttendees,
      },
      users: unregisteredUsers,
      totalUnregistered: unregisteredUsers.length,
    })
  } catch (error) {
    console.error('Get unregistered users error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch unregistered users' },
      { status: 500 }
    )
  }
}

// POST: Bulk register users for the event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse<BulkRegistrationResponse>> {
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

    const { slug } = await params
    const body = await request.json()
    const { userIds, registerAll, sendEmails } = body as {
      userIds?: string[]
      registerAll?: boolean
      sendEmails?: boolean
    }

    // Get the event
    const event = await getEventBySlug(slug)
    if (!event) {
      return NextResponse.json(
        { success: false, message: 'Event not found' },
        { status: 404 }
      )
    }

    // Determine which users to register
    let usersToRegister: string[]

    if (registerAll) {
      // Get all unregistered users
      const unregisteredUsers = await getUsersNotRegisteredForEvent(event.id)
      usersToRegister = unregisteredUsers.map(u => u.id)
    } else if (userIds && userIds.length > 0) {
      usersToRegister = userIds
    } else {
      return NextResponse.json(
        { success: false, message: 'No users specified for registration' },
        { status: 400 }
      )
    }

    if (usersToRegister.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users to register',
        registered: 0,
        emailsSent: 0,
        failed: [],
      })
    }

    // Bulk register users
    const result = await bulkRegisterUsers(event.id, usersToRegister)

    // Send confirmation emails if requested
    let emailsSent = 0
    if (sendEmails && result.registered > 0) {
      // Format event details for email
      const formattedDate = formatDateInGST(event.date, 'en-GB')
      const startTimeGST = formatEventTimeGST(event.date, event.startTime)
      const endTimeGST = event.endTime ? formatEventTimeGST(event.date, event.endTime) : ''
      const formattedTime = endTimeGST ? `${startTimeGST} – ${endTimeGST}` : startTimeGST

      // Get successful registrations and send emails
      for (const userId of usersToRegister) {
        // Skip if this user failed
        if (result.failed.some(f => f.userId === userId)) {
          continue
        }

        try {
          // Get the registration and user details
          const registration = await getRegistrationByUserAndEvent(userId, event.id)
          if (!registration) continue

          const user = await getUserById(userId)
          if (!user) continue

          // Check per-recipient rate limit - skip if user has received too many emails
          const recipientRateLimit = await checkRateLimit(
            `admin_email:${user.email}`,
            'admin_email_to_recipient'
          )
          if (!recipientRateLimit.allowed) {
            console.log(`Skipping email to ${user.email} - rate limited`)
            continue
          }

          const emailSent = await sendEventRegistrationEmail(
            user.email,
            user.firstName,
            {
              title: event.title,
              titleAr: event.titleAr ?? undefined,
              date: formattedDate,
              time: formattedTime,
              isVirtual: event.isVirtual,
              location: event.location ?? undefined,
              locationAr: event.locationAr ?? undefined,
            }
          )

          if (emailSent) {
            await updateEmailSentAt(registration.id)
            await incrementRateLimit(`admin_email:${user.email}`, 'admin_email_to_recipient')
            emailsSent++
          }
        } catch (emailError) {
          console.error(`Error sending email to user ${userId}:`, emailError)
        }
      }
    }

    // Log the admin action
    await logAdminAction(
      { id: currentUser.id, email: currentUser.email },
      'registration.bulk_register',
      'registration',
      {
        targetType: 'event',
        targetId: event.id,
        targetIdentifier: event.slug,
        details: {
          eventTitle: event.title,
          eventSlug: event.slug,
          totalAttempted: usersToRegister.length,
          registered: result.registered,
          failed: result.failed.length,
          emailsSent,
        },
      }
    )

    return NextResponse.json({
      success: result.success || result.registered > 0,
      message: `Registered ${result.registered} user(s)${emailsSent > 0 ? `, sent ${emailsSent} email(s)` : ''}`,
      registered: result.registered,
      emailsSent,
      failed: result.failed,
    })
  } catch (error) {
    console.error('Bulk register error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to register users' },
      { status: 500 }
    )
  }
}
