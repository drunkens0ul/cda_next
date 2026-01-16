import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import {
  getUserByEmail,
  createVerificationToken,
  invalidateUserTokens,
  isValidEmail,
} from '@/lib/auth'
import { checkRateLimit, incrementRateLimit } from '@/lib/rate-limit'
import { sendVerificationEmail, sendMagicLinkEmail } from '@/lib/email'
import type { ResendRequest, AuthResponse } from '@/lib/types/auth'
import { defaultLocale } from '@/i18n/config'

export async function POST(request: NextRequest): Promise<NextResponse<AuthResponse>> {
  try {
    const body: ResendRequest = await request.json()
    const { email, type } = body

    // Validate input
    if (!email || !type) {
      return NextResponse.json(
        { success: false, message: 'Email and type are required' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    if (type !== 'signup' && type !== 'login') {
      return NextResponse.json(
        { success: false, message: 'Invalid type' },
        { status: 400 }
      )
    }

    // Check rate limiting (stricter for resend)
    const rateLimit = await checkRateLimit(email.toLowerCase(), 'resend_email')
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Get language from referer header or default to defaultLocale
    const referer = request.headers.get('referer') || ''
    const lang = referer.includes('/en/') ? 'en' : defaultLocale

    if (type === 'signup') {
      // Check if there's a pending signup
      const pendingResult = await query<{
        email: string
        first_name: string
        last_name: string | null
        token_id: string
      }>(
        `SELECT email, first_name, last_name, token_id FROM pending_signups WHERE email = $1 AND expires_at > NOW()`,
        [email.toLowerCase()]
      )

      if (pendingResult.rows.length === 0) {
        // For security, return success even if no pending signup
        return NextResponse.json({
          success: true,
          message: 'If a pending signup exists, a new verification email has been sent.',
        })
      }

      const pending = pendingResult.rows[0]
      const fullName = pending.last_name
        ? `${pending.first_name} ${pending.last_name}`
        : pending.first_name

      // Invalidate old tokens and create new one
      await invalidateUserTokens(email, 'signup')
      const newToken = await createVerificationToken(email, 'signup')

      // Update pending signup with new token
      await query(
        `UPDATE pending_signups SET token_id = $1, expires_at = NOW() + INTERVAL '30 minutes' WHERE email = $2`,
        [newToken.id, email.toLowerCase()]
      )

      // Send new verification email
      await sendVerificationEmail(
        email,
        fullName,
        newToken.token,
        lang as 'en' | 'ar'
      )
    } else {
      // Login resend
      const user = await getUserByEmail(email)

      if (user && user.emailVerified) {
        // Invalidate old tokens and create new one
        await invalidateUserTokens(email, 'login')
        const newToken = await createVerificationToken(email, 'login', user.id)

        // Send new magic link email
        await sendMagicLinkEmail(email, newToken.token, lang as 'en' | 'ar')
      }
    }

    // Increment rate limit
    await incrementRateLimit(email.toLowerCase(), 'resend_email')

    return NextResponse.json({
      success: true,
      message: 'A new verification email has been sent.',
    })
  } catch (error) {
    console.error('Resend error:', error)
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
