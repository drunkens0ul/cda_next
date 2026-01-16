'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { MenuIcon } from './icons'
import { useAuth } from './providers/AuthProvider'
import UserDropdown from './UserDropdown'
import { defaultLocale } from '@/i18n/config'

function Header() {
  const t = useTranslations('nav')
  const commonT = useTranslations('common')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { isLoading, isAuthenticated } = useAuth()
  const params = useParams()
  const lang = params.lang as string || defaultLocale
  const isRtl = lang === 'ar'

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navigationLinks = [
    { name: t('events'), href: `/${lang}#join-movement` },
    { name: t('partners'), href: `/${lang}#sponsors` },
    { name: t('about'), href: `/${lang}#about` },
    { name: t('contact'), href: `/${lang}#contact` },
  ]

  return (
    <header className={`sticky top-0 z-50 w-full transition-colors duration-300 ${isScrolled ? 'bg-white shadow-sm' : 'bg-light-blue'}`}>
      <nav className="container-custom">
        <div className="flex justify-between items-center py-4">
          <div className="flex-shrink-0">
            <Link href={`/${lang}`} className={`flex items-center gap-2 sm:gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Image src="/assets/logo.png" alt={commonT('logo')} width={100} height={150} className="h-10 sm:h-14 md:h-16 lg:h-20 w-auto" />
              <div className="hidden sm:block h-8 sm:h-10 w-px bg-gray-300"></div>
              <Image src="/assets/logo_newsvg.svg" alt="Dubai Communicates" width={100} height={56} className="h-7 sm:h-9 md:h-10 lg:h-12 w-auto" />
            </Link>
          </div>

          <div className="hidden lg:flex gap-8 items-center">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-text-gray font-medium hover:text-primary transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {isLoading ? (
              // Loading skeleton
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
            ) : isAuthenticated ? (
              // User is logged in - show avatar dropdown
              <UserDropdown />
            ) : (
              // User is not logged in - show login/signup buttons
              <>
                <Link
                  href={`/${lang}/login`}
                  className="hidden sm:inline-block text-primary-dark hover:text-primary-800 transition-colors px-4 py-2 font-medium"
                >
                  {t('login')}
                </Link>
                <Link
                  href={`/${lang}/signup`}
                  className="hidden lg:inline-block bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                >
                  {t('signup')}
                </Link>
              </>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden text-text-gray p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label={commonT('toggleMenu')}
              aria-expanded={isMobileMenuOpen}
            >
              <MenuIcon isOpen={isMobileMenuOpen} className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white">
          <div className="container-custom py-4">
            <div className="flex flex-col gap-3">
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-text-gray hover:text-primary transition-colors font-medium py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              {!isAuthenticated && (
                <div className="flex flex-col gap-2 pt-3 border-t border-gray-200">
                  <Link
                    href={`/${lang}/login`}
                    className="text-primary-dark hover:text-primary-800 font-medium py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('login')}
                  </Link>
                  <Link
                    href={`/${lang}/signup`}
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium w-full text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('signup')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default memo(Header)
