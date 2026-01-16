'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { SpinnerIcon, ChevronLeftIcon, DownloadIcon, UsersIcon } from '@/components/icons'
import type { AdminUserListItem, UserRole, PaginationInfo } from '@/lib/types/auth'
import type { DomainCount } from '@/lib/types/admin'

interface EventOption {
  id: string
  slug: string
  title: string
  titleAr: string | null
}

function AdminUsersContent() {
  const t = useTranslations('admin')
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Read state from URL
  const currentPage = parseInt(searchParams.get('page') || '1', 10)
  const searchQuery = searchParams.get('search') || ''
  const domainFilter = searchParams.get('domain') || ''

  const [users, setUsers] = useState<AdminUserListItem[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [domains, setDomains] = useState<string[]>([])
  const [userStats, setUserStats] = useState<{ totalUsers: number; domainBreakdown: DomainCount[] } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Export state
  const [events, setEvents] = useState<EventOption[]>([])
  const [selectedEventForExport, setSelectedEventForExport] = useState<string>('')
  const [isExporting, setIsExporting] = useState(false)

  // Local search input state for debouncing
  const [searchInput, setSearchInput] = useState(searchQuery)

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
    // Reset to page 1 when filters change (except when page itself changes)
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

  // Fetch users when URL params change
  useEffect(() => {
    fetchUsers()
  }, [currentPage, searchQuery, domainFilter])

  // Fetch events for export dropdown
  useEffect(() => {
    fetchEvents()
  }, [])

  async function fetchEvents() {
    try {
      const response = await fetch('/api/admin/events')
      const data = await response.json()
      if (data.success && data.events) {
        setEvents(data.events.map((e: { id: string; slug: string; title: string; titleAr: string | null }) => ({
          id: e.id,
          slug: e.slug,
          title: e.title,
          titleAr: e.titleAr,
        })))
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
    }
  }

  async function handleExport() {
    setIsExporting(true)
    try {
      const params = new URLSearchParams()
      if (selectedEventForExport) {
        params.set('eventId', selectedEventForExport)
      }
      // Trigger download by navigating to the export URL
      window.location.href = `/api/admin/users/export?${params.toString()}`
    } finally {
      // Reset after a short delay to allow download to start
      setTimeout(() => setIsExporting(false), 1000)
    }
  }

  async function fetchUsers() {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', currentPage.toString())
      params.set('limit', '20')
      if (searchQuery) params.set('search', searchQuery)
      if (domainFilter) params.set('domain', domainFilter)

      const response = await fetch(`/api/admin/users?${params.toString()}`)
      const data = await response.json()
      if (data.success) {
        setUsers(data.users || [])
        setPagination(data.pagination || null)
        setDomains(data.domains || [])
        setUserStats(data.stats || null)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRoleChange(userId: string, newRole: UserRole) {
    setUpdatingUserId(userId)
    setMessage(null)

    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      const data = await response.json()

      if (data.success) {
        setUsers(users.map(user =>
          user.id === userId ? { ...user, role: newRole } : user
        ))
        setMessage({ type: 'success', text: t('roleUpdated') })
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update role' })
      }
    } catch (error) {
      console.error('Failed to update role:', error)
      setMessage({ type: 'error', text: 'Failed to update role' })
    } finally {
      setUpdatingUserId(null)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return t('never')
    return new Date(date).toLocaleDateString(isRtl ? 'ar-AE' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    if (!pagination) return []
    const { page, totalPages } = pagination
    const pages: (number | string)[] = []

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (page > 3) pages.push('...')
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i)
      }
      if (page < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }

    return pages
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('users')}</h2>
        {/* Export Section */}
        <div className="flex items-center gap-2">
          <select
            value={selectedEventForExport}
            onChange={(e) => setSelectedEventForExport(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">{t('allEvents') || 'All Events'}</option>
            {events.map(event => (
              <option key={event.id} value={event.id}>
                {isRtl && event.titleAr ? event.titleAr : event.title}
              </option>
            ))}
          </select>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isExporting ? (
              <SpinnerIcon className="animate-spin w-4 h-4" />
            ) : (
              <DownloadIcon className="w-4 h-4" />
            )}
            {t('exportCSV') || 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Stats Section - Total Users and Domain Breakdown */}
      {userStats && (
        <div className="mb-6">
          {/* Total Users Count Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <UsersIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('totalUsers') || 'Total Users'}</p>
                <p className="text-3xl font-bold text-gray-900">{userStats.totalUsers.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Domain Breakdown Table */}
          {userStats.domainBreakdown.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('usersByDomain') || 'Users by Domain'}
                </h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('domain') || 'Domain'}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('users') || 'Users'}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {userStats.domainBreakdown.map((item) => (
                      <tr key={item.domain} className="hover:bg-gray-50">
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                          @{item.domain}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                          {item.count.toLocaleString()}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                          {((item.count / userStats.totalUsers) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('searchUsers') || 'Search users...'}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Domain Filter */}
        <div className="sm:w-64">
          <select
            value={domainFilter}
            onChange={(e) => updateURL({ domain: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">{t('allDomains') || 'All Domains'}</option>
            {domains.map(domain => (
              <option key={domain} value={domain}>@{domain}</option>
            ))}
          </select>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <SpinnerIcon className="animate-spin h-8 w-8 text-primary" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {searchQuery || domainFilter ? (t('noResults') || 'No users found matching your criteria') : t('noUsers')}
        </div>
      ) : (
        <>
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('email')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('role')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('lastLogin')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                        disabled={updatingUserId === user.id}
                        className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                      >
                        <option value="user">{t('user')}</option>
                        <option value="admin">{t('admin')}</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.lastLoginAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                {t('showing') || 'Showing'} {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} {t('of') || 'of'} {pagination.total} {t('users') || 'users'}
              </div>

              <div className="flex items-center gap-1">
                {/* Previous Button */}
                <button
                  onClick={() => updateURL({ page: (currentPage - 1).toString() })}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={t('previous') || 'Previous'}
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>

                {/* Page Numbers */}
                {getPageNumbers().map((pageNum, idx) => (
                  pageNum === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">...</span>
                  ) : (
                    <button
                      key={pageNum}
                      onClick={() => updateURL({ page: pageNum.toString() })}
                      className={`px-3 py-1 rounded-lg text-sm ${
                        pageNum === currentPage
                          ? 'bg-primary text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                ))}

                {/* Next Button */}
                <button
                  onClick={() => updateURL({ page: (currentPage + 1).toString() })}
                  disabled={currentPage === pagination.totalPages}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={t('next') || 'Next'}
                >
                  <ChevronLeftIcon className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-12">
        <SpinnerIcon className="animate-spin h-8 w-8 text-primary" />
      </div>
    }>
      <AdminUsersContent />
    </Suspense>
  )
}
