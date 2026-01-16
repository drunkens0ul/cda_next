import { NextRequest, NextResponse } from 'next/server'
import {
  getSessionToken,
  getSessionByToken,
  getUserById,
  bulkRefreshAndSendVerification,
  getPendingSignupIds,
} from '@/lib/auth'
import { logAdminAction } from '@/lib/audit'
import { checkRateLimit, incrementRateLimit } from '@/lib/rate-limit'

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
    const body = await request.json()
    const { mode, ids, domain, search, lang = 'en' } = body as {
      mode: 'selected' | 'filtered' | 'all'
      ids?: string[]
      domain?: string
      search?: string
      lang?: 'en' | 'ar'
    }

    if (!mode) {
      return NextResponse.json(
        { success: false, message: 'Mode is required' },
        { status: 400 }
      )
    }

    let targetIds: string[]

    switch (mode) {
      case 'selected':
        if (!ids || ids.length === 0) {
          return NextResponse.json(
            { success: false, message: 'No users selected' },
            { status: 400 }
          )
        }
        targetIds = ids
        break

      case 'filtered':
        targetIds = await getPendingSignupIds({ domain, search })
        break

      case 'all':
        targetIds = await getPendingSignupIds({})
        break

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid mode' },
          { status: 400 }
        )
    }

    if (targetIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No pending signups found' },
        { status: 404 }
      )
    }

    // Check 30-minute cooldown for bulk verification
    const cooldown = await checkRateLimit(
      `admin_bulk_verification:${currentUser.id}`,
      'admin_bulk_verification'
    )
    if (!cooldown.allowed) {
      return NextResponse.json(
        { success: false, message: 'Please wait 30 minutes before sending another bulk verification email.' },
        { status: 429 }
      )
    }

    // Process bulk send
    const result = await bulkRefreshAndSendVerification(targetIds, lang)

    // Increment cooldown timer after successful bulk send
    await incrementRateLimit(`admin_bulk_verification:${currentUser.id}`, 'admin_bulk_verification')

    // Log the admin action
    await logAdminAction(
      { id: currentUser.id, email: currentUser.email },
      'pending_signup.bulk_send_verification',
      'pending_signup',
      {
        targetType: 'bulk',
        details: {
          mode,
          totalAttempted: targetIds.length,
          sent: result.sent,
          failed: result.failed,
          language: lang,
          filters: { domain, search },
        },
      }
    )

    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
      errors: result.errors,
      total: targetIds.length,
    })
  } catch (error) {
    console.error('Bulk send verification error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to send verification emails' },
      { status: 500 }
    )
  }
}
