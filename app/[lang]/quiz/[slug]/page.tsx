'use client'

import { useState, useEffect } from 'react'
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
    const [currentStep, setCurrentStep] = useState<'start' | 'question' | 'complete'>('start')
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<string, string>>({})

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
            try {
                const response = await fetch(`/api/quiz/${slug}`)

                if (!response.ok) {
                    console.error('Failed to fetch quiz:', response.statusText)
                    router.push(`/${lang}`)
                    return
                }

                const data = await response.json()
                setQuiz(data)
            } catch (error) {
                console.error('Failed to fetch quiz:', error)
                router.push(`/${lang}`)
            } finally {
                setIsLoading(false)
            }
        }

        fetchQuiz()
    }, [slug, lang, isCheckingAuth, router])

    const handleStartQuiz = () => {
        setCurrentStep('question')
        setCurrentQuestionIndex(0)
    }

    const handleNextQuestion = (questionId: string, answerId: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: answerId }))

        if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1)
        } else {
            handleSubmit({ ...answers, [questionId]: answerId })
        }
    }

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1)
        }
    }

    const handleSubmit = async (finalAnswers: Record<string, string>) => {
        try {
            // Convert answers to API format
            const responses = Object.entries(finalAnswers).map(([questionId, answerId]) => ({
                questionId,
                answerId
            }))

            const response = await fetch('/api/quiz/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    quizId: quiz?.id,
                    responses
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to submit quiz')
            }

            setCurrentStep('complete')
        } catch (error) {
            console.error('Failed to submit quiz:', error)
            // Still show completion for better UX, but log the error
            setCurrentStep('complete')
        }
    }

    if (isCheckingAuth || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <SpinnerIcon className="animate-spin h-8 w-8 text-primary" />
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
                />
            )}

            {currentStep === 'question' && quiz.questions[currentQuestionIndex] && (
                <QuizQuestion
                    question={quiz.questions[currentQuestionIndex]}
                    questionNumber={currentQuestionIndex + 1}
                    totalQuestions={quiz.questions.length}
                    selectedAnswer={answers[quiz.questions[currentQuestionIndex].id]}
                    onNext={handleNextQuestion}
                    onPrevious={handlePreviousQuestion}
                    showPrevious={currentQuestionIndex > 0}
                    isLastQuestion={currentQuestionIndex === quiz.questions.length - 1}
                    lang={lang}
                />
            )}

            {currentStep === 'complete' && (
                <QuizCompletion lang={lang} />
            )}
        </div>
    )
}
