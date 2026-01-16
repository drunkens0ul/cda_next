'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { sponsors } from '@/lib/sponsors'
import Section from './Section'
import Image from 'next/image'

function Sponsors() {
  const t = useTranslations('sponsors')
  const commonT = useTranslations('common')

  // Duplicate sponsors array for seamless looping
  const duplicatedSponsors = [...sponsors, ...sponsors]

  return (
    <Section id="sponsors">
      <h2 className="text-center text-xl sm:text-2xl font-semibold text-text-gray mb-12">
        {t('title')}
      </h2>
      <div className="overflow-hidden relative">
        <div className="animate-scroll flex gap-8 lg:gap-12 items-center hover:[animation-play-state:paused]">
          {duplicatedSponsors.map((sponsor, index) => (
            <div key={`${sponsor.id}-${index}`} className="flex items-center justify-center flex-shrink-0 transition-transform hover:scale-110">
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
      </div>
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll 20s linear infinite;
        }
      `}</style>
    </Section>
  )
}

export default memo(Sponsors)
