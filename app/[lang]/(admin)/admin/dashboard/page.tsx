'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { SpinnerIcon, UsersIcon, CalendarIcon, CheckCircleIcon, ClockIcon } from '@/components/icons'
import type { AdminDashboardStats } from '@/lib/types/admin'

export default function AdminDashboardPage() {
  const t = useTranslations('admin')

  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/stats')
      const data = await response.json()
      if (data.success && data.stats) {
        setStats(data.stats)
      } else {
        setError(data.message || 'Failed to fetch stats')
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err)
      setError('Failed to fetch stats')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <SpinnerIcon className="animate-spin h-8 w-8 text-primary" />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="text-center py-12 text-red-600">
        {error || 'Failed to load dashboard'}
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('dashboard') || 'Dashboard'}</h2>

      {/* User Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Registered */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <UsersIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('totalRegistered') || 'Total Registered'}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.users.totalRegistered}</p>
            </div>
          </div>
        </div>

        {/* Verified (Active) */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-green-200 bg-green-50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-700">{t('verifiedActive') || 'Verified (Active)'}</p>
              <p className="text-2xl font-bold text-green-800">{stats.users.totalVerified}</p>
            </div>
          </div>
        </div>

        {/* Pending Signups */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-full">
              <ClockIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('pendingVerification') || 'Pending Verification'}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.users.totalPendingSignups}</p>
              {stats.users.expiredPendingSignups > 0 && (
                <p className="text-xs text-red-500">
                  {stats.users.expiredPendingSignups} {t('expired') || 'expired'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* New Last 7 Days */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <CalendarIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('newLast7Days') || 'New (7 days)'}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.users.newVerifiedLast7Days}</p>
              <p className="text-xs text-gray-400">
                {stats.users.newVerifiedLast30Days} {t('inLast30Days') || 'in 30 days'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Domain Distribution */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('usersByDomain') || 'Users by Domain'}
          </h3>
          {stats.users.verifiedByDomain.length === 0 ? (
            <p className="text-gray-500 text-sm">{t('noData') || 'No data available'}</p>
          ) : (
            <div className="space-y-3">
              {stats.users.verifiedByDomain.slice(0, 10).map((domain) => (
                <div key={domain.domain} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 truncate max-w-[200px]">
                    @{domain.domain}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{
                          width: `${Math.min((domain.count / stats.users.totalVerified) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">
                      {domain.count}
                    </span>
                  </div>
                </div>
              ))}
              {stats.users.verifiedByDomain.length > 10 && (
                <p className="text-xs text-gray-400 mt-2">
                  +{stats.users.verifiedByDomain.length - 10} {t('moreDomains') || 'more domains'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Event Stats */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('eventStatistics') || 'Event Statistics'}
          </h3>
          <div className="mb-4">
            <p className="text-sm text-gray-500">{t('totalEvents') || 'Total Events'}</p>
            <p className="text-2xl font-bold text-gray-900">{stats.events.total}</p>
          </div>
          {stats.events.byStatus.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {stats.events.byStatus.map((status) => (
                <div key={status.status} className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-lg font-semibold text-gray-900">{status.count}</p>
                  <p className="text-xs text-gray-500 capitalize">{status.status}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Registration Stats */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('registrationsByEvent') || 'Registrations by Event'}
          </h3>
          <div className="mb-2">
            <p className="text-sm text-gray-500">{t('totalRegistrations') || 'Total Registrations'}</p>
            <p className="text-2xl font-bold text-gray-900">{stats.registrations.total}</p>
          </div>
          {stats.registrations.byEvent.length === 0 ? (
            <p className="text-gray-500 text-sm">{t('noRegistrations') || 'No registrations yet'}</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('event') || 'Event'}
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      {t('registrations') || 'Registrations'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.registrations.byEvent.map((event) => (
                    <tr key={event.eventId}>
                      <td className="px-4 py-3 text-sm text-gray-900">{event.eventTitle}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                        {event.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
