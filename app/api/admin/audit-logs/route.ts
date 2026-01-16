import { NextRequest, NextResponse } from 'next/server'
import {
  getSessionToken,
  getSessionByToken,
  getUserById,
} from '@/lib/auth'
import { getAuditLogs } from '@/lib/audit'
import type { AuditCategory, AuditAction, AuditStatus, AuditTargetType } from '@/lib/types/audit'

export async function GET(request: NextRequest) {
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
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const category = searchParams.get('category') as AuditCategory | null
    const action = searchParams.get('action') as AuditAction | null
    const adminId = searchParams.get('adminId') || undefined
    const targetType = searchParams.get('targetType') as AuditTargetType | null
    const status = searchParams.get('status') as AuditStatus | null
    const search = searchParams.get('search') || undefined
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined

    const result = await getAuditLogs({
      page,
      limit,
      category: category || undefined,
      action: action || undefined,
      adminId,
      targetType: targetType || undefined,
      status: status || undefined,
      startDate,
      endDate,
      search,
    })

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('Get audit logs error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}
