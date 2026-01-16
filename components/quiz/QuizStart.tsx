'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

interface QuizStartProps {
    title: string
    description: string
    onStart: () => void
    lang: 'en' | 'ar'
}

export default function QuizStart({ title, description, onStart, lang }: QuizStartProps) {
    const t = useTranslations('quiz')

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Confetti Background */}
            <div className="absolute inset-0 pointer-events-none">
                <svg className="absolute w-full h-24 bottom-0 left-0 right-0" viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="confettiGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style={{ stopColor: '#FF6B9D', stopOpacity: 0.6 }} />
                            <stop offset="25%" style={{ stopColor: '#FEC84B', stopOpacity: 0.6 }} />
                            <stop offset="50%" style={{ stopColor: '#12B76A', stopOpacity: 0.6 }} />
                            <stop offset="75%" style={{ stopColor: '#7C3AED', stopOpacity: 0.6 }} />
                            <stop offset="100%" style={{ stopColor: '#3B82F6', stopOpacity: 0.6 }} />
                        </linearGradient>
                    </defs>
                    <g>
                        {/* Confetti particles */}
                        {Array.from({ length: 100 }).map((_, i) => (
                            <circle
                                key={i}
                                cx={Math.random() * 1200}
                                cy={Math.random() * 120}
                                r={Math.random() * 3 + 1}
                                fill={`hsl(${Math.random() * 360}, 70%, 60%)`}
                                opacity={Math.random() * 0.8 + 0.2}
                            />
                        ))}
                    </g>
                </svg>
            </div>

            <div className="max-w-4xl w-full relative z-10">
                {/* Header with Logo */}
                <div className="flex justify-between items-center mb-8">
                    <Link href={`/${lang}`} className="flex items-center gap-3">
                        <Image
                            src="/assets/logo.png"
                            alt="CDA Logo"
                            width={48}
                            height={48}
                            className="h-12 w-auto"
                        />
                        <div className="h-8 w-px bg-gray-300"></div>
                        <Image
                            src="/assets/logo_newsvg.svg"
                            alt="Dubai Communicates"
                            width={48}
                            height={27}
                            className="h-8 w-auto"
                        />
                    </Link>

                    {/* Progress Badge */}
                    <div className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                        0 {t('of')} 5 {t('question')}
                    </div>
                </div>

                {/* Main Content Card */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                    <div className="grid md:grid-cols-2 gap-0">
                        {/* Left Side - Content */}
                        <div className="p-8 lg:p-12 flex flex-col justify-center">
                            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                                {title}
                            </h1>
                            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                                {description}
                            </p>

                            <button
                                onClick={onStart}
                                className="w-full bg-primary hover:bg-primary-700 text-white font-semibold py-4 px-8 rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                            >
                                {t('startQuiz')}
                            </button>
                        </div>

                        {/* Right Side - Image */}
                        <div className="relative h-64 md:h-auto bg-teal-500 rounded-br-3xl overflow-hidden">
                            <Image
                                src="/assets/quizstart.png"
                                alt="Quiz Start"
                                fill
                                className="object-cover object-center"
                                priority
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Confetti */}
                <div className="mt-8 text-center">
                    <div className="inline-flex gap-2">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div
                                key={i}
                                className="w-2 h-2 rounded-full animate-bounce"
                                style={{
                                    backgroundColor: `hsl(${(i * 360) / 8}, 70%, 60%)`,
                                    animationDelay: `${i * 0.1}s`,
                                    animationDuration: '1s'
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
