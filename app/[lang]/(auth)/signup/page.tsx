'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { WhiteStarIcon, YellowStarIcon } from '@/components/icons/StarIcons'
import { SpinnerIcon } from '@/components/icons'
import Recaptcha, { RecaptchaRef } from '@/components/Recaptcha'

export default function SignupPage() {
  const t = useTranslations('auth')
  const commonT = useTranslations('common')
  const params = useParams()
  const router = useRouter()
  const lang = params.lang as string

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null)



  // Redirect logged-in users to home page
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        })
        const data = await response.json()
        if (data.user) {
          router.replace(`/${lang}`)
          return
        }
      } catch {
        // Not logged in, continue showing signup page
      }
      setIsCheckingAuth(false)
    }
    checkAuth()
  }, [router, lang])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (!recaptchaToken) {
        setError(t('recaptchaFailed') || 'Please complete the reCAPTCHA verification.')
        setIsSubmitting(false)
        return
      }

      setIsLoading(true)

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName || undefined,
          phoneNumber: formData.phoneNumber ? `+971${formData.phoneNumber}` : undefined,
          recaptchaToken,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || t('somethingWentWrong'))
        setRecaptchaToken(null)
        setIsLoading(false)
        setIsSubmitting(false)
        return
      }

      // Redirect to verification page with email and polling token
      const pollingToken = data.pollingToken || ''
      router.push(`/${lang}/verify-email?email=${encodeURIComponent(formData.email)}&token=${pollingToken}&mode=signup`)
    } catch {
      setError(t('somethingWentWrong'))
      setRecaptchaToken(null)
      setIsLoading(false)
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Show loading spinner while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <SpinnerIcon className="animate-spin h-8 w-8 text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Header */}
        <div className="p-6 sm:p-8">
          <Link href={`/${lang}`} className="flex items-center gap-2 sm:gap-3">
            <Image
              src="/assets/logo.png"
              alt={commonT('logo')}
              width={48}
              height={48}
              className="h-10 sm:h-12 md:h-14 lg:h-16 w-auto"
            />
            <div className="hidden sm:block h-8 w-px bg-gray-300"></div>
            <Image
              src="/assets/logo_newsvg.svg"
              alt="Dubai Communicates"
              width={48}
              height={27}
              className="h-7 sm:h-8 md:h-9 lg:h-10 w-auto"
            />
          </Link>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16">
          <div className="w-full max-w-md">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">
              {t('createAccount')}
            </h1>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Row - First Name and Last Name */}
              <div className="grid grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('firstName') || 'First Name'}
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder={t('firstNamePlaceholder') || 'Enter first name'}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('lastName') || 'Last Name'}
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder={t('lastNamePlaceholder') || 'Enter last name'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('email')}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t('emailPlaceholder')}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('phoneNumber')}
                </label>
                <div className="flex">
                  <div className="flex items-center px-4 py-3 border border-e-0 border-gray-300 rounded-s-lg bg-gray-50 text-gray-600">
                    <span className="text-sm">+971</span>
                  </div>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    dir="ltr"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder={t('phoneNumberPlaceholder')}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-e-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-left"
                  />
                </div>
              </div>


              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || isSubmitting}
                className="w-full bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading || isSubmitting ? (
                  <>
                    <SpinnerIcon className="animate-spin h-5 w-5" />
                    {t('creatingAccount')}
                  </>
                ) : (
                  t('createAccountBtn')
                )}
              </button>
            </form>

            <Recaptcha onVerify={setRecaptchaToken} lang={lang} isLoading={isLoading || isSubmitting} />

            {/* Login Link */}
            <p className="mt-6 text-center text-gray-600">
              {t('alreadyHaveAccount')}{' '}
              <Link
                href={`/${lang}/login`}
                className="text-primary hover:text-primary-700 font-medium underline"
              >
                {t('loginLink')}
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-12 lg:px-16 py-6">
          <p className="text-xs text-gray-500">
            © {t('footerText')}
          </p>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <Image
          src="/assets/auth-hero.jpg"
          alt="Sign Language Learning"
          fill
          className="object-cover"
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          quality={85}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Decorative Stars */}
        <div className="absolute top-1/2 left-12 animate-pulse">
           <WhiteStarIcon className="w-16 h-16 sm:w-20 sm:h-20" />
        </div>
        <div className="absolute top-[45%] left-8 animate-bounce delay-700">
           <YellowStarIcon className="w-6 h-6" />
        </div>

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
            {t('heroTitle')}
          </h2>
          <p className="text-white/80 text-base leading-relaxed max-w-md">
            {t('heroSubtitle')}
          </p>

          {/* Instructors Badge */}
          <div className="mt-8 flex items-center gap-4">
            <div className="flex -space-x-3">
              <div className="relative w-12 h-12 bg-blue-100 rounded-full border-2 border-white flex items-center justify-center overflow-hidden">
                <Image
                  src="/assets/person1.png"
                  alt="Instructor"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="relative w-12 h-12 bg-purple-100 rounded-full border-2 border-white flex items-center justify-center overflow-hidden">
                <Image
                  src="/assets/person2.png"
                  alt="Instructor"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="relative w-12 h-12 bg-pink-100 rounded-full border-2 border-white flex items-center justify-center overflow-hidden">
                <Image
                  src="/assets/person3.png"
                  alt="Instructor"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="relative w-12 h-12 bg-green-100 rounded-full border-2 border-white flex items-center justify-center overflow-hidden">
                <Image
                  src="/assets/person4.png"
                  alt="Instructor"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="relative w-12 h-12 bg-amber-100 rounded-full border-2 border-white flex items-center justify-center overflow-hidden">
                <Image
                  src="/assets/person1.png"
                  alt="Instructor"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <span className="text-white font-bold text-lg">
              {t('expertInstructors')}
            </span>
          </div>
        </div>

      </div>
    </div>
  )
}
