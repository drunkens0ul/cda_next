import { NextResponse } from 'next/server'
import { getEvents } from '@/lib/events'
import type { EventsResponse } from '@/lib/types/events'

export async function GET(): Promise<NextResponse<EventsResponse>> {
  try {
    const events = await getEvents()
    return NextResponse.json({ success: true, events })
  } catch (error) {
    console.error('Get events error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}
