import { NextRequest, NextResponse } from 'next/server'
import { getEventBySlug } from '@/lib/events'
import type { EventResponse } from '@/lib/types/events'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse<EventResponse>> {
  try {
    const { slug } = await params
    const event = await getEventBySlug(slug)

    if (!event) {
      return NextResponse.json(
        { success: false, message: 'Event not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, event })
  } catch (error) {
    console.error('Get event error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch event' },
      { status: 500 }
    )
  }
}
