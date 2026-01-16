'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { SpinnerIcon, PlusIcon, PencilIcon, TrashIcon, UsersIcon, UserPlusIcon } from '@/components/icons'
import { formatDateTimeDisplay } from '@/lib/time'
import type { EventWithRegistrationCount } from '@/lib/types/events'
import { defaultLocale } from '@/i18n/config'

export default function AdminEventsPage() {
  const t = useTranslations('admin')
  const locale = useLocale()
  const params = useParams()
  const router = useRouter()
  const lang = params.lang as string || defaultLocale
  const isRtl = locale === 'ar'

  const [events, setEvents] = useState<EventWithRegistrationCount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingEventSlug, setDeletingEventSlug] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [])

  async function fetchEvents() {
    try {
      const response = await fetch('/api/admin/events')
      const data = await response.json()
      if (data.success && data.events) {
        setEvents(data.events)
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(slug: string) {
    if (!confirm(t('confirmDelete'))) return

    setDeletingEventSlug(slug)
    setMessage(null)

    try {
      const response = await fetch(`/api/admin/events/${slug}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setEvents(events.filter(event => event.slug !== slug))
        setMessage({ type: 'success', text: t('eventDeleted') })
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to delete event' })
      }
    } catch (error) {
      console.error('Failed to delete event:', error)
      setMessage({ type: 'error', text: 'Failed to delete event' })
    } finally {
      setDeletingEventSlug(null)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const formatDate = (date: Date | string) => {
    return formatDateTimeDisplay(date, isRtl ? 'ar-AE' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      upcoming: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return styles[status] || 'bg-gray-100 text-gray-800'
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('events')}</h2>
        <Link
          href={`/${lang}/admin/events/create`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          {t('createEvent')}
        </Link>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {events.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {t('noEvents')}
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('eventTitle')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('date')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('registrations')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {isRtl && event.titleAr ? event.titleAr : event.title}
                    </div>
                    <div className="text-sm text-gray-500">{event.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(event.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(event.status)}`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {event.registrationCount}
                    {event.maxAttendees && ` / ${event.maxAttendees}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/${lang}/admin/events/${event.slug}/registrations`}
                        className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                        title={t('viewRegistrations') || 'View Registrations'}
                      >
                        <UsersIcon className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/${lang}/admin/events/${event.slug}/bulk-register`}
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title={t('bulkRegister') || 'Bulk Register'}
                      >
                        <UserPlusIcon className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/${lang}/admin/events/${event.slug}/edit`}
                        className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                        title={t('editEvent')}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(event.slug)}
                        disabled={deletingEventSlug === event.slug}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title={t('deleteEvent')}
                      >
                        {deletingEventSlug === event.slug ? (
                          <SpinnerIcon className="animate-spin w-4 h-4" />
                        ) : (
                          <TrashIcon className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
