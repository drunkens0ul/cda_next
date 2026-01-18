// ... existing code ...
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
    isSubmitting?: boolean
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
    lang,
    isSubmitting = false
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

    const completedCount = (questionNumber - 1) + (localSelectedAnswer ? 1 : 0)
    const progress = (completedCount / totalQuestions) * 100

    const mainLang = lang
    const subLang = lang === 'en' ? 'ar' : 'en'

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
            {/* Header with Logo and Language Switcher */}
            <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-10 px-4 sm:px-6 lg:px-8 py-4 supports-[backdrop-filter]:bg-white/60">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <Link href={`/${lang}`} className="flex items-center gap-3 transition-opacity hover:opacity-80">
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
                        <span className="text-sm text-gray-600 hidden sm:inline-block">{t('currentLanguage')}</span>
                        <button
                            onClick={() => {
                                const newLang = lang === 'en' ? 'ar' : 'en'
                                window.location.href = window.location.href.replace(`/${lang}/`, `/${newLang}/`)
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg hover:border-primary hover:bg-gray-50 transition-all duration-200 shadow-sm"
                        >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700">{lang === 'en' ? 'ع' : 'EN'}</span>
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="max-w-4xl mx-auto mt-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">
                            {t('question')} <span className="text-gray-900 font-bold">{questionNumber}</span> {t('of')} <span className="text-gray-900 font-bold">{totalQuestions}</span>
                        </span>
                        <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded-full">
                            {Math.round(progress)}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden shadow-inner">
                        <div
                            className="bg-gradient-to-r from-primary to-teal-500 h-2 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 w-full">
                <div className="max-w-5xl w-full">
                    <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
                        {/* Left Side - Image */}
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl h-64 md:h-[500px] w-full group">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10" />
                            <Image
                                src="/assets/quiz.png"
                                alt="Quiz Context"
                                fill
                                className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                                priority
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                        </div>

                        {/* Right Side - Question and Options */}
                        <div className="flex flex-col justify-center h-full">
                            <div className="mb-8 space-y-4">
                                <h2 className="text-2xl lg:text-4xl font-extrabold text-gray-900 leading-tight tracking-tight">
                                    {question.question[mainLang]}
                                </h2>
                                <p className="text-lg lg:text-xl text-gray-500 font-medium leading-relaxed" dir={subLang === 'ar' ? 'rtl' : 'ltr'}>
                                    {question.question[subLang]}
                                </p>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2 animate-pulse">
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            {/* Answer Options */}
                            <div className="space-y-4 mb-8">
                                {question.answers.map((answer) => (
                                    <button
                                        key={answer.id}
                                        onClick={() => handleAnswerSelect(answer.id)}
                                        className={`w-full group relative overflow-hidden rounded-2xl border-2 px-6 py-5 text-left transition-all duration-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 ${localSelectedAnswer === answer.id
                                                ? 'border-primary bg-primary text-white shadow-primary/30'
                                                : 'border-gray-100 bg-white text-gray-700 hover:border-primary/30 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex flex-col gap-1 relative z-10">
                                            <span className={`text-lg font-bold ${localSelectedAnswer === answer.id ? 'text-white' : 'text-gray-900'
                                                }`}>
                                                {answer.text[mainLang]}
                                            </span>
                                            <span className={`text-base ${localSelectedAnswer === answer.id ? 'text-white/90' : 'text-gray-500 group-hover:text-gray-700'
                                                }`} dir={subLang === 'ar' ? 'rtl' : 'ltr'}>
                                                {answer.text[subLang]}
                                            </span>
                                        </div>

                                        {/* Selection Indicator */}
                                        <div className={`absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${localSelectedAnswer === answer.id
                                                ? 'border-white bg-white/20'
                                                : 'border-gray-300 group-hover:border-primary/50'
                                            } ${lang === 'ar' ? 'left-4 right-auto' : ''}`}>
                                            {localSelectedAnswer === answer.id && (
                                                <div className="w-2.5 h-2.5 rounded-full bg-white" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Navigation Buttons */}
                            <div className="flex gap-4 pt-4">
                                {showPrevious && (
                                    <button
                                        onClick={onPrevious}
                                        disabled={isSubmitting}
                                        className="px-6 py-3.5 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-white hover:border-gray-300 hover:text-gray-900 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                                    >
                                        {t('previousQuestion')}
                                    </button>
                                )}
                                <button
                                    onClick={handleNext}
                                    disabled={isSubmitting}
                                    className="flex-1 bg-gradient-to-r from-primary to-primary-700 hover:to-primary-800 text-white font-bold py-3.5 px-8 rounded-xl transition-all transform hover:-translate-y-0.5 shadow-lg shadow-primary/30 hover:shadow-primary/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            {t('submitting')}
                                        </>
                                    ) : (
                                        <>
                                            <span>{isLastQuestion ? t('submitQuiz') : t('nextQuestion')}</span>
                                            {!isLastQuestion && (
                                                <svg className={`w-5 h-5 ${lang === 'ar' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                </svg>
                                            )}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
