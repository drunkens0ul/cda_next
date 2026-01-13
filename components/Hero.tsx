'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'

function Hero() {
  const t = useTranslations('hero')
  const commonT = useTranslations('common')

  return (
    <section className="relative w-full bg-light-blue" style={{ padding: '200px 10% 80px 10%' }}>
      <div className="container-custom">
        <div className="max-w-4xl mb-12">
        <h1 className="font-bold leading-tight mb-6" style={{ fontFamily: '"Dubai", sans-serif', fontSize: '60px', fontWeight: 700, lineHeight: '72px', letterSpacing: '-0.02em', marginBottom: '24px', color: '#2F4A5F' }}>
          {t('buildingA')}{' '}
          <span className="relative inline-block">
            {t('inclusive')} {t('dubai')}
            <Image
              src="/underline.svg"
              alt=""
              width={100}
              height={12}
              className="absolute left-0 -bottom-1 w-full h-3"
            />
          </span>
          <br />
          {t('through')}{' '}
          <span className="text-primary-900">{commonT('signLanguage')}</span>
        </h1>
        <p className="text-lg text-gray-800" style={{ maxWidth: '720px' }}>
          {t('subtitle')}
        </p>
        </div>

        <div className="relative rounded-lg overflow-hidden shadow-lg h-[400px] sm:h-[450px] lg:h-[500px]">
          <Image
            src="/assets/hero.jpg"
            alt={commonT('signLanguage')}
            fill
            priority
            className="object-cover object-center"
          />
        </div>
      </div>
    </section>
  )
}

export default memo(Hero)
