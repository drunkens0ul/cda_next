'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { EmailIcon, ArrowLeftIcon } from '@/components/icons'
import { useAuth } from '@/components/providers/AuthProvider'

function VerifyEmailContent() {
  const t = useTranslations('auth')
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { refreshSession } = useAuth()
  const lang = params.lang as string

  const email = searchParams.get('email') || 'user@example.com'
  const mode = searchParams.get('mode') || 'signup'
  const pollingToken = searchParams.get('token')
  const returnTo = searchParams.get('returnTo')

  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(true)

  // Poll for verification status
  const checkVerification = useCallback(async () => {
    if (!pollingToken) return false

    try {
      const response = await fetch(`/api/auth/check-verification?token=${pollingToken}`, {
        credentials: 'include', // Required to receive and store cookies from the response
      })
      const data = await response.json()

      if (data.verified) {
        // Refresh auth state before redirect so UI shows logged-in state immediately
        await refreshSession()
        // Verification complete - redirect to returnTo or home page
        const redirectPath = returnTo ? decodeURIComponent(returnTo) : `/${lang}`
        router.push(redirectPath)
        return true
      }

      if (data.expired) {
        // Token expired - stop polling
        setIsPolling(false)
        return true
      }

      return false
    } catch {
      return false
    }
  }, [pollingToken, router, lang, returnTo, refreshSession])

  // Set up polling interval
  useEffect(() => {
    if (!pollingToken || !isPolling) return

    const pollingRate = parseInt(process.env.NEXT_PUBLIC_POLLING_RATE_SECONDS || '5') * 1000
    const pollingMaxDuration = parseInt(process.env.NEXT_PUBLIC_POLLING_MAX_DURATION_MINUTES || '10') * 60 * 1000

    let isMounted = true

    // Check immediately on mount (deferred to avoid synchronous setState)
    const initialCheck = setTimeout(async () => {
      if (isMounted) {
        await checkVerification()
      }
    }, 0)

    // Poll based on configured rate
    const interval = setInterval(async () => {
      if (!isMounted) return
      const shouldStop = await checkVerification()
      if (shouldStop) {
        clearInterval(interval)
      }
    }, pollingRate)

    // Stop polling after configured max duration
    const timeout = setTimeout(() => {
      clearInterval(interval)
      setIsPolling(false)
    }, pollingMaxDuration)

    return () => {
      isMounted = false
      clearTimeout(initialCheck)
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [pollingToken, isPolling, checkVerification])

  const handleResend = async () => {
    setIsResending(true)
    setResendSuccess(false)
    setResendError(null)

    try {
      const response = await fetch('/api/auth/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, type: mode }),
      })

      const data = await response.json()

      if (!response.ok) {
        setResendError(data.message || t('somethingWentWrong'))
        setIsResending(false)
        return
      }

      setIsResending(false)
      setResendSuccess(true)

      // Reset success message after 5 seconds
      setTimeout(() => setResendSuccess(false), 5000)
    } catch {
      setResendError(t('somethingWentWrong'))
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      {/* Grid Pattern Background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #000 1px, transparent 1px),
            linear-gradient(to bottom, #000 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />

      <div className="relative z-10 w-full max-w-md text-center">
        <div className="mx-auto mb-6 w-16 h-16 rounded-xl border-2 border-gray-200 flex items-center justify-center bg-white shadow-sm">
          <EmailIcon className="w-8 h-8 text-gray-600" />
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          {mode === 'signup' ? t('verifyEmailTitle') : t('checkEmailTitle')}
        </h1>

        {/* Subtitle */}
        <p className="text-gray-600 mb-2">
          {mode === 'signup' ? t('verifyEmailSubtitle') : t('checkEmailSubtitle')}
        </p>
        <p className="text-gray-900 font-medium mb-8">
          {email}
        </p>

        {/* Resend Link */}
        <div className="mb-6">
          <p className="text-gray-600">
            {t('didntReceiveEmail')}{' '}
            <button
              onClick={handleResend}
              disabled={isResending}
              className="text-primary hover:text-primary-700 font-medium disabled:opacity-50"
            >
              {isResending ? t('resending') : t('clickToResend')}
            </button>
          </p>

          {resendSuccess && (
            <p className="mt-2 text-green-600 text-sm animate-fade-in">
              {t('emailResent')}
            </p>
          )}

          {resendError && (
            <p className="mt-2 text-red-600 text-sm">
              {resendError}
            </p>
          )}
        </div>

        <Link
          href={`/${lang}/login`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          {t('backToLogin')}
        </Link>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
