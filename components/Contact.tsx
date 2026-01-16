'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import Section from './Section'
import { SupportIcon } from './icons'

function Contact() {
  const t = useTranslations('contact')

  return (
    <Section id="contact">
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <SupportIcon className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-text-dark mb-4">
          {t('title')}
        </h2>
        <p className="text-text-gray mb-6">
          {t('description')}
        </p>
        <a
          href="mailto:dcslsupport@cda.gov.ae"
          className="inline-flex items-center gap-2 text-primary hover:text-primary-700 font-medium text-lg transition-colors"
        >
          <SupportIcon className="w-5 h-5" />
          dcslsupport@cda.gov.ae
        </a>
      </div>
    </Section>
  )
}

export default memo(Contact)
