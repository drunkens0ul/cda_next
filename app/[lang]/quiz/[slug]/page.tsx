'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import QuizStart from '@/components/quiz/QuizStart'
import QuizQuestion from '@/components/quiz/QuizQuestion'
import QuizCompletion from '@/components/quiz/QuizCompletion'
import { SpinnerIcon } from '@/components/icons'

interface QuizAnswer {
    id: string
    text: { en: string; ar: string }
}

interface QuizQuestion {
    id: string
    question: { en: string; ar: string }
    answers: QuizAnswer[]
}

interface Quiz {
    id: string
    slug: string
    title: { en: string; ar: string }
    description: { en: string; ar: string }
    questions: QuizQuestion[]
    allowMultipleSubmissions: boolean
    eventId?: string | null
    userStatus?: {
        hasSubmitted: boolean
        allowMultipleSubmissions: boolean
    } | null
    attemptInfo?: {
        attemptId: string
        currentQuestionIndex: number
        startedAt: Date
        totalActiveSeconds: number
        responses: Array<{ questionId: string; answerId: string }>
    } | null
}

export default function QuizPage() {
    const params = useParams()
    const router = useRouter()
    const t = useTranslations('quiz')

    const slug = params.slug as string
    const lang = params.lang as 'en' | 'ar'

    const [isLoading, setIsLoading] = useState(true)
    const [isCheckingAuth, setIsCheckingAuth] = useState(true)
    const [quiz, setQuiz] = useState<Quiz | null>(null)
    const [currentStep, setCurrentStep] = useState<'start' | 'question' | 'complete' | 'already_submitted' | 'error'>('start')
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [attemptId, setAttemptId] = useState<string | null>(null)
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [loadingError, setLoadingError] = useState<string | null>(null)
    const activityTimerRef = useRef<NodeJS.Timeout | null>(null)

    // Activity tracking
    const startActivityTracking = (currentAttemptId: string) => {
        // Clear existing timer if any
        if (activityTimerRef.current) {
            clearInterval(activityTimerRef.current)
        }

        // Update activity every 30 seconds
        activityTimerRef.current = setInterval(async () => {
            if (document.visibilityState === 'visible') {
                try {
                    await fetch('/api/quiz/update-activity', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ attemptId: currentAttemptId })
                    })
                } catch (error) {
                    console.error('Failed to update activity:', error)
                }
            }
        }, 30000)
    }

    const stopActivityTracking = () => {
        if (activityTimerRef.current) {
            clearInterval(activityTimerRef.current)
            activityTimerRef.current = null
        }
    }

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopActivityTracking()
        }
    }, [])

    // Handle visibility changes
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && attemptId) {
                startActivityTracking(attemptId)
            } else {
                stopActivityTracking()
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [attemptId])

    // Check authentication
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/auth/session', {
                    credentials: 'include',
                })
                const data = await response.json()
                if (!data.user) {
                    const returnTo = `/${lang}/quiz/${slug}`
                    router.replace(`/${lang}/login?returnTo=${encodeURIComponent(returnTo)}`)
                    return
                }
            } catch (error) {
                console.error('Auth check failed:', error)
                router.replace(`/${lang}/login`)
                return
            }
            setIsCheckingAuth(false)
        }
        checkAuth()
    }, [lang, slug, router])

    // Fetch quiz data from API
    useEffect(() => {
        if (isCheckingAuth) return

        const fetchQuiz = async () => {
            setIsLoading(true)
            setLoadingError(null)
            try {
                const response = await fetch(`/api/quiz/${slug}`)

                if (!response.ok) {
                    let errorMessage = t('quizNotFound')
                    if (response.status === 403) {
                        errorMessage = t('quizInactive')
                    }
                    setLoadingError(errorMessage)
                    setCurrentStep('error')
                    return
                }

                const data = await response.json()
                setQuiz(data)

                // Check if user already submitted
                if (data.userStatus?.hasSubmitted && !data.allowMultipleSubmissions) {
                    setCurrentStep('already_submitted')
                } else if (data.attemptInfo) {
                    // Resume existing attempt
                    setAttemptId(data.attemptInfo.attemptId)
                    setCurrentQuestionIndex(data.attemptInfo.currentQuestionIndex)
                    const responsesMap = data.attemptInfo.responses.reduce((acc: Record<string, string>, r: { questionId: string; answerId: string }) => ({
                        ...acc,
                        [r.questionId]: r.answerId
                    }), {})
                    setAnswers(responsesMap)
                    setCurrentStep('question')
                    startActivityTracking(data.attemptInfo.attemptId)
                }
            } catch (error) {
                console.error('Failed to fetch quiz:', error)
                setLoadingError(t('errorOccurred'))
                setCurrentStep('error')
            } finally {
                setIsLoading(false)
            }
        }

        fetchQuiz()
    }, [slug, lang, isCheckingAuth, router, t])

    const handleStartQuiz = async () => {
        if (!quiz) return

        try {
            const response = await fetch('/api/quiz/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ quizId: quiz.id })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to start quiz')
            }

            const data = await response.json()
            setAttemptId(data.attemptId)
            setCurrentStep('question')
            setCurrentQuestionIndex(data.currentQuestionIndex)
            startActivityTracking(data.attemptId)

            // Save to localStorage for recovery
            localStorage.setItem(`quiz_attempt_${quiz.id}`, data.attemptId)
        } catch (error) {
            console.error('Failed to start quiz:', error)
            const errorMessage = error instanceof Error ? error.message : 'Failed to start quiz'
            setLoadingError(errorMessage)
            setCurrentStep('error')
        }
    }

    const handleNextQuestion = async (questionId: string, answerId: string) => {
        if (!attemptId) return

        setAnswers(prev => ({ ...prev, [questionId]: answerId }))

        try {
            const response = await fetch('/api/quiz/submit-answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ attemptId, questionId, answerId })
            })

            if (!response.ok) {
                const errorData = await response.json()

                if (response.status === 409 && errorData.error === 'questionAlreadyAnswered') {
                    setSubmitError(t('questionAlreadyAnswered'))
                    setTimeout(() => {
                        const nextIndex = currentQuestionIndex + 1
                        if (quiz && nextIndex < quiz.questions.length) {
                            setSubmitError(null)
                            setCurrentQuestionIndex(nextIndex)
                        }
                    }, 2000)
                    return
                }

                throw new Error(errorData.error || 'Failed to submit answer')
            }

            const data = await response.json()

            if (data.isComplete) {
                await handleSubmit()
            } else {
                setCurrentQuestionIndex(data.nextQuestionIndex)
            }
        } catch (error) {
            console.error('Failed to submit answer:', error)
            const errorMessage = error instanceof Error ? error.message : 'Failed to submit answer'
            setSubmitError(errorMessage)
        }
    }

    const handlePreviousQuestion = () => {
        // Removed - no going back in progressive submission mode
    }

    const handleSubmit = async () => {
        if (!attemptId || !quiz) return

        setIsSubmitting(true)
        setSubmitError(null)
        stopActivityTracking()

        try {
            const response = await fetch('/api/quiz/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    attemptId,
                    eventId: quiz.eventId
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                let errorMessage = errorData.error || t('submissionFailed')

                // Handle specific error types
                if (response.status === 401) {
                    errorMessage = t('loginRequired')
                    setTimeout(() => {
                        const returnTo = `/${lang}/quiz/${slug}`
                        router.replace(`/${lang}/login?returnTo=${encodeURIComponent(returnTo)}`)
                    }, 2000)
                } else if (errorMessage.includes('already submitted')) {
                    errorMessage = t('alreadySubmitted')
                    setTimeout(() => setCurrentStep('already_submitted'), 1500)
                }

                throw new Error(errorMessage)
            }

            // Clear localStorage
            if (quiz) {
                localStorage.removeItem(`quiz_attempt_${quiz.id}`)
            }

            setCurrentStep('complete')
        } catch (error) {
            console.error('Failed to submit quiz:', error)
            const errorMessage = error instanceof Error ? error.message : t('submissionFailed')
            setSubmitError(errorMessage)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleRetrySubmit = () => {
        handleSubmit()
    }

    if (isCheckingAuth || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <SpinnerIcon className="animate-spin h-8 w-8 text-primary" />
            </div>
        )
    }

    if (loadingError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">{loadingError}</h2>
                    <button
                        onClick={() => router.push(`/${lang}`)}
                        className="w-full bg-primary hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-xl transition-all"
                    >
                        {t('backToHome')}
                    </button>
                </div>
            </div>
        )
    }

    if (!quiz) {
        return null
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {currentStep === 'start' && (
                <QuizStart
                    title={quiz.title[lang]}
                    description={quiz.description[lang]}
                    onStart={handleStartQuiz}
                    lang={lang}
                    totalQuestions={quiz.questions.length}
                />
            )}

            {currentStep === 'question' && quiz.questions[currentQuestionIndex] && (
                <div>
                    {submitError && (
                        <div className="fixed top-0 left-0 right-0 z-50 bg-red-50 border-b border-red-200 px-4 py-4">
                            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                                <div className="flex-1">
                                    <p className="text-red-800 font-semibold">{submitError}</p>
                                    <p className="text-red-600 text-sm mt-1">{t('submissionFailedDesc')}</p>
                                </div>
                                <button
                                    onClick={handleRetrySubmit}
                                    className="px-4 py-2 bg-primary hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
                                >
                                    {t('tryAgain')}
                                </button>
                            </div>
                        </div>
                    )}
                    <QuizQuestion
                        key={quiz.questions[currentQuestionIndex].id}
                        question={quiz.questions[currentQuestionIndex]}
                        questionNumber={currentQuestionIndex + 1}
                        totalQuestions={quiz.questions.length}
                        selectedAnswer={answers[quiz.questions[currentQuestionIndex].id]}
                        onNext={handleNextQuestion}
                        onPrevious={handlePreviousQuestion}
                        showPrevious={false}
                        isLastQuestion={currentQuestionIndex === quiz.questions.length - 1}
                        lang={lang}
                        isSubmitting={isSubmitting}
                    />
                </div>
            )}

            {currentStep === 'complete' && (
                <QuizCompletion lang={lang} />
            )}

            {currentStep === 'already_submitted' && (
                <QuizCompletion lang={lang} variant="alreadySubmitted" />
            )}
        </div>
    )
}
