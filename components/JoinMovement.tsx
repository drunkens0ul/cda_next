'use client'

import { memo, useState, useEffect, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Section from './Section'
import Image from 'next/image'
import { CheckCircleIcon, CalendarIcon, UsersIcon, SpinnerIcon } from './icons'
import { useAuth } from './providers/AuthProvider'
import { formatEventTimeGST, formatDateInGST, formatCountdown, combineDateAndTime } from '@/lib/time'
import type { EventWithRegistrationCount } from '@/lib/types/events'

interface CountdownTime {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function JoinMovement() {
  const t = useTranslations('join')
  const commonT = useTranslations('common')
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  const [featuredEvent, setFeaturedEvent] = useState<EventWithRegistrationCount | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [countdown, setCountdown] = useState<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const eventsT = useTranslations('events')

  useEffect(() => {
    async function fetchFeaturedEvent() {
      try {
        setHasError(false)
        // Fetch the highlighted event (or fallback to first upcoming)
        const response = await fetch('/api/events/highlighted')
        if (!response.ok) {
          setHasError(true)
          return
        }
        const data = await response.json()
        if (data.success && data.event) {
          setFeaturedEvent(data.event)
        }
      } catch (error) {
        console.error('Failed to fetch featured event:', error)
        setHasError(true)
      } finally {
        setIsLoading(false)
      }
    }
    fetchFeaturedEvent()
  }, [])

  // Check registration status
  useEffect(() => {
    async function checkRegistration() {
      if (!featuredEvent?.slug) return
      try {
        const response = await fetch(`/api/events/${featuredEvent.slug}/registration`, {
          credentials: 'include'
        })
        const data = await response.json()
        if (data.success) {
          setIsRegistered(data.isRegistered)
        }
      } catch (error) {
        console.error('Failed to check registration:', error)
      }
    }
    checkRegistration()
  }, [featuredEvent?.slug, isAuthenticated])

  // Countdown timer
  useEffect(() => {
    if (!featuredEvent || !featuredEvent.startTime) return

    const calculateCountdown = () => {
      try {
        const eventDate = combineDateAndTime(featuredEvent.date, featuredEvent.startTime)
        const now = new Date()
        const diff = eventDate.getTime() - now.getTime()

        if (isNaN(diff) || diff <= 0) {
          setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 })
          return
        }

        setCountdown(formatCountdown(diff))
      } catch (error) {
        console.error('Error calculating countdown:', error)
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    calculateCountdown()
    const interval = setInterval(calculateCountdown, 1000)

    return () => clearInterval(interval)
  }, [featuredEvent])

  // Check if registration deadline has passed
  useEffect(() => {
    if (!featuredEvent || !featuredEvent.registrationDeadline) {
      setIsDeadlinePassed(false)
      return
    }

    const checkDeadline = () => {
      const deadline = new Date(featuredEvent.registrationDeadline as Date)
      const now = new Date()
      setIsDeadlinePassed(now >= deadline)
    }

    checkDeadline()
    // Check every minute instead of every second since we're not showing countdown
    const interval = setInterval(checkDeadline, 60000)

    return () => clearInterval(interval)
  }, [featuredEvent])

  // Handle registration
  const handleRegister = useCallback(async () => {
    if (!featuredEvent) return

    if (!isAuthenticated) {
      // Redirect to login with returnTo
      const returnUrl = `/${locale}/event/${featuredEvent.slug}?action=register`
      router.push(`/${locale}/login?returnTo=${encodeURIComponent(returnUrl)}`)
      return
    }

    setIsRegistering(true)

    try {
      const response = await fetch(`/api/events/${featuredEvent.slug}/register`, {
        method: 'POST',
        credentials: 'include'
      })
      const data = await response.json()

      if (data.success) {
        setIsRegistered(true)
        // Refresh event data to update count
        const eventResponse = await fetch('/api/events/highlighted')
        const eventData = await eventResponse.json()
        if (eventData.success && eventData.event) {
          setFeaturedEvent(eventData.event)
        }
      }
    } catch (error) {
      console.error('Registration error:', error)
    } finally {
      setIsRegistering(false)
    }
  }, [isAuthenticated, locale, featuredEvent, router])

  // Format date for display in GST
  const formatDate = (date: Date | string) => {
    return formatDateInGST(date, isRtl ? 'ar-AE' : 'en-US')
  }

  // Format time range for display in GST
  const formatTimeRange = (date: Date | string, startTime: string | null, endTime: string | null) => {
    if (!startTime) return ''
    const start = formatEventTimeGST(date, startTime)
    const end = endTime ? formatEventTimeGST(date, endTime) : ''
    return end ? `${start} - ${end}` : start
  }

  // Format deadline date/time for display in GST
  const formatDeadline = (deadline: Date | string) => {
    const date = new Date(deadline)
    // Convert to GST (UTC+4)
    const gstDate = new Date(date.getTime() + (4 * 60 * 60 * 1000))
    const dateStr = formatDateInGST(deadline, isRtl ? 'ar-AE' : 'en-US')
    const hours = gstDate.getUTCHours()
    const minutes = gstDate.getUTCMinutes()
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const hour12 = hours % 12 || 12
    const timeStr = `${hour12}:${String(minutes).padStart(2, '0')} ${ampm}`
    return `${dateStr}, ${timeStr}`
  }

  const benefits = [
    t('benefit1'),
    // t('benefit2'),
    // t('benefit3'),
    t('benefit4'),
  ]

  return (
    <Section id="join-movement">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
        <div>
          <h2 className="section-heading mb-2">
            <span className="text-primary">{t('joinThe')}</span>{' '}
            {t('movement')}
          </h2>
          <h2 className="section-heading mb-6">
            {t('makeA')}{' '}
            <span className="text-primary">{t('difference')}</span>
          </h2>
          <p className="text-text-gray text-lg leading-relaxed mb-6">
            {t('description')}
          </p>
          <p className="text-text-gray text-base leading-relaxed mb-8">
            {t('subdescription')}
          </p>
          <div className="space-y-4 mb-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <CheckCircleIcon className="w-6 h-6 text-primary" />
                </div>
                <p className="text-text-gray leading-relaxed font-medium">{benefit}</p>
              </div>
            ))}
          </div>
          <p className="text-text-dark font-semibold mb-4">
            {t('registerCta')}
          </p>
        </div>
        <div className="relative">
          {isLoading ? (
                      <div className="flex justify-center items-center h-96">
                        <SpinnerIcon className="animate-spin h-8 w-8 text-primary" />
                      </div>
                    ) : featuredEvent ? (
                      <div className="w-full">
                        <Link href={`/${locale}/event/${featuredEvent.slug}`} className="block">
                          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100">
                              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                              <span className="text-xs font-medium text-text-gray">
                                {commonT('upcomingEvent')}
                              </span>
                            </div>
                            <div className="relative h-40 sm:h-48">
                              <div className="absolute top-3 left-3 z-10">
                                <div className={`text-xs font-semibold px-3 py-1 rounded ${
                                  featuredEvent.isVirtual
                                    ? 'bg-teal-100 text-teal-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {featuredEvent.isVirtual ? t('virtualEvent') : t('inPersonEvent')}
                                </div>
                              </div>
                              <Image
                                src={featuredEvent.imageUrl || '/assets/event1.jpg'}
                                alt={isRtl && featuredEvent.titleAr ? featuredEvent.titleAr : featuredEvent.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="p-4">
                              <div className="flex items-center gap-2 text-primary text-xs font-medium mb-2">
                                <span>{featuredEvent.startTime ? formatTimeRange(featuredEvent.date, featuredEvent.startTime, featuredEvent.endTime) : formatDate(featuredEvent.date)}</span>
                                <span>•</span>
                                <span>
                                  {formatDate(featuredEvent.date)}
                                </span>
                              </div>
                              <h3 className="text-lg font-bold text-text-dark mb-2">
                                {isRtl && featuredEvent.titleAr ? featuredEvent.titleAr : featuredEvent.title}
                              </h3>
                              <p className="text-text-gray text-sm mb-3 leading-relaxed line-clamp-2">
                                {isRtl && featuredEvent.descriptionAr ? featuredEvent.descriptionAr : featuredEvent.description}
                              </p>
                              {/* Registration Deadline */}
                              {featuredEvent.registrationDeadline && (
                                <p className={`text-sm ${isDeadlinePassed ? 'text-red-600' : 'text-orange-600'}`}>
                                  {isDeadlinePassed
                                    ? (t('registrationClosed') || 'Registration Closed')
                                    : `${t('registrationClosesAt') || 'Registration closes on'} ${formatDeadline(featuredEvent.registrationDeadline)}`
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                        </Link>

                        {/* Countdown Timer */}
                        <div className="mt-6 bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                          <p className="text-sm text-text-gray text-center mb-3 font-medium">
                            {t('countdownLabel') || 'Event starts in'}
                          </p>
                          <div className="grid grid-cols-4 gap-2 text-center">
                            <div className="bg-primary/5 rounded-lg p-3">
                              <div className="text-xl sm:text-2xl font-bold text-primary">{countdown.days}</div>
                              <div className="text-xs text-text-gray">{t('days') || 'Days'}</div>
                            </div>
                            <div className="bg-primary/5 rounded-lg p-3">
                              <div className="text-xl sm:text-2xl font-bold text-primary">{countdown.hours}</div>
                              <div className="text-xs text-text-gray">{t('hours') || 'Hours'}</div>
                            </div>
                            <div className="bg-primary/5 rounded-lg p-3">
                              <div className="text-xl sm:text-2xl font-bold text-primary">{countdown.minutes}</div>
                              <div className="text-xs text-text-gray">{t('minutes') || 'Minutes'}</div>
                            </div>
                            <div className="bg-primary/5 rounded-lg p-3">
                              <div className="text-xl sm:text-2xl font-bold text-primary">{countdown.seconds}</div>
                              <div className="text-xs text-text-gray">{t('seconds') || 'Seconds'}</div>
                            </div>
                          </div>

                          {/* Register Button */}
                          <div className="mt-4">
                            {isRegistered ? (
                              <button
                                disabled
                                className="w-full bg-gray-200 text-gray-600 py-3 px-6 rounded-lg font-semibold cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                <CheckCircleIcon className="w-5 h-5" />
                                {t('alreadyRegistered') || 'Already Registered'}
                              </button>
                            ) : isDeadlinePassed ? (
                              <button
                                disabled
                                className="w-full bg-gray-200 text-gray-600 py-3 px-6 rounded-lg font-semibold cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                {t('registrationClosed') || 'Registration Closed'}
                              </button>
                            ) : (
                              <button
                                onClick={handleRegister}
                                disabled={isRegistering}
                                className="w-full bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                {isRegistering ? (
                                  <>
                                    <SpinnerIcon className="animate-spin h-5 w-5" />
                                    {t('registering') || 'Registering...'}
                                  </>
                                ) : (
                                  t('registerNow') || 'Register Now'
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full">
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                          <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100">
                            <CalendarIcon className="w-4 h-4 text-primary" />
                            <span className="text-xs font-medium text-text-gray">
                              {commonT('upcomingEvent')}
                            </span>
                          </div>
                          <div className="flex flex-col items-center justify-center py-16 px-6">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-primary/10">
                              <CalendarIcon className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold text-text-dark mb-2">
                              {eventsT('comingSoon')}
                            </h3>
                            <p className="text-text-gray text-center text-sm">
                              {eventsT('comingSoonDesc')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
        </div>
      </div>
    </Section>
  )
}

export default memo(JoinMovement)
