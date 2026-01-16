'use client'

import { memo, useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'

function Hero() {
  const t = useTranslations('hero')
  const commonT = useTranslations('common')
  const [currentImage, setCurrentImage] = useState(0)
  
  const heroImages = [
    '/assets/nurse-professional.jpg',
    '/assets/police-officer.jpg',
    '/assets/school-education.jpg'
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative w-full bg-light-blue" style={{ padding: '120px 10% 80px 10%' }}>
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
            src={heroImages[currentImage]}
            alt={commonT('signLanguage')}
            fill
            priority
            className="object-cover object-center transition-opacity duration-1000"
            key={currentImage}
          />
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImage(index)}
                className={`w-2 h-2 rounded-full transition-all ${index === currentImage ? 'bg-white scale-125' : 'bg-white/50'}`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default memo(Hero)
