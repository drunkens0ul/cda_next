import { NextRequest, NextResponse } from 'next/server'
import { subscribeToNewsletter, isValidEmail } from '@/lib/auth'
import type { NewsletterSubscribeRequest, AuthResponse } from '@/lib/types/auth'

// Extract clean IP from x-forwarded-for header (handles multiple IPs and ports)
function extractClientIp(request: NextRequest): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  let ip = forwarded || realIp
  if (!ip) return undefined

  ip = ip.split(',')[0].trim()

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

export async function POST(request: NextRequest): Promise<NextResponse<AuthResponse>> {
  try {
    const body: NewsletterSubscribeRequest = await request.json()
    const { email } = body

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

    // Input length validation
    if (email.length > 255) {
      return NextResponse.json(
        { success: false, message: 'Email address is too long (max 255 characters)' },
        { status: 400 }
      )
    }

    // Get IP and user agent for tracking
    const ipAddress = extractClientIp(request)
    const userAgent = request.headers.get('user-agent') || undefined

    // Subscribe to newsletter
    const result = await subscribeToNewsletter(email, ipAddress, userAgent)

    if (result.alreadySubscribed) {
      return NextResponse.json({
        success: true,
        message: 'You are already subscribed to our newsletter.',
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to our newsletter!',
    })
  } catch (error) {
    console.error('Newsletter subscribe error:', error)
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
