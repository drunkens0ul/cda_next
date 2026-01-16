'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { CalendarIcon, ClockIcon, VideoIcon, SpinnerIcon, LocationIcon } from '@/components/icons'
import { useAuth } from '@/components/providers/AuthProvider'
import UserDropdown from '@/components/UserDropdown'
import { formatDateTimeDisplay, formatEventTime, getDaysUntilEvent } from '@/lib/time'
import type { EventRegistrationWithEvent } from '@/lib/types/events'

export default function DashboardPage() {
  const t = useTranslations('dashboard')
  const authT = useTranslations('auth')
  const commonT = useTranslations('common')
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const lang = params.lang as string
  const isRtl = locale === 'ar'
  const { user, updateProfile, isLoading: authLoading } = useAuth()

  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')
  const [registrations, setRegistrations] = useState<EventRegistrationWithEvent[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || ''
  })
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Fetch user registrations
  useEffect(() => {
    async function fetchRegistrations() {
      try {
        const response = await fetch('/api/user/registrations', {
          credentials: 'include'
        })
        const data = await response.json()
        if (data.success && data.registrations) {
          setRegistrations(data.registrations)
        }
      } catch (error) {
        console.error('Failed to fetch registrations:', error)
      } finally {
        setIsLoadingEvents(false)
      }
    }
    fetchRegistrations()
  }, [])

  // Filter events by upcoming/past
  // Compare using the start of today in UTC to avoid timezone issues
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  
  const upcomingEvents = registrations.filter(r => {
    // Parse the event date and set to start of day in UTC for consistent comparison
    const eventDate = new Date(r.event.date)
    eventDate.setUTCHours(0, 0, 0, 0)
    return eventDate >= today
  })
  const pastEvents = registrations.filter(r => {
    const eventDate = new Date(r.event.date)
    eventDate.setUTCHours(0, 0, 0, 0)
    return eventDate < today
  })

  // Update form when user data loads
  if (user && !profileForm.firstName && !isEditingProfile) {
    setProfileForm({
      firstName: user.firstName,
      lastName: user.lastName || ''
    })
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)
    setProfileMessage(null)

    const success = await updateProfile(profileForm.firstName, profileForm.lastName)

    if (success) {
      setProfileMessage({ type: 'success', text: authT('profileUpdated') || 'Profile updated successfully' })
      setIsEditingProfile(false)
    } else {
      setProfileMessage({ type: 'error', text: authT('somethingWentWrong') || 'Something went wrong' })
    }

    setIsSavingProfile(false)
  }

  // Format date for display
  const formatDate = (date: Date | string) => {
    return formatDateTimeDisplay(date, isRtl ? 'ar-AE' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <SpinnerIcon className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="container-custom py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
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

            {/* Right Side */}
            <div className="flex items-center gap-4">
              <Link
                href={`/${lang}#events`}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                {t('exploreEvents')}
              </Link>

              <UserDropdown />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-custom py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {t('hello')} {user?.firstName || 'User'}
          </h1>
          <p className="text-gray-600">
            {t('welcomeMessage')}
          </p>
        </div>

        {/* Profile Section */}
        <div className="mb-8 bg-gray-50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('profile') || 'Profile'}
            </h2>
            {!isEditingProfile && (
              <button
                onClick={() => setIsEditingProfile(true)}
                className="text-sm text-primary hover:text-primary-700 font-medium"
              >
                {t('editProfile') || 'Edit Profile'}
              </button>
            )}
          </div>

          {profileMessage && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              profileMessage.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {profileMessage.text}
            </div>
          )}

          {isEditingProfile ? (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    {authT('firstName') || 'First Name'}
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    {authT('lastName') || 'Last Name'}
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  {authT('email') || 'Email'}
                </label>
                <input
                  type="email"
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {t('emailReadOnly') || 'Email cannot be changed'}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-70 flex items-center gap-2"
                >
                  {isSavingProfile && <SpinnerIcon className="w-4 h-4 animate-spin" />}
                  {t('saveChanges') || 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingProfile(false)
                    setProfileForm({
                      firstName: user?.firstName || '',
                      lastName: user?.lastName || ''
                    })
                    setProfileMessage(null)
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  {commonT('cancel') || 'Cancel'}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">{authT('firstName') || 'First Name'}</p>
                <p className="font-medium text-gray-900">{user?.firstName || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{authT('lastName') || 'Last Name'}</p>
                <p className="font-medium text-gray-900">{user?.lastName || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{authT('email') || 'Email'}</p>
                <p className="font-medium text-gray-900">{user?.email || '-'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-12 mb-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">{t('upcomingEvent')}</p>
            <p className="text-4xl font-bold text-gray-900">
              {isLoadingEvents ? '-' : String(upcomingEvents.length).padStart(2, '0')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">{t('pastEvents')}</p>
            <p className="text-4xl font-bold text-gray-900">
              {isLoadingEvents ? '-' : pastEvents.length}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`pb-3 relative font-medium ${
                activeTab === 'upcoming'
                  ? 'text-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                {t('upcoming')}
              </span>
              {activeTab === 'upcoming' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`pb-3 relative font-medium ${
                activeTab === 'past'
                  ? 'text-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <ClockIcon className="w-5 h-5" />
                {t('past')}
              </span>
              {activeTab === 'past' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          </div>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {isLoadingEvents ? (
            <div className="flex justify-center py-12">
              <SpinnerIcon className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {activeTab === 'upcoming' && upcomingEvents.length > 0 && (
                upcomingEvents.map((registration) => {
                  const event = registration.event
                  const title = isRtl && event.titleAr ? event.titleAr : event.title
                  const description = isRtl && event.descriptionAr ? event.descriptionAr : event.description
                  const location = isRtl && event.locationAr ? event.locationAr : event.location
                  const daysToGo = getDaysUntilEvent(event.date, event.startTime)
                  const eventTime = event.startTime
                    ? `${formatEventTime(event.date, event.startTime, isRtl ? 'ar-AE' : 'en-US')}${event.endTime ? ` - ${formatEventTime(event.date, event.endTime, isRtl ? 'ar-AE' : 'en-US')}` : ''}`
                    : ''

                  return (
                    <div
                      key={registration.id}
                      onClick={() => router.push(`/${lang}/event/${event.slug}`)}
                      className="block border border-gray-200 rounded-xl p-4 sm:p-6 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        {/* Event Image */}
                        <div className="w-full sm:w-32 h-48 sm:h-24 relative rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={event.imageUrl || '/assets/event1.jpg'}
                            alt={title}
                            fill
                            className="object-cover"
                          />
                        </div>

                        {/* Event Details */}
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{description}</p>

                          {/* Meta Info */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1.5">
                              <CalendarIcon className="w-4 h-4 text-primary" />
                              {formatDate(event.date)}
                            </span>
                            {eventTime && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="flex items-center gap-1.5">
                                  <ClockIcon className="w-4 h-4" />
                                  {eventTime}
                                </span>
                              </>
                            )}
                            {location && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="flex items-center gap-1.5">
                                  {event.isVirtual ? (
                                    <VideoIcon className="w-4 h-4 text-primary" />
                                  ) : (
                                    <LocationIcon className="w-4 h-4" />
                                  )}
                                  {location}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                        {/* Days to go */}
                        <div className="flex items-center gap-2">
                          <span className="text-3xl font-bold text-gray-900">{daysToGo}</span>
                          <span className="text-sm text-gray-500">{t('daysToGo')}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                          {event.showJoinButton && event.meetingUrl && (
                            <a
                              href={event.meetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {t('joinEvent')}
                            </a>
                          )}
                          {event.showJoinButton && !event.meetingUrl && (
                            <button
                              disabled
                              className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed"
                            >
                              {t('joiningSoon') || 'Join link coming soon'}
                            </button>
                          )}
                          <button
                            disabled
                            className="px-4 py-2 border border-gray-200 text-gray-400 rounded-lg text-sm font-medium disabled:cursor-not-allowed"
                          >
                            {t('takeSurvey')}
                          </button>
                          <button
                            disabled
                            className="px-4 py-2 border border-gray-200 text-gray-400 rounded-lg text-sm font-medium disabled:cursor-not-allowed"
                          >
                            {t('downloadCertificate')}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}

              {activeTab === 'upcoming' && upcomingEvents.length === 0 && (
                <div className="text-center py-12">
                  <CalendarIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noUpcomingEvents')}</h3>
                  <p className="text-gray-600 mb-4">{t('noUpcomingEventsDesc')}</p>
                  <Link
                    href={`/${lang}#events`}
                    className="inline-block px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                  >
                    {t('exploreEvents')}
                  </Link>
                </div>
              )}

              {activeTab === 'past' && pastEvents.length > 0 && (
                pastEvents.map((registration) => {
                  const event = registration.event
                  const title = isRtl && event.titleAr ? event.titleAr : event.title
                  const description = isRtl && event.descriptionAr ? event.descriptionAr : event.description
                  const location = isRtl && event.locationAr ? event.locationAr : event.location

                  return (
                    <div
                      key={registration.id}
                      onClick={() => router.push(`/${lang}/event/${event.slug}`)}
                      className="block border border-gray-200 rounded-xl p-4 sm:p-6 hover:border-primary/50 hover:shadow-md transition-all opacity-75 cursor-pointer"
                    >
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        {/* Event Image */}
                        <div className="w-full sm:w-32 h-48 sm:h-24 relative rounded-lg overflow-hidden flex-shrink-0 grayscale">
                          <Image
                            src={event.imageUrl || '/assets/event1.jpg'}
                            alt={title}
                            fill
                            className="object-cover"
                          />
                        </div>

                        {/* Event Details */}
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{description}</p>

                          {/* Meta Info */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1.5">
                              <CalendarIcon className="w-4 h-4" />
                              {formatDate(event.date)}
                            </span>
                            {location && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="flex items-center gap-1.5">
                                  {event.isVirtual ? (
                                    <VideoIcon className="w-4 h-4" />
                                  ) : (
                                    <LocationIcon className="w-4 h-4" />
                                  )}
                                  {location}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          disabled
                          className="px-4 py-2 border border-gray-200 text-gray-400 rounded-lg text-sm font-medium disabled:cursor-not-allowed"
                        >
                          {t('takeSurvey')}
                        </button>
                        <button
                          disabled
                          className="px-4 py-2 border border-gray-200 text-gray-400 rounded-lg text-sm font-medium disabled:cursor-not-allowed"
                        >
                          {t('downloadCertificate')}
                        </button>
                      </div>
                    </div>
                  )
                })
              )}

              {activeTab === 'past' && pastEvents.length === 0 && (
                <div className="text-center py-12">
                  <ClockIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noPastEvents')}</h3>
                  <p className="text-gray-600">{t('noPastEventsDesc')}</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
