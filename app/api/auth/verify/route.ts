import { NextRequest, NextResponse } from 'next/server'
import {
  getVerificationToken,
  markTokenAsUsed,
  markPollingTokenVerified,
  getPendingSignup,
  deletePendingSignup,
  createUser,
  getUserById,
  updateLastLogin,
  createSession,
} from '@/lib/auth'
import { defaultLocale } from '@/i18n/config'

// Extract clean IP from x-forwarded-for header (handles multiple IPs and ports)
function extractClientIp(request: NextRequest): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  let ip = forwarded || realIp
  if (!ip) return undefined

  // Take first IP if multiple (comma-separated)
  ip = ip.split(',')[0].trim()

  // Remove port if present (handle both IPv4 and IPv6)
  if (ip.includes('[') && ip.includes(']:')) {
    ip = ip.substring(1, ip.lastIndexOf(']:'))
  } else if (ip.includes(':') && !ip.includes('::')) {
    const lastColon = ip.lastIndexOf(':')
    const possiblePort = ip.substring(lastColon + 1)
    if (/^\d+$/.test(possiblePort)) {
      ip = ip.substring(0, lastColon)
    }
  }

  return ip || undefined
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const type = searchParams.get('type') as 'signup' | 'login' | null
    const lang = searchParams.get('lang') as 'en' | 'ar' | null || defaultLocale
    // Use NEXT_PUBLIC_APP_URL for redirect to ensure correct domain
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

    if (!token || !type) {
      return NextResponse.redirect(
        new URL(`/${lang}/verify-result?error=invalid`, baseUrl)
      )
    }

    // Get verification token
    const verificationToken = await getVerificationToken(token)

    if (!verificationToken) {
      return NextResponse.redirect(
        new URL(`/${lang}/verify-result?error=invalid`, baseUrl)
      )
    }

    // Check if token is expired
    if (new Date() > verificationToken.expiresAt) {
      return NextResponse.redirect(
        new URL(`/${lang}/verify-result?error=expired`, baseUrl)
      )
    }

    // Check if token is already used
    if (verificationToken.usedAt) {
      return NextResponse.redirect(
        new URL(`/${lang}/verify-result?error=used`, baseUrl)
      )
    }

    // Check if type matches
    if (verificationToken.tokenType !== type) {
      return NextResponse.redirect(
        new URL(`/${lang}/verify-result?error=invalid`, baseUrl)
      )
    }

    let userId: string

    if (type === 'signup') {
      // Get pending signup data
      const pendingSignup = await getPendingSignup(verificationToken.id)

      if (!pendingSignup) {
        return NextResponse.redirect(
          new URL(`/${lang}/verify-result?error=expired`, baseUrl)
        )
      }

      // Create user with firstName and lastName
      const user = await createUser(
        pendingSignup.email,
        pendingSignup.firstName,
        pendingSignup.lastName || undefined,
        pendingSignup.phoneNumber || undefined
      )

      userId = user.id

      // Delete pending signup (soft delete)
      await deletePendingSignup(pendingSignup.email)
    } else {
      // Login flow
      if (!verificationToken.userId) {
        return NextResponse.redirect(
          new URL(`/${lang}/verify-result?error=invalid`, baseUrl)
        )
      }

      const user = await getUserById(verificationToken.userId)
      if (!user) {
        return NextResponse.redirect(
          new URL(`/${lang}/verify-result?error=invalid`, baseUrl)
        )
      }

      userId = user.id
    }

    // Mark token as used
    await markTokenAsUsed(verificationToken.id)

    // Mark polling token as verified (for original browser auto-redirect)
    await markPollingTokenVerified(verificationToken.id, userId)

    // Update last login timestamp for activity tracking
    await updateLastLogin(userId)

    // Create session for the browser that clicked the magic link
    const ip = extractClientIp(request)
    const userAgent = request.headers.get('user-agent') || undefined
    const sessionToken = await createSession(userId, ip, userAgent)

    // Redirect to home page with session cookie
    const response = NextResponse.redirect(new URL(`/${lang}`, baseUrl))

    const SESSION_EXPIRY_DAYS = parseInt(process.env.SESSION_TOKEN_EXPIRY_DAYS || '30')
    response.cookies.set('cda_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
    })

    return response
  } catch (error) {
    console.error('Verify error:', error)
    // Use NEXT_PUBLIC_APP_URL for error redirect as well
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    return NextResponse.redirect(new URL('/en/verify-result?error=server', baseUrl))
  }
}
