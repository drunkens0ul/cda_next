'use client'

import { useState, Suspense } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { defaultLocale } from '@/i18n/config'
import { EmailIcon, ArrowLeftIcon } from '@/components/icons'
import { useAuth } from '@/components/providers/AuthProvider'

function VerifyContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const t = useTranslations('auth')
  const { refreshSession } = useAuth()
  const lang = params.lang as string || defaultLocale

  const token = searchParams.get('token')
  const type = searchParams.get('type') as 'signup' | 'login' | null

  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleVerify = async () => {
    if (!token || !type) {
      setError(t('invalidLink'))
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      const response = await fetch(`/api/auth/verify?token=${token}&type=${type}`, {
        method: 'GET',
        credentials: 'include',
      })

      // The API returns a redirect, but fetch doesn't follow redirects automatically for credentials
      // We need to handle this differently - check if we got redirected or got an error
      if (response.redirected) {
        // Refresh session before redirect
        await refreshSession()
        router.push(response.url)
        return
      }

      // If not redirected, the response URL tells us where we ended up
      const finalUrl = new URL(response.url)
      const errorParam = finalUrl.searchParams.get('error')

      if (errorParam) {
        switch (errorParam) {
          case 'expired':
            setError(t('linkExpired'))
            break
          case 'used':
            setError(t('linkAlreadyUsed'))
            break
          case 'invalid':
            setError(t('invalidLink'))
            break
          default:
            setError(t('somethingWentWrong'))
        }
        setIsVerifying(false)
        return
      }

      // Success - refresh session and redirect
      await refreshSession()
      router.push(`/${lang}`)
    } catch {
      setError(t('somethingWentWrong'))
      setIsVerifying(false)
    }
  }

  // Invalid parameters
  if (!token || !type) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="relative z-10 w-full max-w-md text-center">
          <div className="mx-auto mb-6 w-16 h-16 rounded-xl border-2 border-red-200 flex items-center justify-center bg-white shadow-sm">
            <EmailIcon className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{t('invalidLink')}</h1>
          <p className="text-gray-600 mb-6">{t('linkInvalidDescription')}</p>
          <Link
            href={`/${lang}/login`}
            className="inline-flex items-center gap-2 text-primary hover:text-primary-700 font-medium"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            {t('backToLogin')}
          </Link>
        </div>
      </div>
    )
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
          <EmailIcon className="w-8 h-8 text-primary" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          {type === 'signup' ? t('verifyEmailTitle') : t('confirmLoginTitle')}
        </h1>

        <p className="text-gray-600 mb-8">
          {type === 'signup' ? t('clickToVerifyEmail') : t('clickToConfirmLogin')}
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={isVerifying}
          className="w-full py-3 px-6 bg-primary text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isVerifying ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              {t('verifying')}
            </>
          ) : (
            type === 'signup' ? t('verifyEmailButton') : t('confirmLoginButton')
          )}
        </button>

        <div className="mt-6">
          <Link
            href={`/${lang}/login`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            {t('backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}
