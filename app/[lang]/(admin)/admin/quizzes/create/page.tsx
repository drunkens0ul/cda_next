'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { SpinnerIcon, ArrowLeftIcon, PlusIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon } from '@/components/icons'
import type { CreateQuizData, CreateQuestionData, CreateAnswerData } from '@/lib/types/quiz'
import { defaultLocale } from '@/i18n/config'

export default function CreateQuizPage() {
  const t = useTranslations('admin')
  const params = useParams()
  const router = useRouter()
  const lang = params.lang as string || defaultLocale

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [events, setEvents] = useState<{ id: string; title: string; date: string }[]>([])

  const [formData, setFormData] = useState<CreateQuizData>({
    slug: '',
    title: '',
    titleAr: '',
    description: '',
    descriptionAr: '',
    eventId: null,
    isActive: true,
    requiresAuth: true,
    allowMultipleSubmissions: false,
    questions: [],
  })

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch('/api/admin/events')
        const data = await response.json()
        if (data.success && data.events) {
          setEvents(data.events)
        }
      } catch (error) {
        console.error('Failed to fetch events:', error)
      }
    }
    fetchEvents()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
               type === 'number' ? (value ? parseInt(value) : null) : value,
    }))
  }

  const generateSlug = () => {
    const slug = formData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    setFormData(prev => ({ ...prev, slug }))
  }

  const addQuestion = () => {
    const newQuestion: CreateQuestionData = {
      questionOrder: formData.questions.length,
      questionText: '',
      questionTextAr: '',
      questionType: 'multiple_choice',
      isRequired: false,
      answers: [
        { answerOrder: 0, answerText: '', answerTextAr: '', answerValue: null },
        { answerOrder: 1, answerText: '', answerTextAr: '', answerValue: null },
      ],
    }
    setFormData(prev => ({ ...prev, questions: [...prev.questions, newQuestion] }))
  }

  const updateQuestion = (index: number, field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      ),
    }))
  }

  const deleteQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions
        .filter((_, i) => i !== index)
        .map((q, i) => ({ ...q, questionOrder: i })),
    }))
  }

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    setFormData(prev => {
      const questions = [...prev.questions]
      const newIndex = direction === 'up' ? index - 1 : index + 1

      if (newIndex < 0 || newIndex >= questions.length) return prev

      const [removed] = questions.splice(index, 1)
      questions.splice(newIndex, 0, removed)

      return {
        ...prev,
        questions: questions.map((q, i) => ({ ...q, questionOrder: i })),
      }
    })
  }

  const addAnswer = (questionIndex: number) => {
    const newAnswer: CreateAnswerData = {
      answerOrder: formData.questions[questionIndex].answers.length,
      answerText: '',
      answerTextAr: '',
      answerValue: null,
    }
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === questionIndex ? { ...q, answers: [...q.answers, newAnswer] } : q
      ),
    }))
  }

  const updateAnswer = (questionIndex: number, answerIndex: number, field: string, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, qi) =>
        qi === questionIndex
          ? {
              ...q,
              answers: q.answers.map((a, ai) =>
                ai === answerIndex ? { ...a, [field]: value } : a
              ),
            }
          : q
      ),
    }))
  }

  const deleteAnswer = (questionIndex: number, answerIndex: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, qi) =>
        qi === questionIndex
          ? {
              ...q,
              answers: q.answers
                .filter((_, ai) => ai !== answerIndex)
                .map((a, ai) => ({ ...a, answerOrder: ai })),
            }
          : q
      ),
    }))
  }

  const validateForm = (): boolean => {
    if (formData.questions.length === 0) {
      setError(t('atLeastOneQuestion'))
      return false
    }

    for (const q of formData.questions) {
      if (q.questionType === 'multiple_choice' && q.answers.length < 2) {
        setError(t('atLeastTwoAnswers'))
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        router.push(`/${lang}/admin/quizzes`)
      } else {
        setError(data.message || 'Failed to create quiz')
      }
    } catch (error) {
      console.error('Failed to create quiz:', error)
      setError('Failed to create quiz')
    } finally {
      setIsSubmitting(false)
    }
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
        <h2 className="text-2xl font-bold text-gray-900">{t('createQuiz')}</h2>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow-sm rounded-lg p-6 space-y-6">
          <h3 className="text-lg font-medium text-gray-900">{t('quizSettings')}</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('quizSlug')} *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                required
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="quiz-url-slug"
              />
              <button
                type="button"
                onClick={generateSlug}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t('generateFromTitle')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('quizTitleEn')} *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('quizTitleAr')}
              </label>
              <input
                type="text"
                name="titleAr"
                value={formData.titleAr}
                onChange={handleChange}
                dir="rtl"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('quizDescriptionEn')}
              </label>
              <textarea
                name="description"
                value={formData.description ?? ''}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('quizDescriptionAr')}
              </label>
              <textarea
                name="descriptionAr"
                value={formData.descriptionAr ?? ''}
                onChange={handleChange}
                rows={3}
                dir="rtl"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('linkToEvent')}
            </label>
            <select
              name="eventId"
              value={formData.eventId || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">{t('noEventLink')}</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.title} - {new Date(event.date).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                {t('active')}
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="requiresAuth"
                name="requiresAuth"
                checked={formData.requiresAuth}
                onChange={handleChange}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="requiresAuth" className="text-sm font-medium text-gray-700">
                {t('requiresAuth')}
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="allowMultipleSubmissions"
                name="allowMultipleSubmissions"
                checked={formData.allowMultipleSubmissions}
                onChange={handleChange}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="allowMultipleSubmissions" className="text-sm font-medium text-gray-700">
                {t('allowMultiple')}
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">{t('questions')}</h3>
            <button
              type="button"
              onClick={addQuestion}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              {t('addQuestion')}
            </button>
          </div>

          {formData.questions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {t('noQuestionsYet')}
            </div>
          ) : (
            <div className="space-y-4">
              {formData.questions.map((question, qIndex) => (
                <div key={qIndex} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {t('question')} {qIndex + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => moveQuestion(qIndex, 'up')}
                        disabled={qIndex === 0}
                        className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-50"
                      >
                        <ChevronUpIcon className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveQuestion(qIndex, 'down')}
                        disabled={qIndex === formData.questions.length - 1}
                        className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-50"
                      >
                        <ChevronDownIcon className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteQuestion(qIndex)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('questionTextEn')} *
                      </label>
                      <textarea
                        value={question.questionText}
                        onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('questionTextAr')}
                      </label>
                      <textarea
                        value={question.questionTextAr}
                        onChange={(e) => updateQuestion(qIndex, 'questionTextAr', e.target.value)}
                        rows={2}
                        dir="rtl"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('questionType')}
                      </label>
                      <select
                        value={question.questionType}
                        onChange={(e) => updateQuestion(qIndex, 'questionType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="multiple_choice">{t('multipleChoice')}</option>
                        <option value="rating">{t('rating')}</option>
                        <option value="text">{t('text')}</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                      <input
                        type="checkbox"
                        checked={question.isRequired}
                        onChange={(e) => updateQuestion(qIndex, 'isRequired', e.target.checked)}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <label className="text-sm font-medium text-gray-700">
                        {t('isRequired')}
                      </label>
                    </div>
                  </div>

                  {question.questionType === 'multiple_choice' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">{t('answers')}</label>
                        <button
                          type="button"
                          onClick={() => addAnswer(qIndex)}
                          className="text-sm text-primary hover:text-primary/80"
                        >
                          {t('addAnswer')}
                        </button>
                      </div>
                      {question.answers.map((answer, aIndex) => (
                        <div key={aIndex} className="flex gap-2">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={answer.answerText}
                              onChange={(e) => updateAnswer(qIndex, aIndex, 'answerText', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                              placeholder={`${t('answerTextEn')} ${aIndex + 1}`}
                              required
                            />
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={answer.answerTextAr}
                              onChange={(e) => updateAnswer(qIndex, aIndex, 'answerTextAr', e.target.value)}
                              dir="rtl"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                              placeholder={`${t('answerTextAr')} ${aIndex + 1}`}
                            />
                          </div>
                          <div className="w-24">
                            <input
                              type="number"
                              value={answer.answerValue ?? ''}
                              onChange={(e) => updateAnswer(qIndex, aIndex, 'answerValue', e.target.value ? parseInt(e.target.value) : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                              placeholder={t('answerValue') || 'Value'}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteAnswer(qIndex, aIndex)}
                            className="p-2 text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Link
            href={`/${lang}/admin/quizzes`}
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {t('cancel')}
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && <SpinnerIcon className="animate-spin w-4 h-4" />}
            {t('saveQuiz')}
          </button>
        </div>
      </form>
    </div>
  )
}
