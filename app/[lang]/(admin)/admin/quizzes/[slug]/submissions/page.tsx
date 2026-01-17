'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { SpinnerIcon, ArrowLeftIcon, UsersIcon, ClockIcon, DownloadIcon, EyeIcon } from '@/components/icons'
import { formatDateTimeDisplay } from '@/lib/time'
import { defaultLocale } from '@/i18n/config'
import type { SubmissionListItem, SubmissionDetail } from '@/lib/types/quiz'

export default function QuizSubmissionsPage() {
  const t = useTranslations('admin')
  const locale = useLocale()
  const params = useParams()
  const lang = params.lang as string || defaultLocale
  const slug = params.slug as string
  const isRtl = locale === 'ar'

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submissions, setSubmissions] = useState<SubmissionListItem[]>([])
  const [quizTitle, setQuizTitle] = useState('')
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionDetail | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams()
      if (search) queryParams.append('search', search)
      if (startDate) queryParams.append('startDate', startDate)
      if (endDate) queryParams.append('endDate', endDate)

      const response = await fetch(`/api/admin/quizzes/${slug}/submissions?${queryParams}`)
      const data = await response.json()
      if (data.success) {
        setSubmissions(data.submissions || [])
        setQuizTitle(data.quiz?.title?.[isRtl ? 'ar' : 'en'] || slug)
      } else {
        setError(data.message || 'Failed to load submissions')
      }
    } catch (err) {
      console.error('Failed to fetch submissions:', err)
      setError('Failed to load submissions')
    } finally {
      setIsLoading(false)
    }
  }, [slug, search, startDate, endDate, isRtl])

  useEffect(() => {
    fetchSubmissions()
  }, [fetchSubmissions])

  async function fetchSubmissionDetail(submissionId: string) {
    setIsLoadingDetail(true)
    try {
      const response = await fetch(`/api/admin/quizzes/${slug}/submissions/${submissionId}`)
      const data = await response.json()
      if (data.success) {
        setSelectedSubmission(data.submission)
      } else {
        setError('Failed to load submission details')
      }
    } catch (err) {
      console.error('Failed to fetch submission detail:', err)
      setError('Failed to load submission details')
    } finally {
      setIsLoadingDetail(false)
    }
  }

  const formatDate = (date: Date | string) => {
    return formatDateTimeDisplay(date, isRtl ? 'ar-AE' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const handleExportCSV = () => {
    const headers = ['User Email', 'User Name', 'Submitted At', 'IP Address', 'Duration (seconds)']
    const rows = submissions.map(s => [
      s.userEmail,
      s.firstName + (s.lastName ? ` ${s.lastName}` : ''),
      formatDate(s.submittedAt),
      s.ipAddress || '-',
      s.sessionDurationSeconds?.toString() || '-',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `quiz-${slug}-submissions.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/${lang}/admin/quizzes`}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('viewSubmissions')}</h2>
          <p className="text-gray-600 text-sm">{quizTitle}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 text-red-800">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('searchByEmail')}
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('startDate')}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('endDate')}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={fetchSubmissions}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              {t('search')}
            </button>
            <button
              onClick={() => { setSearch(''); setStartDate(''); setEndDate('') }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t('clear')}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <UsersIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{submissions.length}</p>
            <p className="text-sm text-gray-600">{t('totalSubmissions')}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <ClockIcon className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {formatDuration(
                submissions.reduce((acc, s) => acc + (s.sessionDurationSeconds || 0), 0) /
                  (submissions.length || 1) | 0
              )}
            </p>
            <p className="text-sm text-gray-600">{t('averageDuration')}</p>
          </div>
        </div>
        <div className="flex items-end">
          <button
            onClick={handleExportCSV}
            disabled={submissions.length === 0}
            className="w-full px-4 py-2 bg-white shadow-sm rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <DownloadIcon className="w-4 h-4" />
            {t('exportSubmissions')}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <SpinnerIcon className="animate-spin h-8 w-8 text-primary" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UsersIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('noSubmissions')}
          </h3>
          <p className="text-gray-600">
            {t('noSubmissionsDesc') || 'No one has submitted this quiz yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('user')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('submittedAt')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('ipAddress')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('duration')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {submissions.map((submission) => (
                <tr key={submission.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {submission.firstName} {submission.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{submission.userEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(submission.submittedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {submission.ipAddress || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDuration(submission.sessionDurationSeconds)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => fetchSubmissionDetail(submission.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <EyeIcon className="w-3 h-3" />
                      {t('viewResponses')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">{t('submissionDetails')}</h3>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">{t('submittedBy')}: </span>
                  <span className="text-gray-900">{selectedSubmission.firstName} {selectedSubmission.lastName}</span>
                </div>
                <div>
                  <span className="text-gray-500">{t('submittedAt')}: </span>
                  <span className="text-gray-900">{formatDate(selectedSubmission.submittedAt)}</span>
                </div>
                <div>
                  <span className="text-gray-500">{t('email')}: </span>
                  <span className="text-gray-900">{selectedSubmission.userEmail}</span>
                </div>
                <div>
                  <span className="text-gray-500">{t('duration')}: </span>
                  <span className="text-gray-900">{formatDuration(selectedSubmission.sessionDurationSeconds)}</span>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {selectedSubmission.responses.map((response, index) => (
                <div key={response.questionId} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    {index + 1}. {isRtl ? response.question.ar : response.question.en}
                  </p>
                  <p className="text-sm text-gray-600">
                    {response.answer ? (isRtl ? response.answer.ar : response.answer.en) : response.responseText || '-'}
                    {response.responseValue !== null && ` (${response.responseValue})`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isLoadingDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6">
            <SpinnerIcon className="animate-spin h-8 w-8 text-primary" />
          </div>
        </div>
      )}
    </div>
  )
}
