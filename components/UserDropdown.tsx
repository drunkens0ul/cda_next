'use client'

import { memo, useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from './providers/AuthProvider'
import { UserIcon, CalendarIcon, SupportIcon, LogoutIcon, UsersIcon } from './icons'
import { defaultLocale } from '@/i18n/config'

function UserDropdown() {
  const { user, logout, isAdmin } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const params = useParams()
  const lang = params.lang as string || defaultLocale
  const t = useTranslations('nav')

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return null

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User icon button - circular outline style */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-primary hover:text-primary transition-colors"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <UserIcon className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute ltr:right-0 rtl:left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
          {/* User info header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 flex-shrink-0">
              <UserIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-gray-900 truncate">{user.fullName}</p>
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              href={`/${lang}/dashboard`}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <CalendarIcon className="w-5 h-5 text-gray-400" />
              <span>{t('eventsDashboard') || 'Events Dashboard'}</span>
            </Link>

            {isAdmin && (
              <Link
                href={`/${lang}/admin/users`}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <UsersIcon className="w-5 h-5 text-gray-400" />
                <span>{t('adminDashboard') || 'Admin Dashboard'}</span>
              </Link>
            )}

            <Link
              href={`/${lang}#contact`}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <SupportIcon className="w-5 h-5 text-gray-400" />
              <span>{t('support') || 'Support'}</span>
            </Link>

            <button
              onClick={() => {
                setIsOpen(false)
                logout()
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <LogoutIcon className="w-5 h-5 text-gray-400" />
              <span>{t('signOut') || 'Sign out'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(UserDropdown)
