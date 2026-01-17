'use client'

import AdminRoute from '@/components/AdminRoute'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { UsersIcon, CalendarIcon, HomeIcon, ChartIcon, ClockIcon, ShieldIcon, QuizIcon } from '@/components/icons'
import { defaultLocale } from '@/i18n/config'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const pathname = usePathname()
  const t = useTranslations('admin')
  const lang = params.lang as string || defaultLocale

  const isActive = (path: string) => pathname.includes(path)

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
              </div>
              <Link
                href={`/${lang}/dashboard`}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <HomeIcon className="w-4 h-4" />
                {t('backToDashboard')}
              </Link>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
              <Link
                href={`/${lang}/admin/dashboard`}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  isActive('/admin/dashboard')
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ChartIcon className="w-5 h-5" />
                {t('dashboard') || 'Dashboard'}
              </Link>
              <Link
                href={`/${lang}/admin/users`}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  isActive('/admin/users')
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <UsersIcon className="w-5 h-5" />
                {t('users')}
              </Link>
              <Link
                href={`/${lang}/admin/events`}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  isActive('/admin/events')
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <CalendarIcon className="w-5 h-5" />
                {t('events')}
              </Link>
              <Link
                href={`/${lang}/admin/quizzes`}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  isActive('/admin/quizzes')
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <QuizIcon className="w-5 h-5" />
                {t('quizzes')}
              </Link>
              <Link
                href={`/${lang}/admin/pending-signups`}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  isActive('/admin/pending-signups')
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ClockIcon className="w-5 h-5" />
                {t('pendingVerification') || 'Pending Verification'}
              </Link>
              <Link
                href={`/${lang}/admin/audit-logs`}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  isActive('/admin/audit-logs')
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ShieldIcon className="w-5 h-5" />
                {t('auditLogs') || 'Audit Logs'}
              </Link>
            </nav>
          </div>

          {/* Main Content */}
          <main>{children}</main>
        </div>
      </div>
    </AdminRoute>
  )
}
