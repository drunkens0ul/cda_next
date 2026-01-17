'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { SpinnerIcon, PlusIcon, PencilIcon, TrashIcon, UsersIcon, ChartIcon } from '@/components/icons'
import { formatDateTimeDisplay } from '@/lib/time'
import type { QuizListItem } from '@/lib/types/quiz'
import { defaultLocale } from '@/i18n/config'

export default function AdminQuizzesPage() {
  const t = useTranslations('admin')
  const locale = useLocale()
  const params = useParams()
  const lang = params.lang as string || defaultLocale
  const isRtl = locale === 'ar'

  const [quizzes, setQuizzes] = useState<QuizListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingQuizSlug, setDeletingQuizSlug] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchQuizzes()
  }, [])

  async function fetchQuizzes() {
    try {
      const response = await fetch('/api/admin/quizzes')
      const data = await response.json()
      if (data.success && data.quizzes) {
        setQuizzes(data.quizzes)
      }
    } catch (error) {
      console.error('Failed to fetch quizzes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(slug: string) {
    if (!confirm(t('confirmDelete'))) return

    setDeletingQuizSlug(slug)
    setMessage(null)

    try {
      const response = await fetch(`/api/admin/quizzes/${slug}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setQuizzes(quizzes.filter(quiz => quiz.slug !== slug))
        setMessage({ type: 'success', text: t('quizDeleted') })
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to delete quiz' })
      }
    } catch (error) {
      console.error('Failed to delete quiz:', error)
      setMessage({ type: 'error', text: 'Failed to delete quiz' })
    } finally {
      setDeletingQuizSlug(null)
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
        <h2 className="text-2xl font-bold text-gray-900">{t('quizzes')}</h2>
        <Link
          href={`/${lang}/admin/quizzes/create`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          {t('createQuiz')}
        </Link>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {quizzes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {t('noQuizzes')}
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('quizTitle')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('submissions')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('createdAt')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quizzes.map((quiz) => (
                <tr key={quiz.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {isRtl && quiz.titleAr ? quiz.titleAr : quiz.title}
                    </div>
                    <div className="text-sm text-gray-500">{quiz.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      quiz.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {quiz.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {t('submissionCount', { count: quiz.submissionCount || 0 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(quiz.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/${lang}/admin/quizzes/${quiz.slug}/submissions`}
                        className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                        title={t('viewSubmissions')}
                      >
                        <UsersIcon className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/${lang}/admin/quizzes/${quiz.slug}/analytics`}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title={t('analytics')}
                      >
                        <ChartIcon className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/${lang}/admin/quizzes/${quiz.slug}/edit`}
                        className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                        title={t('editQuiz')}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(quiz.slug)}
                        disabled={deletingQuizSlug === quiz.slug}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title={t('deleteQuiz')}
                      >
                        {deletingQuizSlug === quiz.slug ? (
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
