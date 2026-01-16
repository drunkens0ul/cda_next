'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import {
  SpinnerIcon,
  ChevronLeftIcon,
  DownloadIcon,
  TrashIcon,
  EmailIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@/components/icons'
import type { PendingSignupItem, DomainCount } from '@/lib/types/admin'
import type { PaginationInfo } from '@/lib/types/auth'

function PendingSignupsContent() {
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

  const [pendingSignups, setPendingSignups] = useState<PendingSignupItem[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [stats, setStats] = useState<{ total: number; expired: number; active: number; domainBreakdown: DomainCount[] } | null>(null)
  const [domains, setDomains] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isCleaningUp, setIsCleaningUp] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Bulk send state
  const [isBulkSending, setIsBulkSending] = useState(false)
  const [showBulkDropdown, setShowBulkDropdown] = useState(false)
  const [bulkSendResult, setBulkSendResult] = useState<{
    sent: number
    failed: number
    total: number
  } | null>(null)

  // Domain send state
  const [sendingDomain, setSendingDomain] = useState<string | null>(null)

  // Local search input state for debouncing
  const [searchInput, setSearchInput] = useState(searchQuery)

  // Update URL with new params
  const updateURL = useCallback(
    (params: Record<string, string>) => {
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
    },
    [pathname, router, searchParams]
  )

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchQuery) {
        updateURL({ search: searchInput })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, searchQuery, updateURL])

  // Fetch pending signups when URL params change
  useEffect(() => {
    fetchPendingSignups()
  }, [currentPage, searchQuery, domainFilter])

  // Clear selection when filters change
  useEffect(() => {
    setSelectedIds(new Set())
  }, [searchQuery, domainFilter, currentPage])

  async function fetchPendingSignups() {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', currentPage.toString())
      params.set('limit', '20')
      if (searchQuery) params.set('search', searchQuery)
      if (domainFilter) params.set('domain', domainFilter)

      const response = await fetch(`/api/admin/pending-signups?${params.toString()}`)
      const data = await response.json()
      if (data.success) {
        setPendingSignups(data.pendingSignups || [])
        setPagination(data.pagination || null)
        setStats(data.stats || null)
        setDomains(data.domains || [])
      }
    } catch (error) {
      console.error('Failed to fetch pending signups:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSendVerification(id: string) {
    setActionInProgress(id)
    setMessage(null)

    try {
      const response = await fetch(`/api/admin/pending-signups/${id}/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang: locale }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: t('verificationSent') || 'Verification email sent' })
        fetchPendingSignups() // Refresh to update expiry
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to send verification' })
      }
    } catch (error) {
      console.error('Failed to send verification:', error)
      setMessage({ type: 'error', text: 'Failed to send verification' })
    } finally {
      setActionInProgress(null)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('confirmDeletePending') || 'Are you sure you want to delete this pending signup?')) {
      return
    }

    setActionInProgress(id)
    setMessage(null)

    try {
      const response = await fetch(`/api/admin/pending-signups/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setPendingSignups(pendingSignups.filter((ps) => ps.id !== id))
        setMessage({ type: 'success', text: t('pendingDeleted') || 'Pending signup deleted' })
        fetchPendingSignups() // Refresh stats
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to delete' })
      }
    } catch (error) {
      console.error('Failed to delete:', error)
      setMessage({ type: 'error', text: 'Failed to delete' })
    } finally {
      setActionInProgress(null)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  async function handleCleanupExpired() {
    if (!confirm(t('confirmCleanupExpired') || 'Are you sure you want to delete all expired pending signups?')) {
      return
    }

    setIsCleaningUp(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/pending-signups/expired', {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setMessage({
          type: 'success',
          text: data.message || `Deleted ${data.deletedCount} expired signup(s)`,
        })
        fetchPendingSignups() // Refresh
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to cleanup' })
      }
    } catch (error) {
      console.error('Failed to cleanup:', error)
      setMessage({ type: 'error', text: 'Failed to cleanup expired signups' })
    } finally {
      setIsCleaningUp(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  function handleExport() {
    setIsExporting(true)
    window.location.href = '/api/admin/pending-signups/export'
    setTimeout(() => setIsExporting(false), 1000)
  }

  // Bulk send handlers
  async function handleBulkSend(mode: 'selected' | 'filtered' | 'all') {
    const count =
      mode === 'selected'
        ? selectedIds.size
        : mode === 'filtered'
        ? pagination?.total || 0
        : stats?.total || 0

    const confirmMessage = (t('confirmBulkSend') || 'Are you sure you want to send verification emails to {count} users?').replace(
      '{count}',
      count.toString()
    )

    if (!confirm(confirmMessage)) {
      return
    }

    setIsBulkSending(true)
    setBulkSendResult(null)
    setShowBulkDropdown(false)
    setMessage(null)

    try {
      const body: {
        mode: string
        ids?: string[]
        domain?: string
        search?: string
        lang: string
      } = {
        mode,
        lang: locale,
      }

      if (mode === 'selected') {
        body.ids = Array.from(selectedIds)
      } else if (mode === 'filtered') {
        if (domainFilter) body.domain = domainFilter
        if (searchQuery) body.search = searchQuery
      }

      const response = await fetch('/api/admin/pending-signups/bulk-send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (data.success) {
        setBulkSendResult({
          sent: data.sent,
          failed: data.failed,
          total: data.total,
        })
        setMessage({
          type: data.failed > 0 ? 'error' : 'success',
          text: `${t('bulkSendComplete') || 'Bulk send complete'}: ${data.sent} ${t('emailsSent') || 'emails sent'}${
            data.failed > 0 ? `, ${data.failed} ${t('emailsFailed') || 'failed'}` : ''
          }`,
        })
        setSelectedIds(new Set())
        fetchPendingSignups() // Refresh
      } else {
        setMessage({ type: 'error', text: data.message || 'Bulk send failed' })
      }
    } catch (error) {
      console.error('Bulk send failed:', error)
      setMessage({ type: 'error', text: 'Bulk send failed' })
    } finally {
      setIsBulkSending(false)
      setTimeout(() => {
        setMessage(null)
        setBulkSendResult(null)
      }, 5000)
    }
  }

  // Send to specific domain handler
  async function handleSendToDomain(domain: string, count: number) {
    const confirmMessage = (t('confirmBulkSend') || 'Are you sure you want to send verification emails to {count} users?').replace(
      '{count}',
      count.toString()
    )

    if (!confirm(confirmMessage)) {
      return
    }

    setSendingDomain(domain)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/pending-signups/bulk-send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'filtered',
          domain,
          lang: locale,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage({
          type: data.failed > 0 ? 'error' : 'success',
          text: `${t('bulkSendComplete') || 'Bulk send complete'}: ${data.sent} ${t('emailsSent') || 'emails sent'}${
            data.failed > 0 ? `, ${data.failed} ${t('emailsFailed') || 'failed'}` : ''
          }`,
        })
        fetchPendingSignups() // Refresh
      } else {
        setMessage({ type: 'error', text: data.message || 'Bulk send failed' })
      }
    } catch (error) {
      console.error('Send to domain failed:', error)
      setMessage({ type: 'error', text: 'Failed to send verification emails' })
    } finally {
      setSendingDomain(null)
      setTimeout(() => setMessage(null), 5000)
    }
  }

  // Selection handlers
  function handleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedIds(new Set(pendingSignups.map((ps) => ps.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  function handleSelectOne(id: string, checked: boolean) {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return t('never') || 'Never'
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

  const allOnPageSelected = pendingSignups.length > 0 && pendingSignups.every((ps) => selectedIds.has(ps.id))
  const someSelected = selectedIds.size > 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('pendingVerification') || 'Pending Verification'}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCleanupExpired}
            disabled={isCleaningUp || (stats?.expired || 0) === 0}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {isCleaningUp ? (
              <SpinnerIcon className="animate-spin w-4 h-4" />
            ) : (
              <TrashIcon className="w-4 h-4" />
            )}
            {t('cleanupExpired') || 'Cleanup Expired'}
          </button>
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

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <ClockIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('total') || 'Total'}</p>
                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('active') || 'Active'}</p>
                <p className="text-xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <ClockIcon className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('expired') || 'Expired'}</p>
                <p className="text-xl font-bold text-gray-900">{stats.expired}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Domain Breakdown Table */}
      {stats && stats.domainBreakdown && stats.domainBreakdown.length > 0 && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {t('pendingByDomain') || 'Pending by Domain'}
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
                    {t('count') || 'Count'}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    %
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('actions') || 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.domainBreakdown.map((item) => (
                  <tr key={item.domain} className="hover:bg-gray-50">
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                      @{item.domain}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      {item.count.toLocaleString()}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-right text-gray-500">
                      {((item.count / stats.total) * 100).toFixed(1)}%
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-right">
                      <button
                        onClick={() => handleSendToDomain(item.domain, item.count)}
                        disabled={sendingDomain === item.domain}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                      >
                        {sendingDomain === item.domain ? (
                          <>
                            <SpinnerIcon className="animate-spin w-3 h-3" />
                            {t('bulkSendProgress') || 'Sending...'}
                          </>
                        ) : (
                          <>
                            <EmailIcon className="w-3 h-3" />
                            {t('sendVerification') || 'Send Verification'}
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bulk Action Toolbar */}
      {(someSelected || isBulkSending) && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-blue-900">
              {selectedIds.size} {t('selected') || 'selected'}
            </span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {t('clearSelection') || 'Clear Selection'}
            </button>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowBulkDropdown(!showBulkDropdown)}
              disabled={isBulkSending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isBulkSending ? (
                <>
                  <SpinnerIcon className="animate-spin w-4 h-4" />
                  {t('bulkSendProgress') || 'Sending emails...'}
                </>
              ) : (
                <>
                  <EmailIcon className="w-4 h-4" />
                  {t('sendVerification') || 'Send Verification'}
                  <ChevronLeftIcon className="w-4 h-4 -rotate-90" />
                </>
              )}
            </button>
            {showBulkDropdown && !isBulkSending && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <button
                  onClick={() => handleBulkSend('selected')}
                  disabled={selectedIds.size === 0}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-100"
                >
                  <div className="font-medium">{t('sendToSelected') || 'Send to Selected'}</div>
                  <div className="text-gray-500">{selectedIds.size} {t('users') || 'users'}</div>
                </button>
                <button
                  onClick={() => handleBulkSend('filtered')}
                  disabled={(pagination?.total || 0) === 0}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-100"
                >
                  <div className="font-medium">{t('sendToFiltered') || 'Send to All in Current Filter'}</div>
                  <div className="text-gray-500">{pagination?.total || 0} {t('users') || 'users'}</div>
                </button>
                <button
                  onClick={() => handleBulkSend('all')}
                  disabled={(stats?.total || 0) === 0}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="font-medium">{t('sendToAll') || 'Send to ALL Pending'}</div>
                  <div className="text-gray-500">{stats?.total || 0} {t('users') || 'users'}</div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('searchPendingVerification') || 'Search by email or name...'}
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
            {domains.map((domain) => (
              <option key={domain} value={domain}>
                @{domain}
              </option>
            ))}
          </select>
        </div>
      </div>

      {message && (
        <div
          className={`mb-4 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <SpinnerIcon className="animate-spin h-8 w-8 text-primary" />
        </div>
      ) : pendingSignups.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {searchQuery || domainFilter
            ? t('noResults') || 'No pending signups found matching your criteria'
            : t('noPendingVerification') || 'No pending verification'}
        </div>
      ) : (
        <>
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('email') || 'Email'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('name') || 'Name'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('domain') || 'Domain'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('expiresAt') || 'Expires At'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('status') || 'Status'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('actions') || 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingSignups.map((signup) => (
                  <tr key={signup.id} className={`hover:bg-gray-50 ${selectedIds.has(signup.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(signup.id)}
                        onChange={(e) => handleSelectOne(signup.id, e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{signup.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {signup.firstName} {signup.lastName || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">@{signup.domain}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(signup.expiresAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          signup.isExpired
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {signup.isExpired
                          ? t('expired') || 'Expired'
                          : t('active') || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSendVerification(signup.id)}
                          disabled={actionInProgress === signup.id}
                          className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                          title={t('sendVerification') || 'Send Verification'}
                        >
                          {actionInProgress === signup.id ? (
                            <SpinnerIcon className="animate-spin w-4 h-4" />
                          ) : (
                            <EmailIcon className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(signup.id)}
                          disabled={actionInProgress === signup.id}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title={t('delete') || 'Delete'}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
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
                {t('showing') || 'Showing'}{' '}
                {(pagination.page - 1) * pagination.limit + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
                {t('of') || 'of'} {pagination.total}{' '}
                {t('pendingVerification') || 'pending verification'}
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
                {getPageNumbers().map((pageNum, idx) =>
                  pageNum === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">
                      ...
                    </span>
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
                )}

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

      {/* Close dropdown when clicking outside */}
      {showBulkDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowBulkDropdown(false)}
        />
      )}
    </div>
  )
}

export default function PendingSignupsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <SpinnerIcon className="animate-spin h-8 w-8 text-primary" />
        </div>
      }
    >
      <PendingSignupsContent />
    </Suspense>
  )
}
