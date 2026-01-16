import { NextResponse } from 'next/server'
import { getHighlightedEvent } from '@/lib/events'
import type { EventResponse } from '@/lib/types/events'

/**
 * GET /api/events/highlighted
 * Returns the highlighted event for the JoinMovement section
 * Falls back to the next upcoming event if none is highlighted
 */
export async function GET(): Promise<NextResponse<EventResponse>> {
  try {
    const event = await getHighlightedEvent()

    if (!event) {
      return NextResponse.json({
        success: true,
        event: undefined,
        message: 'No highlighted or upcoming events found'
      })
    }

    return NextResponse.json({
      success: true,
      event
    })
  } catch (error) {
    console.error('Get highlighted event error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch highlighted event' },
      { status: 500 }
    )
  }
}
