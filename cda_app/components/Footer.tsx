'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'

function Footer() {
  const t = useTranslations('footer')
  const commonT = useTranslations('common')

  const footerLinks = [
    { name: t('about'), href: '#about' },
    { name: t('partners'), href: '#sponsors' },
    { name: t('events'), href: '#events' },
    { name: t('mediaCenter'), href: '#media' },
  ]

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-center mb-8">
          <div>
            <Image src="/assets/logo.png" alt={commonT('logo')} width={48} height={48} className="h-12 w-auto" />
          </div>
          <div className="flex flex-wrap gap-6 justify-center lg:justify-center">
            {footerLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-text-gray hover:text-primary transition-colors font-medium"
              >
                {link.name}
              </a>
            ))}
          </div>
          <div className="lg:ml-auto">
            <p className="text-sm text-text-gray mb-3 font-medium">
              {t('stayUpToDate')}
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder={t('emailPlaceholder')}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none"
              />
              <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium">
                {t('subscribe')}
              </button>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-text-gray">
              {t('copyright')}
            </p>
            <div className="flex gap-6">
              <a href="#terms" className="text-sm text-text-gray hover:text-primary transition-colors">
                {t('terms')}
              </a>
              <a href="#privacy" className="text-sm text-text-gray hover:text-primary transition-colors">
                {t('privacy')}
              </a>
              <a href="#cookies" className="text-sm text-text-gray hover:text-primary transition-colors">
                {t('cookies')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default memo(Footer)
