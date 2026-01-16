import { NextResponse } from 'next/server'
import {
  getSessionToken,
  getSessionByToken,
  getUserById,
  getUserStats,
} from '@/lib/auth'
import { getEventStats, getRegistrationStats } from '@/lib/events'
import type { AdminStatsResponse } from '@/lib/types/admin'

export async function GET(): Promise<NextResponse<AdminStatsResponse>> {
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

    // Fetch all stats in parallel
    const [userStats, eventStats, registrationStats] = await Promise.all([
      getUserStats(),
      getEventStats(),
      getRegistrationStats(),
    ])

    return NextResponse.json({
      success: true,
      stats: {
        users: userStats,
        events: eventStats,
        registrations: registrationStats,
      },
    })
  } catch (error) {
    console.error('Get admin stats error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
