'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { events } from '@/lib/events'
import Section from './Section'
import Image from 'next/image'
import { CheckCircleIcon, CalendarIcon, UsersIcon } from './icons'

function JoinMovement() {
  const t = useTranslations('join')
  const commonT = useTranslations('common')

  const benefits = [
    t('benefit1'),
    t('benefit2'),
    t('benefit3'),
    t('benefit4'),
  ]

  return (
    <Section>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
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
          <div className="absolute -top-3 right-6 z-10">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium text-text-gray">
                {commonT('upcomingEvent')}
              </span>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="absolute top-6 left-6 z-10">
              <div className="bg-teal-100 text-teal-800 text-xs font-semibold px-2 py-1 rounded">
                {t('virtualEvent')}
              </div>
            </div>
            <div className="relative h-64">
              <Image
                src={events[0].image}
                alt={commonT('upcomingEvent')}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 text-text-gray text-sm mb-3">
                <CalendarIcon className="w-5 h-5" />
                <span>
                  {events[0].date}
                </span>
              </div>
              <h3 className="text-xl font-bold text-text-dark mb-3">
                {events[0].title}
              </h3>
              <p className="text-text-gray mb-4 leading-relaxed">
                {t('eventDescription')}
              </p>
              <div className="flex items-center gap-2 text-text-gray">
                <UsersIcon className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {events[0].attendees}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}

export default memo(JoinMovement)
