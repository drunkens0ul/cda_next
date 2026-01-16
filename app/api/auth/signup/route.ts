import { NextRequest, NextResponse } from 'next/server'
import {
  getUserByEmail,
  createVerificationToken,
  createPendingSignup,
  invalidateUserTokens,
  isValidEmail,
} from '@/lib/auth'
import { checkRateLimit, incrementRateLimit } from '@/lib/rate-limit'
import { sendVerificationEmail } from '@/lib/email'
import { verifyRecaptchaToken } from '@/lib/recaptcha'
import type { SignupRequest, AuthResponse } from '@/lib/types/auth'
import { defaultLocale } from '@/i18n/config'

export async function POST(request: NextRequest): Promise<NextResponse<AuthResponse>> {
  try {
    const body: SignupRequest = await request.json()
    const { email, firstName, lastName, phoneNumber, recaptchaToken } = body

    // Validate input
    if (!email || !firstName) {
      return NextResponse.json(
        { success: false, message: 'Email and first name are required' },
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

    if (firstName.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: 'Please enter your first name' },
        { status: 400 }
      )
    }

    // Input length validation to prevent oversized data
    if (email.length > 255) {
      return NextResponse.json(
        { success: false, message: 'Email address is too long (max 255 characters)' },
        { status: 400 }
      )
    }

    if (firstName.trim().length > 100) {
      return NextResponse.json(
        { success: false, message: 'First name is too long (max 100 characters)' },
        { status: 400 }
      )
    }

    if (lastName && lastName.trim().length > 100) {
      return NextResponse.json(
        { success: false, message: 'Last name is too long (max 100 characters)' },
        { status: 400 }
      )
    }

    if (phoneNumber && phoneNumber.length > 20) {
      return NextResponse.json(
        { success: false, message: 'Phone number is too long (max 20 characters)' },
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

    // Check if user already exists (and is not deleted)
    const existingUser = await getUserByEmail(email)
    if (existingUser && existingUser.emailVerified) {
      return NextResponse.json(
        { success: false, message: 'An account with this email already exists. Please log in instead.' },
        { status: 400 }
      )
    }

    // Invalidate any existing signup tokens for this email
    await invalidateUserTokens(email, 'signup')

    // Create verification token
    const verificationToken = await createVerificationToken(email, 'signup')

    // Create pending signup with firstName and lastName
    await createPendingSignup(
      email,
      firstName.trim(),
      verificationToken.id,
      lastName?.trim(),
      phoneNumber
    )

    // Get language from referer header or default to defaultLocale
    const referer = request.headers.get('referer') || ''
    const lang = referer.includes('/en/') ? 'en' : defaultLocale

    // Send verification email (using firstName for greeting)
    const emailSent = await sendVerificationEmail(
      email,
      firstName.trim(),
      verificationToken.token,
      lang as 'en' | 'ar'
    )

    if (!emailSent) {
      return NextResponse.json(
        { success: false, message: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      )
    }

    // Increment rate limit
    await incrementRateLimit(email.toLowerCase(), 'email_send')

    return NextResponse.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.',
      pollingToken: verificationToken.pollingToken,
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
