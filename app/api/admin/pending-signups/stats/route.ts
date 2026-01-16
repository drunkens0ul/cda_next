import { NextResponse } from 'next/server'
import {
  getSessionToken,
  getSessionByToken,
  getUserById,
  getPendingSignupsStats,
} from '@/lib/auth'
import type { PendingSignupsStatsResponse } from '@/lib/types/admin'

export async function GET(): Promise<NextResponse<PendingSignupsStatsResponse>> {
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

    const stats = await getPendingSignupsStats()

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    console.error('Get pending signups stats error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch pending signups stats' },
      { status: 500 }
    )
  }
}
