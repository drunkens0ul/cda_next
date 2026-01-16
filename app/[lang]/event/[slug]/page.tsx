'use client'

import { memo, useState, useEffect, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import RegistrationProgress from '@/components/RegistrationProgress'
import {
  CalendarIcon,
  ClockIcon,
  LocationIcon,
  UsersIcon,
  CheckCircleIcon,
  // ShareIcon,
  ChevronLeftIcon,
  SpinnerIcon
} from '@/components/icons'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { formatEventTimeGST, formatDateInGST } from '@/lib/time'
import { useAuth } from '@/components/providers/AuthProvider'
import type { EventWithRegistrationCount } from '@/lib/types/events'

function EventDetailPage() {
  const t = useTranslations('eventDetail')
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  const [event, setEvent] = useState<EventWithRegistrationCount | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRegistered, setIsRegistered] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [registrationMessage, setRegistrationMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => {
      window.scrollTo(0, 0)
    })
  }, [])

  // Fetch event data
  useEffect(() => {
    async function fetchEvent() {
      try {
        const response = await fetch(`/api/events/${slug}`)
        const data = await response.json()
        if (data.success && data.event) {
          setEvent(data.event)
        }
      } catch (error) {
        console.error('Failed to fetch event:', error)
      } finally {
        setIsLoading(false)
      }
    }
    if (slug) {
      fetchEvent()
    }
  }, [slug])

  // Check registration status
  useEffect(() => {
    async function checkRegistration() {
      if (!slug) return
      try {
        const response = await fetch(`/api/events/${slug}/registration`, {
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
  }, [slug, isAuthenticated])

  // Check if registration deadline has passed
  useEffect(() => {
    if (!event || !event.registrationDeadline) {
      setIsDeadlinePassed(false)
      return
    }

    const checkDeadline = () => {
      const deadline = new Date(event.registrationDeadline as Date)
      const now = new Date()
      setIsDeadlinePassed(now >= deadline)
    }

    checkDeadline()
    // Check every minute since we're not showing countdown
    const interval = setInterval(checkDeadline, 60000)

    return () => clearInterval(interval)
  }, [event])

  // Handle registration
  const handleRegister = useCallback(async () => {
    if (!isAuthenticated) {
      // Redirect to login with returnTo
      const returnUrl = `/${locale}/event/${slug}?action=register`
      router.push(`/${locale}/login?returnTo=${encodeURIComponent(returnUrl)}`)
      return
    }

    setIsRegistering(true)
    setRegistrationMessage(null)

    try {
      const response = await fetch(`/api/events/${slug}/register`, {
        method: 'POST',
        credentials: 'include'
      })
      const data = await response.json()

      if (data.success) {
        setIsRegistered(true)
        setRegistrationMessage({ type: 'success', text: t('registrationSuccess') })
        // Refresh event data to update count
        const eventResponse = await fetch(`/api/events/${slug}`)
        const eventData = await eventResponse.json()
        if (eventData.success && eventData.event) {
          setEvent(eventData.event)
        }
      } else {
        setRegistrationMessage({ type: 'error', text: data.message || t('registrationFailed') })
      }
    } catch (error) {
      console.error('Registration error:', error)
      setRegistrationMessage({ type: 'error', text: t('registrationFailed') })
    } finally {
      setIsRegistering(false)
    }
  }, [isAuthenticated, locale, slug, router, t])

  // Check for returnTo action parameter (redirect back after login)
  useEffect(() => {
    const action = searchParams.get('action')

    if (action === 'register' && isAuthenticated && !isRegistered && event && !authLoading) {
      handleRegister()
      // Clean up URL
      window.history.replaceState({}, '', `/${locale}/event/${slug}`)
    }
  }, [isAuthenticated, isRegistered, event, authLoading, handleRegister, locale, slug, searchParams])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <SpinnerIcon className="animate-spin h-8 w-8 text-primary" />
      </div>
    )
  }

  // Event not found
  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container-custom py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('eventNotFound')}</h1>
          <Link href={`/${locale}`} className="text-primary hover:text-primary-700">
            {t('backToHome')}
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  // Use locale-specific data
  const eventTitle = isRtl && event.titleAr ? event.titleAr : event.title
  const eventDescription = isRtl && event.descriptionAr ? event.descriptionAr : event.description
  const eventLocation = isRtl && event.locationAr ? event.locationAr : event.location

  // Format date in GST
  const eventDate = formatDateInGST(event.date, isRtl ? 'ar-AE' : 'en-US')

  // Format time range in GST
  const eventTime = event.startTime
    ? `${formatEventTimeGST(event.date, event.startTime)}${event.endTime ? ` - ${formatEventTimeGST(event.date, event.endTime)}` : ''}`
    : ''

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

  // Sample data for speakers and agenda (can be extended with database fields later)
  const speakers = [
    { name: 'Sara Chen', role: 'CTO, Tech Ventures', image: '/assets/event1.jpg' },
    { name: 'Ahmed Al-Rashid', role: 'Director, Innovation Hub', image: '/assets/event2.jpg' },
    { name: 'Maria Santos', role: 'Lead Researcher', image: '/assets/event3.jpg' },
  ]

  const agenda = [
    { time: event.startTime ? formatEventTimeGST(event.date, event.startTime) : 'TBD', title: t('openingKeynote'), description: t('openingDescription') },
    { time: '10:30 AM', title: t('workshopSession'), description: t('workshopDescription') },
    { time: '12:00 PM', title: t('networkingLunch'), description: t('lunchDescription') },
    { time: '2:00 PM', title: t('panelDiscussion'), description: t('panelDescription') },
    { time: event.endTime ? formatEventTimeGST(event.date, event.endTime) : 'TBD', title: t('closingRemarks'), description: t('closingDescription') },
  ]

  const benefits = [
    t('benefit1'),
    // t('benefit2'),
    // t('benefit3'),
    t('benefit4'),
    // t('benefit5'),
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main>
        {/* Hero Section with Image - Full Width */}
        <div className="relative">
          {/* Back Button - positioned absolutely */}
          <Link
            href={`/${locale}`}
            className="inline-flex items-center justify-center w-10 h-10 text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-colors absolute top-6 left-6 z-20"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </Link>

          {/* Hero Image - Full Width */}
          <div className="relative h-[350px] md:h-[450px] lg:h-[500px] w-full overflow-hidden">
            <Image
              src={event.imageUrl || '/assets/event1.jpg'}
              alt={eventTitle}
              fill
              className="object-cover"
              priority
            />
            {/* Fade effect at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50 to-transparent" />
          </div>
        </div>

        {/* Content Section */}
        <div className="container-custom -mt-24 relative z-10 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Event Info Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-text-dark mb-6">
                  {eventTitle}
                </h1>

                <div className="prose prose-gray max-w-none">
                  {eventDescription?.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="text-text-gray leading-relaxed mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              {/* Featured Speakers */}
              {/* <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                <h2 className="text-xl md:text-2xl font-bold text-text-dark mb-6">
                  {t('featuredSpeakers')}
                </h2>

                <div className="flex flex-wrap gap-8">
                  {speakers.map((speaker, index) => (
                    <div key={index} className="flex flex-col items-center text-center">
                      <div className="relative w-20 h-20 rounded-full overflow-hidden mb-3 ring-2 ring-gray-100">
                        <Image
                          src={speaker.image}
                          alt={speaker.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <h3 className="font-semibold text-text-dark">{speaker.name}</h3>
                      <p className="text-sm text-text-gray">{speaker.role}</p>
                    </div>
                  ))}
                </div>
              </div> */}

              {/* Event Agenda */}
              {/* <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                <h2 className="text-xl md:text-2xl font-bold text-text-dark mb-6">
                  {t('eventAgenda')}
                </h2>

                <div className="space-y-4">
                  {agenda.map((item, index) => (
                    <div key={index} className="flex gap-4 items-start">
                      <span className="text-primary font-bold min-w-[80px]">{item.time}</span>
                      <div>
                        <h3 className="font-semibold text-text-dark">{item.title}</h3>
                        <p className="text-sm text-text-gray">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div> */}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-32">
                {/* Event Details */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3 text-text-gray">
                    <CalendarIcon className="w-5 h-5 text-primary" />
                    <span className="font-medium">{eventDate}</span>
                  </div>
                  {eventTime && (
                    <div className="flex items-center gap-3 text-text-gray">
                      <ClockIcon className="w-5 h-5 text-primary" />
                      <span>{eventTime}</span>
                    </div>
                  )}
                  {eventLocation && (
                    <div className="flex items-center gap-3 text-text-gray">
                      <LocationIcon className="w-5 h-5 text-primary" />
                      <span>{eventLocation}</span>
                    </div>
                  )}
                </div>

                {/* Registration Progress - spots left commented out */}
                {/* {event.spotsLeft !== null ? (
                  <div className="py-4 border-t border-b border-gray-100 mb-6">
                    <RegistrationProgress
                      registered={event.registrationCount || 0}
                      spotsLeft={event.spotsLeft}
                      locale={locale}
                    />
                  </div>
                ) : ( */}
                  <div className="flex items-center gap-2 py-4 border-t border-b border-gray-100 mb-6 text-text-gray">
                    <UsersIcon className="w-5 h-5" />
                    <span className="text-sm">{event.registrationCount || 0} {t('registered')}</span>
                  </div>
                {/* )} */}

                {/* Registration Deadline Message */}
                {event.registrationDeadline && (
                  <div className={`mb-4 p-3 rounded-lg text-center text-sm font-medium ${
                    isDeadlinePassed
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-orange-50 text-orange-700 border border-orange-200'
                  }`}>
                    {isDeadlinePassed
                      ? (t('registrationClosed') || 'Registration Closed')
                      : `${t('registrationClosesAt') || 'Registration closes on'} ${formatDeadline(event.registrationDeadline)}`
                    }
                  </div>
                )}

                {/* Registration Message */}
                {registrationMessage && (
                  <div className={`mb-4 p-3 rounded-lg text-sm ${
                    registrationMessage.type === 'success'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {registrationMessage.text}
                  </div>
                )}

                {/* Register Button */}
                {isRegistered ? (
                  <button
                    disabled
                    className="w-full bg-gray-200 text-gray-600 py-3 px-6 rounded-lg font-semibold cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <CheckCircleIcon className="w-5 h-5" />
                    {t('alreadyRegistered')}
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
                    disabled={isRegistering || event.status !== 'upcoming' || (event.spotsLeft !== null && event.spotsLeft <= 0)}
                    className="w-full bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isRegistering ? (
                      <>
                        <SpinnerIcon className="animate-spin h-5 w-5" />
                        {t('registering')}
                      </>
                    ) : (
                      t('registerNow')
                    )}
                  </button>
                )}

                {/* Join Event Button - shown when registered and join is enabled */}
                {isRegistered && event.showJoinButton && event.meetingUrl && (
                  <a
                    href={event.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 mt-4"
                  >
                    {t('joinEvent') || 'Join Event'}
                  </a>
                )}

                {/* Join Button Disabled - no meeting link yet */}
                {isRegistered && event.showJoinButton && !event.meetingUrl && (
                  <button
                    disabled
                    className="w-full bg-gray-200 text-gray-500 py-3 px-6 rounded-lg font-semibold cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                  >
                    {t('meetingLinkComingSoon') || 'Meeting link coming soon'}
                  </button>
                )}

                {/* Share Button */}
                {/* <button className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-text-gray py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition-colors mt-4">
                  <ShareIcon className="w-5 h-5" />
                  {t('shareEvent')}
                </button> */}

                {/* What You'll Get */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="font-semibold text-text-dark mb-4">{t('whatYouGet')}</h3>
                  <div className="space-y-3">
                    {benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircleIcon className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-sm text-text-gray">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default memo(EventDetailPage)