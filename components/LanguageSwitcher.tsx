'use client'

import { memo } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LanguageIcon } from './icons'

function LanguageSwitcher() {
  const pathname = usePathname()

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ar', name: 'العربية' },
  ]

  const currentLocale = pathname.split('/')[1] || 'en'

  const getSwitchedPath = (targetLang: string) => {
    const segments = pathname.split('/')
    segments[1] = targetLang
    return segments.join('/')
  }

  return (
    <div className="flex items-center gap-1">
      <LanguageIcon className="w-5 h-5 text-text-gray" />
      {languages.map((lang, index) => (
        <div key={lang.code} className="flex items-center">
          <Link
            href={getSwitchedPath(lang.code)}
            className={`text-sm font-medium transition-colors ${currentLocale === lang.code
                ? 'underline text-primary-800'
                : 'text-text-gray hover:text-primary-800'
              }`}
          >
            {lang.name}
          </Link>
          {index < languages.length - 1 && (
            <span className="mx-1 text-gray-400">|</span>
          )}
        </div>
      ))}
    </div>
  )
}

export default memo(LanguageSwitcher)
