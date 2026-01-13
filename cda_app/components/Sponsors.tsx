'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { sponsors } from '@/lib/sponsors'
import Section from './Section'
import Image from 'next/image'

function Sponsors() {
  const t = useTranslations('sponsors')
  const commonT = useTranslations('common')

  return (
    <Section id="sponsors">
      <h2 className="text-center text-xl sm:text-2xl font-semibold text-text-gray mb-12">
        {t('title')}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12 items-center justify-items-center">
        {sponsors.map((sponsor) => (
          <div key={sponsor.id} className="flex items-center justify-center transition-transform hover:scale-110">
            <Image
              src={sponsor.image}
              alt={sponsor.alt || `${commonT('sponsor')} ${sponsor.id}`}
              width={48}
              height={48}
              className="max-h-12 sm:max-h-14 w-auto object-contain grayscale hover:grayscale-0 transition-all"
            />
          </div>
        ))}
      </div>
    </Section>
  )
}

export default memo(Sponsors)
