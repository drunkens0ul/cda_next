'use client'

import { useState, useEffect, useCallback, Suspense, Fragment } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { SpinnerIcon, ChevronLeftIcon } from '@/components/icons'
import type { AuditLogEntry, AuditCategory, AuditAction, AuditStatus } from '@/lib/types/audit'

interface PaginationInfo {
  total: number
  page: number
  limit: number
  totalPages: number
}

// Action display mapping
const ACTION_LABELS: Record<AuditAction, string> = {
  'user.role_change': 'User Role Change',
  'event.create': 'Event Created',
  'event.update': 'Event Updated',
  'event.delete': 'Event Deleted',
  'registration.bulk_register': 'Bulk Registration',
  'registration.send_confirmation_email': 'Confirmation Email Sent',
  'pending_signup.delete': 'Pending Signup Deleted',
  'pending_signup.delete_expired': 'Expired Signups Cleaned',
  'pending_signup.send_verification': 'Verification Email Sent',
  'pending_signup.bulk_send_verification': 'Bulk Verification Emails',
  'export.users': 'Users Exported',
  'export.pending_signups': 'Pending Signups Exported',
  'quiz.create': 'Quiz Created',
  'quiz.update': 'Quiz Updated',
  'quiz.delete': 'Quiz Deleted',
}

const CATEGORY_COLORS: Record<AuditCategory, string> = {
  user: 'bg-blue-100 text-blue-800',
  event: 'bg-purple-100 text-purple-800',
  registration: 'bg-green-100 text-green-800',
  pending_signup: 'bg-yellow-100 text-yellow-800',
  export: 'bg-gray-100 text-gray-800',
  quiz: 'bg-pink-100 text-pink-800',
}

function AuditLogsContent() {
  const t = useTranslations('admin')
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // State from URL
  const currentPage = parseInt(searchParams.get('page') || '1', 10)
  const categoryFilter = searchParams.get('category') || ''
  const statusFilter = searchParams.get('status') || ''
  const searchQuery = searchParams.get('search') || ''

  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchInput, setSearchInput] = useState(searchQuery)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  // Update URL with new params
  const updateURL = useCallback((params: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value)
      } else {
        newParams.delete(key)
      }
    })
    if (!('page' in params)) {
      newParams.set('page', '1')
    }
    router.push(`${pathname}?${newParams.toString()}`)
  }, [pathname, router, searchParams])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchQuery) {
        updateURL({ search: searchInput })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, searchQuery, updateURL])

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', currentPage.toString())
      params.set('limit', '50')
      if (categoryFilter) params.set('category', categoryFilter)
      if (statusFilter) params.set('status', statusFilter)
      if (searchQuery) params.set('search', searchQuery)

      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`)
      const data = await response.json()
      if (data.success) {
        setLogs(data.logs || [])
        setPagination(data.pagination || null)
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, categoryFilter, statusFilter, searchQuery])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString(isRtl ? 'ar-AE' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const goToPage = (page: number) => {
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.set('page', page.toString())
    router.push(`${pathname}?${newParams.toString()}`)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {t('auditLogs') || 'Audit Logs'}
      </h2>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('searchAuditLogs') || 'Search by admin email or target...'}
            className="block w-full pl-4 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => updateURL({ category: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
        >
          <option value="">{t('allCategories') || 'All Categories'}</option>
          <option value="user">{t('categoryUser') || 'User'}</option>
          <option value="event">{t('categoryEvent') || 'Event'}</option>
          <option value="registration">{t('categoryRegistration') || 'Registration'}</option>
          <option value="pending_signup">{t('categoryPendingSignup') || 'Pending Signup'}</option>
          <option value="export">{t('categoryExport') || 'Export'}</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => updateURL({ status: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
        >
          <option value="">{t('allStatuses') || 'All Statuses'}</option>
          <option value="success">{t('auditSuccess') || 'Success'}</option>
          <option value="failure">{t('auditFailure') || 'Failure'}</option>
        </select>
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <SpinnerIcon className="animate-spin h-8 w-8 text-primary" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200">
          {t('noAuditLogs') || 'No audit logs found'}
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('auditTimestamp') || 'Timestamp'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('auditAdmin') || 'Admin'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('auditAction') || 'Action'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('auditTarget') || 'Target'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('auditStatus') || 'Status'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <Fragment key={log.id}>
                    <tr
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.adminEmail}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${CATEGORY_COLORS[log.category]}`}>
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.targetIdentifier || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          log.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                    {expandedLog === log.id && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 bg-gray-50">
                          <div className="text-sm space-y-2">
                            <p><strong>{t('auditIpAddress') || 'IP Address'}:</strong> {log.ipAddress || 'N/A'}</p>
                            {log.userAgent && (
                              <p className="truncate max-w-2xl">
                                <strong>User Agent:</strong> {log.userAgent}
                              </p>
                            )}
                            {log.details && Object.keys(log.details).length > 0 && (
                              <div>
                                <strong>{t('auditDetails') || 'Details'}:</strong>
                                <pre className="mt-1 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-48">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.errorMessage && (
                              <p className="text-red-600">
                                <strong>Error:</strong> {log.errorMessage}
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {t('showing') || 'Showing'} {((pagination.page - 1) * pagination.limit) + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)} {t('of') || 'of'} {pagination.total}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeftIcon className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
            </button>
            <span className="text-sm text-gray-600">
              {t('page') || 'Page'} {pagination.page} {t('of') || 'of'} {pagination.totalPages}
            </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === pagination.totalPages}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeftIcon className={`w-5 h-5 ${isRtl ? '' : 'rotate-180'}`} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AuditLogsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-12">
        <SpinnerIcon className="animate-spin h-8 w-8 text-primary" />
      </div>
    }>
      <AuditLogsContent />
    </Suspense>
  )
}
