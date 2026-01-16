'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import Section from './Section'
import Image from 'next/image'

function About() {
  const t = useTranslations('about')
  const commonT = useTranslations('common')

  return (
    <Section id="about">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
        <div>
          <span className="section-label">{t('label')}</span>
          <h2 className="section-heading mb-6">
            {t('building')}{' '}
            <span className="text-primary">{t('inclusive')}</span>{' '}
            {t('future')}
          </h2>
          <p className="text-text-gray text-lg leading-relaxed mb-6">
            {t('description1')}
          </p>
          <p className="text-text-gray text-lg leading-relaxed">
            {t('description2')}
          </p>
        </div>
        <div className="relative w-full h-64 sm:h-80 md:h-96 rounded-2xl shadow-lg overflow-hidden">
          <Image
            src="/assets/police-officer.jpg"
            alt={commonT('buildingInclusiveFuture')}
            fill
            className="object-cover"
          />
        </div>
      </div>
    </Section>
  )
}

export default memo(About)
