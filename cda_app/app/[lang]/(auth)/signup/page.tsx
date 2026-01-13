'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { WhiteStarIcon, YellowStarIcon } from '@/components/icons/StarIcons'
import { SpinnerIcon } from '@/components/icons'

export default function SignupPage() {
  const t = useTranslations('auth')
  const commonT = useTranslations('common')
  const params = useParams()
  const router = useRouter()
  const lang = params.lang as string

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Redirect to verification page with email
    router.push(`/${lang}/verify-email?email=${encodeURIComponent(formData.email)}&mode=signup`)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Header */}
        <div className="p-6 sm:p-8">
          <Link href={`/${lang}`} className="flex items-center gap-3">
            <Image 
              src="/assets/logo.png" 
              alt={commonT('logo')} 
              width={48} 
              height={48}
              className="h-12 w-auto"
            />
            <div className="hidden sm:block">
              <p className="text-xs text-gray-600 leading-tight">{t('organizationName')}</p>
              <p className="text-xs text-gray-500">{t('initiativeName')}</p>
            </div>
          </Link>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16">
          <div className="w-full max-w-md">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">
              {t('createAccount')}
            </h1>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('fullName')}
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder={t('fullNamePlaceholder')}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
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
                  <div className="flex items-center px-4 py-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-gray-600">
                    <span className="text-sm">+971</span>
                  </div>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder={t('phoneNumberPlaceholder')}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <SpinnerIcon className="animate-spin h-5 w-5" />
                    {t('creatingAccount')}
                  </>
                ) : (
                  t('createAccountBtn')
                )}
              </button>
            </form>

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
