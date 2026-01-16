'use client'
import { memo } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'

function Hero() {
  const commonT = useTranslations('common')

  return (
    <section className="relative w-full pt-4 md:pt-6 bg-light-blue hidden md:block">
      <div className="relative w-full h-[60vh] md:h-[70vh] lg:h-[80vh] xl:h-[85vh] 2xl:h-[90vh]">
        <Image
          src="/assets/DCSL-CDA-Media_2.jpg"
          alt={commonT('buildingInclusiveFuture')}
          fill
          priority
          className="object-cover object-center"
        />
      </div>
    </section>
  )
}

export default memo(Hero)