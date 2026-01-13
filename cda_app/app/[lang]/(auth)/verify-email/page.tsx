'use client'

import { useState, Suspense } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { EmailIcon, ArrowLeftIcon } from '@/components/icons'

function VerifyEmailContent() {
  const t = useTranslations('auth')
  const params = useParams()
  const searchParams = useSearchParams()
  const lang = params.lang as string
  
  const email = searchParams.get('email') || 'user@example.com'
  const mode = searchParams.get('mode') || 'signup'
  
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  const handleResend = async () => {
    setIsResending(true)
    setResendSuccess(false)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsResending(false)
    setResendSuccess(true)
    
    // Reset success message after 5 seconds
    setTimeout(() => setResendSuccess(false), 5000)
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
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
