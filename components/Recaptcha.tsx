'use client'

import { forwardRef, useImperativeHandle, useRef } from 'react'
import ReCAPTCHA from 'react-google-recaptcha'

export interface RecaptchaRef {
  reset: () => void
}

interface RecaptchaProps {
  onVerify: (token: string) => void
  onError?: () => void
  onExpire?: () => void
  siteKey?: string
  lang?: string
  isLoading?: boolean
}

const Recaptcha = forwardRef<RecaptchaRef, RecaptchaProps>(
  ({ onVerify, onError, onExpire, siteKey, lang, isLoading }, ref) => {
    const recaptchaRef = useRef<ReCAPTCHA>(null)

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (recaptchaRef.current) {
          recaptchaRef.current.reset()
        }
      },
    }))

    const handleSuccess = (token: string | null) => {
      if (token) {
        onVerify(token)
      }
    }

    const handleError = () => {
      console.error('ReCAPTCHA error occurred')
      if (onError) {
        onError()
      }
    }

    const handleExpire = () => {
      console.warn('ReCAPTCHA token expired')
      if (onExpire) {
        onExpire()
      }
    }

    const actualSiteKey = siteKey || process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
    
    // Determine badge position based on language direction
    const badgePosition = lang === 'ar' ? 'bottomright' : 'bottomleft'

    if (!actualSiteKey) {
      console.warn('ReCAPTCHA site key is not configured')
      return null
    }

    return (
      <div className="mt-6 flex justify-center">
        <div className="inline-block p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md">
          {isLoading ? (
            <div className="flex items-center justify-center py-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={actualSiteKey}
              badge={badgePosition}
              onChange={handleSuccess}
              onErrored={handleError}
              onExpired={handleExpire}
            />
          )}
        </div>
      </div>
    )
  }
)

Recaptcha.displayName = 'Recaptcha'

export default Recaptcha
