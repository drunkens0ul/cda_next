'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

interface Answer {
    id: string
    text: { en: string; ar: string }
}

interface Question {
    id: string
    question: { en: string; ar: string }
    answers: Answer[]
}

interface QuizQuestionProps {
    question: Question
    questionNumber: number
    totalQuestions: number
    selectedAnswer: string | undefined
    onNext: (questionId: string, answerId: string) => void
    onPrevious: () => void
    showPrevious: boolean
    isLastQuestion: boolean
    lang: 'en' | 'ar'
}

export default function QuizQuestion({
    question,
    questionNumber,
    totalQuestions,
    selectedAnswer,
    onNext,
    onPrevious,
    showPrevious,
    isLastQuestion,
    lang
}: QuizQuestionProps) {
    const t = useTranslations('quiz')
    const [localSelectedAnswer, setLocalSelectedAnswer] = useState<string | undefined>(selectedAnswer)
    const [error, setError] = useState<string | null>(null)

    const handleNext = () => {
        if (!localSelectedAnswer) {
            setError(t('selectOption'))
            return
        }
        setError(null)
        onNext(question.id, localSelectedAnswer)
    }

    const handleAnswerSelect = (answerId: string) => {
        setLocalSelectedAnswer(answerId)
        setError(null)
    }

    const progress = (questionNumber / totalQuestions) * 100

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Header with Logo and Language Switcher */}
            <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <Link href={`/${lang}`} className="flex items-center gap-3">
                        <Image
                            src="/assets/logo.png"
                            alt="CDA Logo"
                            width={48}
                            height={48}
                            className="h-10 w-auto"
                        />
                        <div className="hidden sm:block h-6 w-px bg-gray-300"></div>
                        <Image
                            src="/assets/logo_newsvg.svg"
                            alt="Dubai Communicates"
                            width={48}
                            height={27}
                            className="hidden sm:block h-7 w-auto"
                        />
                    </Link>

                    {/* Language Toggle */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">{t('currentLanguage')}</span>
                        <button
                            onClick={() => {
                                const newLang = lang === 'en' ? 'ar' : 'en'
                                window.location.href = window.location.href.replace(`/${lang}/`, `/${newLang}/`)
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 border-2 border-gray-300 rounded-lg hover:border-primary transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                            </svg>
                            <span className="text-sm font-medium">{lang === 'en' ? 'ع' : 'EN'}</span>
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="max-w-4xl mx-auto mt-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                            {t('question')} {questionNumber} {t('of')} {totalQuestions}
                        </span>
                        <span className="text-sm font-medium text-primary">
                            {Math.round(progress)}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-primary to-teal-500 h-2.5 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
                <div className="max-w-4xl w-full">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Left Side - Person Image */}
                        <div className="relative rounded-3xl overflow-hidden bg-teal-500 shadow-2xl h-64 md:h-auto min-h-[400px]">
                            <Image
                                src="/assets/quiz.png"
                                alt="Instructor"
                                fill
                                className="object-cover object-center"
                                priority
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                        </div>

                        {/* Right Side - Question and Options */}
                        <div className="flex flex-col justify-center">
                            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8 leading-tight">
                                {question.question[lang]}
                            </h2>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Answer Options */}
                            <div className="space-y-3 mb-8">
                                {question.answers.map((answer) => (
                                    <button
                                        key={answer.id}
                                        onClick={() => handleAnswerSelect(answer.id)}
                                        className={`w-full text-left px-6 py-4 rounded-xl border-2 transition-all transform hover:scale-102 ${localSelectedAnswer === answer.id
                                                ? 'border-yellow-400 bg-yellow-50 shadow-lg'
                                                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                                            }`}
                                    >
                                        <span className={`font-medium ${localSelectedAnswer === answer.id ? 'text-gray-900' : 'text-gray-700'
                                            }`}>
                                            {answer.text[lang]}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Navigation Buttons */}
                            <div className="flex gap-3">
                                {showPrevious && (
                                    <button
                                        onClick={onPrevious}
                                        className="px-8 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                                    >
                                        {t('previousQuestion')}
                                    </button>
                                )}
                                <button
                                    onClick={handleNext}
                                    className="flex-1 bg-primary hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                                >
                                    {isLastQuestion ? t('submitQuiz') : t('nextQuestion')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
