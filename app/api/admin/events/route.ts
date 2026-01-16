import { NextRequest, NextResponse } from 'next/server'
import {
  getSessionToken,
  getSessionByToken,
  getUserById,
} from '@/lib/auth'
import { createEvent, getAllEventsForAdmin } from '@/lib/events'
import { logAdminAction } from '@/lib/audit'
import type { CreateEventData } from '@/lib/types/events'

export async function GET() {
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

    // Get all events for admin
    const events = await getAllEventsForAdmin()

    return NextResponse.json({
      success: true,
      events,
    })
  } catch (error) {
    console.error('Get events error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json() as CreateEventData

    // Validate required fields
    if (!body.slug || !body.title || !body.date) {
      return NextResponse.json(
        { success: false, message: 'Slug, title, and date are required' },
        { status: 400 }
      )
    }

    // Require timezone offset from client (browser's local timezone)
    // This is critical for correct time conversion - admin's browser may be in different timezone than server
    if (body.timezoneOffset === undefined) {
      return NextResponse.json(
        { success: false, message: 'timezoneOffset is required for time conversion' },
        { status: 400 }
      )
    }

    // Input length validation
    if (body.slug.length > 255) {
      return NextResponse.json(
        { success: false, message: 'Slug is too long (max 255 characters)' },
        { status: 400 }
      )
    }

    if (body.title.length > 500) {
      return NextResponse.json(
        { success: false, message: 'Title is too long (max 500 characters)' },
        { status: 400 }
      )
    }

    if (body.titleAr && body.titleAr.length > 500) {
      return NextResponse.json(
        { success: false, message: 'Arabic title is too long (max 500 characters)' },
        { status: 400 }
      )
    }

    if (body.description && body.description.length > 5000) {
      return NextResponse.json(
        { success: false, message: 'Description is too long (max 5000 characters)' },
        { status: 400 }
      )
    }

    if (body.descriptionAr && body.descriptionAr.length > 5000) {
      return NextResponse.json(
        { success: false, message: 'Arabic description is too long (max 5000 characters)' },
        { status: 400 }
      )
    }

    if (body.location && body.location.length > 500) {
      return NextResponse.json(
        { success: false, message: 'Location is too long (max 500 characters)' },
        { status: 400 }
      )
    }

    // Create the event
    const event = await createEvent(body)

    // Log the admin action
    await logAdminAction(
      { id: currentUser.id, email: currentUser.email },
      'event.create',
      'event',
      {
        targetType: 'event',
        targetId: event.id,
        targetIdentifier: event.slug,
        details: {
          eventTitle: event.title,
          eventSlug: event.slug,
          eventDate: body.date,
        },
      }
    )

    return NextResponse.json({
      success: true,
      event,
      message: 'Event created successfully',
    })
  } catch (error) {
    console.error('Create event error:', error)
    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('duplicate')) {
      return NextResponse.json(
        { success: false, message: 'An event with this slug already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, message: 'Failed to create event' },
      { status: 500 }
    )
  }
}
