'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import Section from './Section'
import { PeopleIcon, HandsIcon } from './icons'

function MissionCards() {
  const t = useTranslations('missionCards')

  const cards = [
    {
      icon: <PeopleIcon className="w-[32px] h-[32px] sm:w-[40px] sm:h-[40px]" />,
      title: t('card1Title'),
      description: t('card1Desc'),
    },
    {
      icon: <HandsIcon className="w-[32px] h-[32px] sm:w-[40px] sm:h-[40px]" />,
      title: t('card2Title'),
      description: t('card2Desc'),
    },
  ]

  return (
    <Section variant="blue" className="pt-12 sm:pt-16 pb-24 sm:pb-32">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
        {cards.map((card, index) => (
          <div key={index} className="bg-vision-card bg-opacity-70 backdrop-blur-md rounded-[3rem] p-6 sm:p-10 md:p-14 hover:bg-opacity-80 transition-all border border-white border-opacity-10 shadow-2xl">
              <div className="text-white mb-8">{card.icon}</div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-6">
                {card.title}
              </h3>
              <p className="text-white opacity-90 text-lg leading-relaxed font-light">
                {card.description}
              </p>
            </div>
        ))}
      </div>
    </Section>
  )
}

export default memo(MissionCards)
