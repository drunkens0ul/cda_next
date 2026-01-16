import { NextRequest, NextResponse } from 'next/server'
import {
  getSessionToken,
  getSessionByToken,
  getUserById,
} from '@/lib/auth'
import { getEventBySlug, updateEvent, deleteEvent } from '@/lib/events'
import { logAdminAction } from '@/lib/audit'
import type { UpdateEventData } from '@/lib/types/events'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
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
    const existingEvent = await getEventBySlug(slug)
    if (!existingEvent) {
      return NextResponse.json(
        { success: false, message: 'Event not found' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json() as UpdateEventData

    // Require timezone offset from client (browser's local timezone)
    // This is critical for correct time conversion - admin's browser may be in different timezone than server
    if (body.timezoneOffset === undefined) {
      return NextResponse.json(
        { success: false, message: 'timezoneOffset is required for time conversion' },
        { status: 400 }
      )
    }

    // Update the event
    const event = await updateEvent(existingEvent.id, body)

    if (!event) {
      return NextResponse.json(
        { success: false, message: 'Failed to update event' },
        { status: 500 }
      )
    }

    // Log the admin action
    await logAdminAction(
      { id: currentUser.id, email: currentUser.email },
      'event.update',
      'event',
      {
        targetType: 'event',
        targetId: event.id,
        targetIdentifier: event.slug,
        details: {
          eventTitle: event.title,
          eventSlug: event.slug,
          updatedFields: Object.keys(body).filter(k => k !== 'timezoneOffset'),
        },
      }
    )

    return NextResponse.json({
      success: true,
      event,
      message: 'Event updated successfully',
    })
  } catch (error) {
    console.error('Update event error:', error)
    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('duplicate')) {
      return NextResponse.json(
        { success: false, message: 'An event with this slug already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, message: 'Failed to update event' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
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
    const existingEvent = await getEventBySlug(slug)
    if (!existingEvent) {
      return NextResponse.json(
        { success: false, message: 'Event not found' },
        { status: 404 }
      )
    }

    // Delete the event
    const success = await deleteEvent(existingEvent.id)

    if (!success) {
      return NextResponse.json(
        { success: false, message: 'Failed to delete event' },
        { status: 500 }
      )
    }

    // Log the admin action
    await logAdminAction(
      { id: currentUser.id, email: currentUser.email },
      'event.delete',
      'event',
      {
        targetType: 'event',
        targetId: existingEvent.id,
        targetIdentifier: existingEvent.slug,
        details: {
          eventTitle: existingEvent.title,
          eventSlug: existingEvent.slug,
        },
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully',
    })
  } catch (error) {
    console.error('Delete event error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete event' },
      { status: 500 }
    )
  }
}
