'use client'

import { Suspense } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { ArrowLeftIcon } from '@/components/icons'

function VerifyResultContent() {
  const t = useTranslations('auth')
  const params = useParams()
  const searchParams = useSearchParams()
  const lang = params.lang as string

  const error = searchParams.get('error')
  const success = searchParams.get('success') === 'true'

  const getErrorMessage = () => {
    switch (error) {
      case 'expired':
        return t('tokenExpired')
      case 'used':
        return t('tokenAlreadyUsed')
      case 'invalid':
        return t('tokenInvalid')
      case 'server':
      default:
        return t('somethingWentWrong')
    }
  }

  const getErrorTitle = () => {
    switch (error) {
      case 'expired':
        return t('linkExpiredTitle')
      case 'used':
        return t('linkUsedTitle')
      case 'invalid':
        return t('linkInvalidTitle')
      default:
        return t('verificationFailedTitle')
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
        {success ? (
          <>
            <div className="mx-auto mb-6 w-16 h-16 rounded-xl border-2 border-green-200 flex items-center justify-center bg-green-50">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              {t('emailVerifiedTitle')}
            </h1>

            <p className="text-gray-600 mb-8">
              {t('emailVerifiedMessage')}
            </p>

            <Link
              href={`/${lang}`}
              className="inline-flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              {t('backToHome')}
            </Link>
          </>
        ) : (
          <>
            <div className="mx-auto mb-6 w-16 h-16 rounded-xl border-2 border-red-200 flex items-center justify-center bg-red-50">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0l-6.938 12c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              {getErrorTitle()}
            </h1>

            <p className="text-gray-600 mb-8">
              {getErrorMessage()}
            </p>

            <div className="space-y-4">
              <Link
                href={`/${lang}/login`}
                className="inline-block w-full bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                {t('tryAgain')}
              </Link>

              <Link
                href={`/${lang}`}
                className="inline-flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                {t('backToHome')}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function VerifyResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <VerifyResultContent />
    </Suspense>
  )
}
