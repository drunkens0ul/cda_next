'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { SpinnerIcon, ArrowLeftIcon, EmailIcon, CheckCircleIcon, UsersIcon } from '@/components/icons'
import { formatTimeInGST } from '@/lib/time'
import { defaultLocale } from '@/i18n/config'
import type { RegistrationWithUser } from '@/lib/types/events'

export default function EventRegistrationsPage() {
  const t = useTranslations('admin')
  const params = useParams()
  const lang = params.lang as string || defaultLocale
  const slug = params.slug as string

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [registrations, setRegistrations] = useState<RegistrationWithUser[]>([])
  const [eventTitle, setEventTitle] = useState('')
  const [sendingEmailTo, setSendingEmailTo] = useState<string | null>(null)
  const [sendingAll, setSendingAll] = useState(false)

  useEffect(() => {
    async function fetchRegistrations() {
      try {
        const response = await fetch(`/api/admin/events/${slug}/registrations`)
        const data = await response.json()
        if (data.success) {
          setRegistrations(data.registrations || [])
          setEventTitle(data.event?.title || slug)
        } else {
          setError(data.message || 'Failed to load registrations')
        }
      } catch (err) {
        console.error('Failed to fetch registrations:', err)
        setError('Failed to load registrations')
      } finally {
        setIsLoading(false)
      }
    }
    fetchRegistrations()
  }, [slug])

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatDateTime = (date: Date | string) => {
    const d = new Date(date)
    return `${formatDate(d)} ${formatTimeInGST(d)}`
  }

  const handleSendEmail = async (registrationId: string) => {
    setSendingEmailTo(registrationId)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch(`/api/admin/events/${slug}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId })
      })

      const data = await response.json()

      if (data.success) {
        setSuccessMessage(t('emailSentSuccess') || 'Email sent successfully')
        // Refresh registrations to update the email sent timestamp
        const refreshResponse = await fetch(`/api/admin/events/${slug}/registrations`)
        const refreshData = await refreshResponse.json()
        if (refreshData.success) {
          setRegistrations(refreshData.registrations || [])
        }
      } else {
        setError(data.message || 'Failed to send email')
      }
    } catch (err) {
      console.error('Failed to send email:', err)
      setError('Failed to send email')
    } finally {
      setSendingEmailTo(null)
    }
  }

  const handleSendAllPending = async () => {
    const pendingRegistrations = registrations.filter(r => !r.confirmationEmailSentAt)
    if (pendingRegistrations.length === 0) return

    setSendingAll(true)
    setError(null)
    setSuccessMessage(null)

    let successCount = 0
    let failCount = 0

    for (const registration of pendingRegistrations) {
      try {
        const response = await fetch(`/api/admin/events/${slug}/registrations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ registrationId: registration.id })
        })
        const data = await response.json()
        if (data.success) {
          successCount++
        } else {
          failCount++
        }
      } catch {
        failCount++
      }
    }

    // Refresh registrations
    const refreshResponse = await fetch(`/api/admin/events/${slug}/registrations`)
    const refreshData = await refreshResponse.json()
    if (refreshData.success) {
      setRegistrations(refreshData.registrations || [])
    }

    if (failCount === 0) {
      setSuccessMessage(`${successCount} ${t('emailsSentSuccess') || 'emails sent successfully'}`)
    } else {
      setError(`${successCount} sent, ${failCount} failed`)
    }

    setSendingAll(false)
  }

  const totalRegistered = registrations.length
  const emailsSent = registrations.filter(r => r.confirmationEmailSentAt).length
  const emailsPending = totalRegistered - emailsSent

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/${lang}/admin/events`}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('registrations') || 'Registrations'}</h2>
          <p className="text-gray-600 text-sm">{eventTitle}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 text-red-800">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 rounded-lg bg-green-50 text-green-800">
          {successMessage}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <UsersIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalRegistered}</p>
            <p className="text-sm text-gray-600">{t('totalRegistered') || 'Total Registered'}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{emailsSent}</p>
            <p className="text-sm text-gray-600">{t('emailsSent') || 'Emails Sent'}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
            <EmailIcon className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{emailsPending}</p>
            <p className="text-sm text-gray-600">{t('emailsPending') || 'Emails Pending'}</p>
          </div>
        </div>
      </div>

      {/* Send All Pending Button */}
      {emailsPending > 0 && (
        <div className="mb-6">
          <button
            onClick={handleSendAllPending}
            disabled={sendingAll}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {sendingAll ? (
              <>
                <SpinnerIcon className="animate-spin w-4 h-4" />
                {t('sendingEmails') || 'Sending emails...'}
              </>
            ) : (
              <>
                <EmailIcon className="w-4 h-4" />
                {t('sendAllPending') || `Send All Pending (${emailsPending})`}
              </>
            )}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <SpinnerIcon className="animate-spin h-8 w-8 text-primary" />
        </div>
      ) : registrations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UsersIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('noRegistrations') || 'No Registrations'}
          </h3>
          <p className="text-gray-600">
            {t('noRegistrationsDesc') || 'No one has registered for this event yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('name') || 'Name'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('email') || 'Email'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('registeredAt') || 'Registered At'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('emailStatus') || 'Email Status'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('actions') || 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {registrations.map((registration) => (
                <tr key={registration.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {registration.userName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {registration.userEmail}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {formatDateTime(registration.registeredAt)}
                    </div>
                    <div className="text-xs text-gray-400">GST</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {registration.confirmationEmailSentAt ? (
                      <div>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircleIcon className="w-3 h-3" />
                          {t('sent') || 'Sent'}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDateTime(registration.confirmationEmailSentAt)}
                        </div>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {t('pending') || 'Pending'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleSendEmail(registration.id)}
                      disabled={sendingEmailTo === registration.id || sendingAll}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {sendingEmailTo === registration.id ? (
                        <>
                          <SpinnerIcon className="animate-spin w-3 h-3" />
                          {t('sending') || 'Sending...'}
                        </>
                      ) : registration.confirmationEmailSentAt ? (
                        <>
                          <EmailIcon className="w-3 h-3" />
                          {t('resendEmail') || 'Resend'}
                        </>
                      ) : (
                        <>
                          <EmailIcon className="w-3 h-3" />
                          {t('sendEmail') || 'Send'}
                        </>
                      )}
                    </button>
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
