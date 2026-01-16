import { NextRequest, NextResponse } from 'next/server'
import {
  checkPollingToken,
  createSession,
} from '@/lib/auth'

const SESSION_COOKIE_NAME = 'cda_session'
const SESSION_EXPIRY_DAYS = parseInt(process.env.SESSION_TOKEN_EXPIRY_DAYS || '30')

// Extract clean IP from x-forwarded-for header (handles multiple IPs and ports)
function extractClientIp(request: NextRequest): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  let ip = forwarded || realIp
  if (!ip) return undefined

  // Take first IP if multiple (comma-separated)
  ip = ip.split(',')[0].trim()

  // Remove port if present (handle both IPv4 and IPv6)
  // IPv6 with port: [::1]:8080, IPv4 with port: 192.168.1.1:8080
  if (ip.includes('[') && ip.includes(']:')) {
    // IPv6 with port
    ip = ip.substring(1, ip.lastIndexOf(']:'))
  } else if (ip.includes(':') && !ip.includes('::')) {
    // IPv4 with port (single colon, not IPv6)
    const lastColon = ip.lastIndexOf(':')
    const possiblePort = ip.substring(lastColon + 1)
    if (/^\d+$/.test(possiblePort)) {
      ip = ip.substring(0, lastColon)
    }
  }

  return ip || undefined
}

interface CheckVerificationResponse {
  verified: boolean
  expired?: boolean
}

export async function GET(request: NextRequest): Promise<NextResponse<CheckVerificationResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const pollingToken = searchParams.get('token')

    if (!pollingToken) {
      return NextResponse.json({ verified: false, expired: true })
    }

    // Check if the polling token has been verified
    const result = await checkPollingToken(pollingToken)

    if (result.expired) {
      return NextResponse.json({ verified: false, expired: true })
    }

    if (result.verified && result.userId) {
      // Create a new session for this browser (the one polling)
      const ip = extractClientIp(request)
      const userAgent = request.headers.get('user-agent') || undefined
      const sessionToken = await createSession(result.userId, ip, userAgent)

      // Create response and set cookie directly on it
      const response = NextResponse.json({ verified: true })
      response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
      })

      return response
    }

    return NextResponse.json({ verified: false })
  } catch (error) {
    console.error('Check verification error:', error)
    return NextResponse.json({ verified: false, expired: true })
  }
}
