'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { SpinnerIcon, ArrowLeftIcon, UsersIcon, ClockIcon, DownloadIcon, ChartIcon } from '@/components/icons'
import { formatDateTimeDisplay } from '@/lib/time'
import { defaultLocale } from '@/i18n/config'
import type { DetailedAnalytics } from '@/lib/types/quiz'

export default function QuizAnalyticsPage() {
  const t = useTranslations('admin')
  const locale = useLocale()
  const params = useParams()
  const lang = params.lang as string || defaultLocale
  const slug = params.slug as string
  const isRtl = locale === 'ar'

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<DetailedAnalytics | null>(null)
  const [quizTitle, setQuizTitle] = useState('')

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/quizzes/${slug}/analytics`)
      const data = await response.json()
      if (data.success) {
        setAnalytics(data.analytics)
        setQuizTitle(data.quiz?.title?.[isRtl ? 'ar' : 'en'] || slug)
      } else {
        setError(data.message || 'Failed to load analytics')
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
      setError('Failed to load analytics')
    } finally {
      setIsLoading(false)
    }
  }, [slug, isRtl])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return formatDateTimeDisplay(date, isRtl ? 'ar-AE' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-'
    const mins = Math.floor(seconds / 60)
    const secs = Math.round(seconds % 60)
    return `${mins}m ${secs}s`
  }

  const handleExportCSV = () => {
    if (!analytics) return

    const headers = ['Question', 'Answer', 'Response Count', 'Percentage']
    const totalSubmissions = analytics.totalSubmissions || 1

    const rows: string[][] = []

    analytics.responseDistribution.forEach(dist => {
      const questionText = isRtl ? dist.questionText : dist.questionText
      const answerText = isRtl ? dist.answerText : dist.answerText
      const percentage = ((dist.responseCount / totalSubmissions) * 100).toFixed(1)

      rows.push([questionText, answerText, dist.responseCount.toString(), `${percentage}%`])
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `quiz-${slug}-analytics.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <Link
            href={`/${lang}/admin/quizzes`}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">{t('analytics')}</h2>
        </div>
        <div className="flex justify-center py-12">
          <SpinnerIcon className="animate-spin h-8 w-8 text-primary" />
        </div>
      </div>
    )
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
          <h2 className="text-2xl font-bold text-gray-900">{t('analytics')}</h2>
          <p className="text-gray-600 text-sm">{quizTitle}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 text-red-800">
          {error}
        </div>
      )}

      {analytics && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalSubmissions}</p>
                <p className="text-sm text-gray-600">{t('totalSubmissions')}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <ClockIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatDuration(analytics.averageDuration)}</p>
                <p className="text-sm text-gray-600">{t('averageDuration')}</p>
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleExportCSV}
                disabled={analytics.totalSubmissions === 0}
                className="w-full px-4 py-2 bg-white shadow-sm rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <DownloadIcon className="w-4 h-4" />
                {t('exportAnalytics')}
              </button>
            </div>
          </div>

          {analytics.totalSubmissions === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChartIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('noSubmissions')}
              </h3>
              <p className="text-gray-600">
                {t('noAnalyticsData') || 'No submission data available yet.'}
              </p>
            </div>
          ) : (
            <>
              {/* Response Distribution */}
              <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('responseDistribution')}</h3>
                <div className="space-y-6">
                  {Object.entries(
                    analytics.responseDistribution.reduce((acc, dist) => {
                      if (!acc[dist.questionId]) {
                        acc[dist.questionId] = {
                          questionText: dist.questionText,
                          answers: [],
                        }
                      }
                      acc[dist.questionId].answers.push({
                        answerText: dist.answerText,
                        responseCount: dist.responseCount,
                      })
                      return acc
                    }, {} as Record<string, {
                      questionText: string
                      answers: {
                        answerText: string
                        responseCount: number
                      }[]
                    }>)
                  ).map(([questionId, question]) => {
                    const maxCount = Math.max(...question.answers.map(a => a.responseCount))
                    return (
                      <div key={questionId} className="border-b pb-4 last:border-b-0 last:pb-0">
                        <p className="text-sm font-medium text-gray-900 mb-3">
                          {question.questionText}
                        </p>
                        <div className="space-y-2">
                          {question.answers.map((answer, idx) => {
                            const percentage = ((answer.responseCount / analytics.totalSubmissions) * 100).toFixed(1)
                            const barWidth = (answer.responseCount / maxCount) * 100
                            return (
                              <div key={idx} className="flex items-center gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="text-gray-700">{answer.answerText}</span>
                                    <span className="text-gray-500">{answer.responseCount} ({percentage}%)</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-primary h-2 rounded-full"
                                      style={{ width: `${barWidth}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Submissions Over Time */}
              {analytics.submissionsByDate && analytics.submissionsByDate.length > 0 && (
                <div className="bg-white shadow-sm rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{t('submissionsOverTime')}</h3>
                  <div className="space-y-2">
                    {analytics.submissionsByDate.map((item, idx) => {
                      const maxCount = Math.max(...analytics.submissionsByDate.map(d => d.count))
                      const barWidth = (item.count / maxCount) * 100
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="w-28 text-sm text-gray-600">{formatDate(item.date)}</div>
                          <div className="flex-1 flex items-center gap-3">
                            <div className="flex-1 bg-gray-200 rounded-full h-6">
                              <div
                                className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2 text-xs text-white"
                                style={{ width: `${barWidth}%` }}
                              >
                                {item.count}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
