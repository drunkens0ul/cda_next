'use client'

import { memo, useState } from 'react'
import { useTranslations } from 'next-intl'
import Section from './Section'
import type { Pillar } from '@/lib/types'
import Image from 'next/image'

function StrategicMission() {
  const t = useTranslations('mission')
  const commonT = useTranslations('common')
  const [selectedPillar, setSelectedPillar] = useState(0)

  const pillars: (Pillar & { image: string })[] = [
    {
      title: t('pillar1Title'),
      description: t('pillar1Desc'),
      image: '/assets/edit_section.jpg',
    },
    {
      title: t('pillar2Title'),
      description: t('pillar2Desc'),
      image: '/assets/hero.jpg',
    },
    {
      title: t('pillar3Title'),
      description: t('pillar3Desc'),
      image: '/assets/event1.jpg',
    },
    {
      title: t('pillar4Title'),
      description: t('pillar4Desc'),
      image: '/assets/event2.jpg',
    },
  ]

  return (
    <Section variant="blue" className="pt-16 sm:pt-24 pb-0">
      <div className="mb-12">
        <span className="inline-block text-sm font-semibold uppercase tracking-wide mb-3 text-yellow">
          {t('label')}
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-white mb-8">
          {t('title')}
        </h2>
        <p className="text-white text-lg leading-relaxed opacity-80 max-w-2xl">
          {t('description')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="relative space-y-0">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/20 rounded-full"></div>
          {pillars.map((pillar, index) => (
            <div
              key={index}
              onClick={() => setSelectedPillar(index)}
              className="pl-6 py-4 cursor-pointer relative transition-all duration-500 ease-in-out"
            >
              {selectedPillar === index && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow rounded-full transition-all duration-500 ease-in-out"></div>
              )}
              <h3
                className={`font-bold text-xl mb-2 transition-all duration-500 ease-in-out ${
                  selectedPillar === index ? 'text-yellow' : 'text-white'
                }`}
              >
                {pillar.title}
              </h3>
              <p
                className={`leading-relaxed text-base transition-all duration-500 ease-in-out ${
                  selectedPillar === index
                    ? 'text-white opacity-100'
                    : 'text-white opacity-60'
                }`}
              >
                {pillar.description}
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <div className="relative w-full max-w-md aspect-[4/5] overflow-hidden rounded-3xl shadow-2xl">
            <Image
              src={pillars[selectedPillar].image}
              alt={commonT('strategicMission')}
              fill
              className="object-cover transition-all duration-500"
            />
          </div>
        </div>
      </div>
    </Section>
  )
}

export default memo(StrategicMission)
