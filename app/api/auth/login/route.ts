import { NextRequest, NextResponse } from 'next/server'
import {
  getUserByEmail,
  createVerificationToken,
  invalidateUserTokens,
  isValidEmail,
} from '@/lib/auth'
import { checkRateLimit, incrementRateLimit } from '@/lib/rate-limit'
import { sendMagicLinkEmail } from '@/lib/email'
import { verifyRecaptchaToken } from '@/lib/recaptcha'
import type { LoginRequest, AuthResponse } from '@/lib/types/auth'
import { defaultLocale } from '@/i18n/config'

export async function POST(request: NextRequest): Promise<NextResponse<AuthResponse>> {
  try {
    const body: LoginRequest = await request.json()
    const { email, recaptchaToken } = body

    // Validate input
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Verify reCAPTCHA token
    const isRecaptchaValid = await verifyRecaptchaToken(recaptchaToken)
    if (!isRecaptchaValid) {
      return NextResponse.json(
        { success: false, message: 'CAPTCHA verification failed. Please try again.' },
        { status: 400 }
      )
    }

  

    // Check rate limiting
    const rateLimit = await checkRateLimit(email.toLowerCase(), 'email_send')
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Get language from referer header or default to defaultLocale
    const referer = request.headers.get('referer') || ''
    const lang = referer.includes('/en/') ? 'en' : defaultLocale

    // Check if user exists
    const user = await getUserByEmail(email)

    // Always increment rate limit to prevent timing attacks
    await incrementRateLimit(email.toLowerCase(), 'email_send')

    // If user doesn't exist, ask them to sign up
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No account found with this email. Please sign up first.' },
        { status: 404 }
      )
    }

    // If email not verified, ask them to check inbox or sign up again
    if (!user.emailVerified) {
      return NextResponse.json(
        { success: false, message: 'Your email is not verified yet. Please check your inbox for the verification link, or sign up again to receive a new one.' },
        { status: 400 }
      )
    }

    // Invalidate any existing login tokens for this user
    await invalidateUserTokens(email, 'login')

    // Create magic link token with polling token
    const verificationToken = await createVerificationToken(email, 'login', user.id)

    // Send magic link email
    await sendMagicLinkEmail(email, verificationToken.token, lang as 'en' | 'ar')

    return NextResponse.json({
      success: true,
      message: 'Magic link sent. Please check your inbox.',
      pollingToken: verificationToken.pollingToken,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
