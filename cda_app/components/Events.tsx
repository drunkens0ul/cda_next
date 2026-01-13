'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { ArrowRightIcon, XIcon, UsersIcon } from './icons'

function Events() {
  const t = useTranslations('events')

  const events = [
    {
      id: 1,
      title: 'Digital Inclusion Summit 2024',
      date: 'March 15, 2024',
      time: '10:00 AM',
      description: 'Join us for a comprehensive discussion on digital accessibility and inclusion strategies.',
      attendees: '250+ attendees',
      image: '/assets/event1.jpg'
    },
    {
      id: 2,
      title: 'Accessibility Workshop',
      date: 'March 22, 2024',
      time: '2:00 PM',
      description: 'Hands-on workshop for implementing web accessibility standards.',
      attendees: '50+ attendees',
      image: '/assets/event2.jpg'
    },
    {
      id: 3,
      title: 'Inclusive Design Conference',
      date: 'April 5, 2024',
      time: '9:00 AM',
      description: 'Explore the latest trends in inclusive design and user experience.',
      attendees: '300+ attendees',
      image: '/assets/event3.jpg'
    }
  ]

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event: { id: number; title: string; date: string; time: string; description: string; attendees: string; image: string }) => (
            <div key={event.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="relative overflow-hidden rounded-t-2xl h-56">
                <div className="absolute top-4 left-4 z-10">
                  <div className="bg-teal-100 text-teal-800 text-xs font-semibold px-2 py-1 rounded">
                    {t('virtualEvent')}
                  </div>
                </div>
                <Image
                  src={event.image}
                  alt={event.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-5">
                <div className="text-primary text-sm font-medium mb-3">
                  {event.time} &nbsp;•&nbsp; {event.date}
                </div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-lg font-bold text-text-dark flex-1">
                    {event.title}
                  </h3>
                  <XIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                </div>
                <p className="text-text-gray text-sm mb-4 leading-relaxed">
                  {event.description}
                </p>
                <div className="flex items-center gap-1.5 text-text-gray">
                  <UsersIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">{event.attendees}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

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
