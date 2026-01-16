import { NextRequest, NextResponse } from 'next/server'
import {
  getSessionToken,
  getSessionByToken,
  getUserById,
  refreshPendingSignupToken,
} from '@/lib/auth'
import { sendVerificationEmail } from '@/lib/email'
import { logAdminAction } from '@/lib/audit'
import { defaultLocale } from '@/i18n/config'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Get optional language from request body
    let lang: 'en' | 'ar' = defaultLocale
    try {
      const body = await request.json()
      if (body.lang === 'en' || body.lang === 'ar') {
        lang = body.lang
      }
    } catch {
      // No body or invalid JSON - use default language
    }

    // Refresh the token and get the new token info
    const tokenInfo = await refreshPendingSignupToken(id)

    if (!tokenInfo) {
      return NextResponse.json(
        { success: false, message: 'Pending signup not found' },
        { status: 404 }
      )
    }

    // Send verification email
    const emailSent = await sendVerificationEmail(
      tokenInfo.email,
      tokenInfo.firstName,
      tokenInfo.token,
      lang
    )

    if (!emailSent) {
      return NextResponse.json(
        { success: false, message: 'Failed to send verification email' },
        { status: 500 }
      )
    }

    // Log the admin action
    await logAdminAction(
      { id: currentUser.id, email: currentUser.email },
      'pending_signup.send_verification',
      'pending_signup',
      {
        targetType: 'pending_signup',
        targetId: id,
        targetIdentifier: tokenInfo.email,
        details: {
          email: tokenInfo.email,
          firstName: tokenInfo.firstName,
          language: lang,
        },
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
    })
  } catch (error) {
    console.error('Send verification email error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to send verification email' },
      { status: 500 }
    )
  }
}
