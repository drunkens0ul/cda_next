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
    { name: t('events'), href: '#join-movement' },
    // { name: t('mediaCenter'), href: '#media' },
  ]

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container-custom py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
          <div className="flex items-center gap-2 sm:gap-4">
            <Image src="/assets/logo.png" alt={commonT('logo')} width={48} height={48} className="h-12 sm:h-14 md:h-16 w-auto" />
            <div className="hidden sm:block h-8 w-px bg-gray-300"></div>
            <Image src="/assets/logo_newsvg.svg" alt="Dubai Communicates" width={48} height={27} className="h-8 sm:h-9 md:h-10 w-auto" />
          </div>
          <div className="flex flex-wrap gap-6">
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
{/* Email subscription - commented out
          <div className="lg:ml-auto">
            <p className="text-sm text-text-gray mb-3 font-medium">
              {t('stayUpToDate')}
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                required
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium disabled:opacity-70 flex items-center gap-2"
              >
                {isSubmitting && <SpinnerIcon className="w-4 h-4 animate-spin" />}
                {t('subscribe')}
              </button>
            </form>
            {message && (
              <p className={`mt-2 text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {message.text}
              </p>
            )}
          </div>
*/}
        </div>
        <div className="border-t border-gray-200 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-text-gray">
              {t('copyright')}
            </p>
{/* Terms, Privacy, Cookies links - commented out
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
*/}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default memo(Footer)
