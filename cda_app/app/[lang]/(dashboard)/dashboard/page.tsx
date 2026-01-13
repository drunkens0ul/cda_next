'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { UserIcon, CalendarIcon, ClockIcon, VideoIcon } from '@/components/icons'

// Mock data for demonstration
const mockUser = {
  name: 'Rahim',
  email: 'rahim@example.com'
}

const mockEvents = {
  upcoming: [
    {
      id: '1',
      title: 'Tech Innovation Summit',
      description: 'The Tech Innovation Summit 2024 brings together the brightest minds in technology to discuss emerging trends, share insights, and explore the future of...',
      date: 'January 15, 2026',
      time: '9:00 AM - 5:00 PM PST',
      location: 'Virtual Event (Microsoft Teams)',
      image: '/assets/dashboard-event.jpg',
      daysToGo: 24,
      isVirtual: true,
      canJoin: true,
      canCancel: true,
      canSurvey: false,
      canCertificate: false
    }
  ],
  past: []
}

export default function DashboardPage() {
  const t = useTranslations('dashboard')
  const commonT = useTranslations('common')
  const params = useParams()
  const lang = params.lang as string
  
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="container-custom py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link href={`/${lang}`} className="flex items-center gap-3">
              <Image 
                src="/assets/logo.png" 
                alt={commonT('logo')} 
                width={48} 
                height={48}
                className="h-12 w-auto"
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
              
              <button className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors">
                <UserIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-custom py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {t('hello')} {mockUser.name}
          </h1>
          <p className="text-gray-600">
            {t('welcomeMessage')}
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-12 mb-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">{t('upcomingEvent')}</p>
            <p className="text-4xl font-bold text-gray-900">
              {String(mockEvents.upcoming.length).padStart(2, '0')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">{t('pastEvents')}</p>
            <p className="text-4xl font-bold text-gray-900">
              {mockEvents.past.length}
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
          {activeTab === 'upcoming' && mockEvents.upcoming.length > 0 && (
            mockEvents.upcoming.map((event) => (
              <div key={event.id} className="border border-gray-200 rounded-xl p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  {/* Event Image */}
                  <div className="w-full sm:w-32 h-48 sm:h-24 relative rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={event.image}
                      alt={event.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Event Details */}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{event.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{event.description}</p>
                    
                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <CalendarIcon className="w-4 h-4 text-primary" />
                        {event.date}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="flex items-center gap-1.5">
                        <ClockIcon className="w-4 h-4" />
                        {event.time}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="flex items-center gap-1.5">
                        {event.isVirtual ? (
                          <VideoIcon className="w-4 h-4 text-primary" />
                        ) : (
                          <VideoIcon className="w-4 h-4" />
                        )}
                        {event.location}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                  {/* Days to go */}
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-gray-900">{event.daysToGo}</span>
                    <span className="text-sm text-gray-500">{t('daysToGo')}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {event.canJoin && (
                      <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
                        {t('joinEvent')}
                      </button>
                    )}
                    {event.canCancel && (
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                        {t('cancelRegistration')}
                      </button>
                    )}
                    <button 
                      disabled={!event.canSurvey}
                      className="px-4 py-2 border border-gray-200 text-gray-400 rounded-lg text-sm font-medium disabled:cursor-not-allowed"
                    >
                      {t('takeSurvey')}
                    </button>
                    <button 
                      disabled={!event.canCertificate}
                      className="px-4 py-2 border border-gray-200 text-gray-400 rounded-lg text-sm font-medium disabled:cursor-not-allowed"
                    >
                      {t('downloadCertificate')}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {activeTab === 'upcoming' && mockEvents.upcoming.length === 0 && (
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

          {activeTab === 'past' && mockEvents.past.length === 0 && (
            <div className="text-center py-12">
              <ClockIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noPastEvents')}</h3>
              <p className="text-gray-600">{t('noPastEventsDesc')}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
