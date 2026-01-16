import { NextRequest, NextResponse } from 'next/server'
import {
  getSessionToken,
  getSessionByToken,
  getUserById,
  getPendingSignupsPaginated,
} from '@/lib/auth'
import type { PendingSignupsResponse } from '@/lib/types/admin'

export async function GET(request: NextRequest): Promise<NextResponse<PendingSignupsResponse>> {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const search = searchParams.get('search') || ''
    const domain = searchParams.get('domain') || ''

    // Get paginated pending signups
    const result = await getPendingSignupsPaginated({
      page,
      limit,
      search,
      domain,
    })

    return NextResponse.json({
      success: true,
      pendingSignups: result.pendingSignups,
      pagination: result.pagination,
      stats: result.stats,
      domains: result.domains,
    })
  } catch (error) {
    console.error('Get pending signups error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch pending signups' },
      { status: 500 }
    )
  }
}
