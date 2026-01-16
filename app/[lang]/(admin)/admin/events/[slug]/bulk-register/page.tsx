'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { SpinnerIcon, ChevronLeftIcon, CheckCircleIcon, UsersIcon } from '@/components/icons'
import { defaultLocale } from '@/i18n/config'
import type { UserForBulkRegistration } from '@/lib/types/admin'

interface EventInfo {
  id: string
  slug: string
  title: string
  registrationCount: number
  maxAttendees: number | null
}

export default function BulkRegisterPage() {
  const t = useTranslations('admin')
  const params = useParams()
  const lang = (params.lang as string) || defaultLocale
  const slug = params.slug as string

  const [event, setEvent] = useState<EventInfo | null>(null)
  const [users, setUsers] = useState<UserForBulkRegistration[]>([])
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isRegistering, setIsRegistering] = useState(false)
  const [sendEmails, setSendEmails] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [result, setResult] = useState<{
    registered: number
    emailsSent: number
    failed: { email: string; error: string }[]
  } | null>(null)

  useEffect(() => {
    fetchUnregisteredUsers()
  }, [slug])

  async function fetchUnregisteredUsers() {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/events/${slug}/bulk-register`)
      const data = await response.json()
      if (data.success) {
        setEvent(data.event)
        setUsers(data.users || [])
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to fetch data' })
      }
    } catch (error) {
      console.error('Failed to fetch unregistered users:', error)
      setMessage({ type: 'error', text: 'Failed to fetch data' })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.lastName && user.lastName.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(filteredUsers.map((u) => u.id)))
    }
  }

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
  }

  async function handleRegisterSelected() {
    if (selectedUsers.size === 0) {
      setMessage({ type: 'error', text: t('selectUsersFirst') || 'Please select users first' })
      return
    }

    setIsRegistering(true)
    setMessage(null)
    setResult(null)

    try {
      const response = await fetch(`/api/admin/events/${slug}/bulk-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: Array.from(selectedUsers),
          sendEmails,
        }),
      })

      const data = await response.json()

      if (data.success || data.registered > 0) {
        setResult({
          registered: data.registered || 0,
          emailsSent: data.emailsSent || 0,
          failed: data.failed || [],
        })
        setMessage({ type: 'success', text: data.message || 'Registration completed' })
        // Refresh the user list
        fetchUnregisteredUsers()
        setSelectedUsers(new Set())
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to register users' })
      }
    } catch (error) {
      console.error('Failed to register users:', error)
      setMessage({ type: 'error', text: 'Failed to register users' })
    } finally {
      setIsRegistering(false)
    }
  }

  async function handleRegisterAll() {
    if (users.length === 0) {
      setMessage({ type: 'error', text: t('noUsersToRegister') || 'No users to register' })
      return
    }

    if (
      !confirm(
        t('confirmRegisterAll') ||
          `Are you sure you want to register all ${users.length} users?`
      )
    ) {
      return
    }

    setIsRegistering(true)
    setMessage(null)
    setResult(null)

    try {
      const response = await fetch(`/api/admin/events/${slug}/bulk-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registerAll: true,
          sendEmails,
        }),
      })

      const data = await response.json()

      if (data.success || data.registered > 0) {
        setResult({
          registered: data.registered || 0,
          emailsSent: data.emailsSent || 0,
          failed: data.failed || [],
        })
        setMessage({ type: 'success', text: data.message || 'Registration completed' })
        // Refresh the user list
        fetchUnregisteredUsers()
        setSelectedUsers(new Set())
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to register users' })
      }
    } catch (error) {
      console.error('Failed to register users:', error)
      setMessage({ type: 'error', text: 'Failed to register users' })
    } finally {
      setIsRegistering(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <SpinnerIcon className="animate-spin h-8 w-8 text-primary" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/${lang}/admin/events`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          {t('backToEvents') || 'Back to Events'}
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">
          {t('bulkRegister') || 'Bulk Register'}
        </h2>
        {event && (
          <p className="text-gray-600 mt-1">
            {event.title} - {event.registrationCount}
            {event.maxAttendees ? ` / ${event.maxAttendees}` : ''}{' '}
            {t('registrations') || 'registrations'}
          </p>
        )}
      </div>

      {/* Result Summary */}
      {result && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-800">
              {t('registrationComplete') || 'Registration Complete'}
            </h3>
          </div>
          <ul className="text-sm text-green-700 space-y-1">
            <li>
              {result.registered} {t('usersRegistered') || 'user(s) registered'}
            </li>
            {result.emailsSent > 0 && (
              <li>
                {result.emailsSent} {t('emailsSent') || 'email(s) sent'}
              </li>
            )}
            {result.failed.length > 0 && (
              <li className="text-red-600">
                {result.failed.length} {t('failed') || 'failed'}
              </li>
            )}
          </ul>
        </div>
      )}

      {message && !result && (
        <div
          className={`mb-4 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Actions Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchUsers') || 'Search users...'}
              className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Send Emails Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={sendEmails}
              onChange={(e) => setSendEmails(e.target.checked)}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span className="text-sm text-gray-700">
              {t('sendConfirmationEmails') || 'Send confirmation emails'}
            </span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRegisterSelected}
            disabled={isRegistering || selectedUsers.size === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isRegistering ? (
              <SpinnerIcon className="animate-spin w-4 h-4" />
            ) : (
              <UsersIcon className="w-4 h-4" />
            )}
            {t('registerSelected') || 'Register Selected'} ({selectedUsers.size})
          </button>
          <button
            onClick={handleRegisterAll}
            disabled={isRegistering || users.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {t('registerAll') || 'Register All'} ({users.length})
          </button>
        </div>
      </div>

      {/* Users Table */}
      {users.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <UsersIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>{t('allUsersRegistered') || 'All users are already registered for this event'}</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      filteredUsers.length > 0 &&
                      selectedUsers.size === filteredUsers.length
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('name') || 'Name'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('email') || 'Email'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className={`hover:bg-gray-50 cursor-pointer ${
                    selectedUsers.has(user.id) ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => handleSelectUser(user.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName || ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Selected Count */}
      {filteredUsers.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          {searchQuery && filteredUsers.length !== users.length && (
            <span>
              {t('showing') || 'Showing'} {filteredUsers.length} {t('of') || 'of'}{' '}
              {users.length} {t('users') || 'users'}.{' '}
            </span>
          )}
          {selectedUsers.size > 0 && (
            <span className="font-medium">
              {selectedUsers.size} {t('selected') || 'selected'}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
