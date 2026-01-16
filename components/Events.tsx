'use client'

import { memo, useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRightIcon, XIcon, UsersIcon, SpinnerIcon } from './icons'
import { formatEventTimeGST, formatDateInGST } from '@/lib/time'
import type { EventWithRegistrationCount } from '@/lib/types/events'
import { defaultLocale } from '@/i18n/config'

function Events() {
  const t = useTranslations('events')
  const params = useParams()
  const locale = useLocale()
  const lang = params.lang as string || defaultLocale
  const isRtl = locale === 'ar'

  const [events, setEvents] = useState<EventWithRegistrationCount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    async function fetchEvents() {
      try {
        setHasError(false)
        const response = await fetch('/api/events')
        const data = await response.json()
        if (data.success && data.events) {
          setEvents(data.events)
        } else {
          setHasError(true)
        }
      } catch (error) {
        console.error('Failed to fetch events:', error)
        setHasError(true)
      } finally {
        setIsLoading(false)
      }
    }
    fetchEvents()
  }, [])

  // Format date for display in GST
  const formatDate = (date: Date | string) => {
    return formatDateInGST(date, isRtl ? 'ar-AE' : 'en-US')
  }

  return (
    <section id="events" className="section-padding bg-white">
      <div className="container-custom">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="section-label text-primary">{t('label')}</span>
            <h2 className="section-heading text-text-dark">{t('title')}</h2>
          </div>
          <button className="hidden sm:flex items-center gap-2 text-text-gray hover:text-primary transition-colors font-medium">
            {t('viewAll')}
            <ArrowRightIcon className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <SpinnerIcon className="animate-spin h-8 w-8 text-primary" />
          </div>
        ) : hasError ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-text-dark mb-2">{t('errorLoading')}</h3>
            <p className="text-text-gray text-center max-w-md">{t('errorLoadingDesc')}</p>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-text-dark mb-2">{t('comingSoon')}</h3>
            <p className="text-text-gray text-center max-w-md">{t('comingSoonDesc')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.slice(0, 3).map((event) => {
              const title = isRtl && event.titleAr ? event.titleAr : event.title
              const description = isRtl && event.descriptionAr ? event.descriptionAr : event.description

              return (
                <Link
                  key={event.id}
                  href={`/${lang}/event/${event.slug}`}
                  className="block bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="relative overflow-hidden rounded-t-2xl h-56">
                    <div className="absolute top-4 left-4 z-10">
                      <div className={`text-xs font-semibold px-2 py-1 rounded ${
                        event.isVirtual
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {event.isVirtual ? t('virtualEvent') : t('inPersonEvent')}
                      </div>
                    </div>
                    <Image
                      src={event.imageUrl || '/assets/event1.jpg'}
                      alt={title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-5">
                    <div className="text-primary text-sm font-medium mb-3">
                      {formatEventTimeGST(event.date, event.startTime)} &nbsp;•&nbsp; {formatDate(event.date)}
                    </div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="text-lg font-bold text-text-dark flex-1">
                        {title}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          window.open(`/${lang}/event/${event.slug}`, '_blank', 'noopener,noreferrer')
                        }}
                        className="hover:text-primary transition-colors cursor-pointer"
                      >
                        <XIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      </button>
                    </div>
                    <p className="text-text-gray text-sm mb-4 leading-relaxed line-clamp-2">
                      {description}
                    </p>
                    <div className="flex items-center gap-1.5 text-text-gray">
                      <UsersIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {event.registrationCount}+ {t('attendees')}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        <div className="text-center mt-8 sm:hidden">
          <button className="w-full flex items-center justify-center gap-2 text-text-dark hover:text-primary transition-colors font-semibold border-2 border-gray-200 rounded-lg px-4 py-2 bg-white hover:bg-gray-50">
            {t('viewAll')}
            <ArrowRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  )
}

export default memo(Events)
