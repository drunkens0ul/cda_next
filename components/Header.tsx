'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MenuIcon } from './icons'

function Header() {
  const t = useTranslations('nav')
  const commonT = useTranslations('common')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navigationLinks = [
    { name: t('events'), href: '#events' },
    { name: t('partners'), href: '#sponsors' },
    { name: t('about'), href: '#about' },
    { name: t('contact'), href: '#contact' },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div>
        <nav className={`transition-all duration-300 ${isScrolled ? 'bg-white shadow-sm' : ''}`} style={isScrolled ? {} : { backgroundColor: '#EBF5FF' }}>
          <div className="container-custom">
            <div className="flex justify-between items-center py-4">
              <div className="flex-shrink-0">
                <Link href="/">
                  <Image src="/assets/logo.png" alt={commonT('logo')} width={48} height={48} className="h-12 w-auto" />
                </Link>
              </div>

              <div className="hidden lg:flex gap-8 items-center">
                {navigationLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-text-gray font-medium hover:text-primary transition-colors"
                  >
                    {link.name}
                  </a>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="#login"
                  className="hidden sm:inline-block text-primary-dark hover:text-primary-800 transition-colors px-4 py-2 font-medium"
                >
                  {t('login')}
                </a>
                <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium">
                  {t('signup')}
                </button>

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
          </div>
        </nav>

        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="container-custom py-4">
              <div className="flex flex-col gap-3">
                {navigationLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-text-gray hover:text-primary transition-colors font-medium py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </a>
                ))}
                <div className="flex flex-col gap-2 pt-3 border-t border-gray-200 sm:hidden">
                  <a href="#login" className="text-primary-dark hover:text-primary-800 font-medium py-2">
                    {t('login')}
                  </a>
                  <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium w-full">
                    {t('signup')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default memo(Header)
