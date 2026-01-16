'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface ConfettiParticle {
    left: number
    top: number
    width: number
    height: number
    backgroundColor: number
    animationDelay: number
    animationDuration: number
    opacity: number
    borderRadius: boolean
    rotate: number
}

const generateConfettiParticles = (): ConfettiParticle[] => {
    return Array.from({ length: 100 }).map(() => ({
        left: Math.random() * 100,
        top: -Math.random() * 20,
        width: Math.random() * 8 + 4,
        height: Math.random() * 8 + 4,
        backgroundColor: Math.random() * 360,
        animationDelay: Math.random() * 3,
        animationDuration: Math.random() * 3 + 2,
        opacity: Math.random() * 0.8 + 0.2,
        borderRadius: Math.random() > 0.5,
        rotate: Math.random() * 360
    }))
}

interface QuizCompletionProps {
    lang: 'en' | 'ar'
    variant?: 'success' | 'alreadySubmitted'
}

export default function QuizCompletion({ lang, variant = 'success' }: QuizCompletionProps) {
    const t = useTranslations('quiz')
    const [showConfetti, setShowConfetti] = useState(true)
    const [confettiParticles] = useState<ConfettiParticle[]>(generateConfettiParticles)
    const isAlreadySubmitted = variant === 'alreadySubmitted'

    useEffect(() => {
        const timer = setTimeout(() => setShowConfetti(false), 5000)
        return () => clearTimeout(timer)
    }, [])

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gray-50">
            {/* Animated Confetti Background */}
            {!isAlreadySubmitted && showConfetti && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {confettiParticles.map((particle, i) => (
                        <div
                            key={i}
                            className="absolute animate-confetti"
                            style={{
                                left: `${particle.left}%`,
                                top: `${particle.top}%`,
                                width: `${particle.width}px`,
                                height: `${particle.height}px`,
                                backgroundColor: `hsl(${particle.backgroundColor}, 70%, 60%)`,
                                animationDelay: `${particle.animationDelay}s`,
                                animationDuration: `${particle.animationDuration}s`,
                                opacity: particle.opacity,
                                borderRadius: particle.borderRadius ? '50%' : '0',
                                transform: `rotate(${particle.rotate}deg)`
                            }}
                        />
                    ))}
                </div>
            )}

            <div className="max-w-4xl w-full relative z-10">
                {/* Header with Logo */}
                <div className="flex justify-center items-center mb-8">
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
                </div>

                {/* Main Completion Card */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                    {/* Success/Info Badge */}
                    <div className={`px-6 py-3 text-center ${isAlreadySubmitted ? 'bg-gradient-to-r from-blue-400 to-blue-500' : 'bg-gradient-to-r from-yellow-400 to-yellow-500'}`}>
                        <div className="flex items-center justify-center gap-2">
                            {isAlreadySubmitted ? (
                                <>
                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-white font-semibold">{t('quizCompleted')}</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-gray-900 font-semibold">{t('completionPercentage')}</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="p-8 lg:p-12 text-center">
                        {/* Completion Icon */}
                        <div className={`mb-6 inline-flex items-center justify-center w-20 h-20 ${isAlreadySubmitted ? 'bg-blue-100' : 'bg-green-100'} rounded-full`}>
                            {isAlreadySubmitted ? (
                                <svg className="w-10 h-10 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3.5V8H5a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1V9a1 1 0 00-1-1h-1V5.5A2.5 2.5 0 0012.5 3h-5zM6 5a1 1 0 00-1 1v3h10V6a1 1 0 00-1-1H6z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>

                        {/* Thank You Title */}
                        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                            {isAlreadySubmitted ? t('quizCompleted') : t('thankYou')}
                        </h1>

                        {/* Feedback Message */}
                        <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
                            {isAlreadySubmitted ? t('alreadySubmitted') : t('feedbackReceived')}
                        </p>

                        {/* Person Image */}
                        <div className="relative mx-auto mb-8 rounded-3xl overflow-hidden bg-teal-500 shadow-2xl w-full max-w-md h-80">
                            <Image
                                src="/assets/quizsomplete.png"
                                alt="Thank You"
                                fill
                                className="object-cover object-center"
                                priority
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                            <Link
                                href={`/${lang}/dashboard`}
                                className="flex-1 bg-primary hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-xl text-center"
                            >
                                {t('backToDashboard')}
                            </Link>
                            <Link
                                href={`/${lang}`}
                                className="flex-1 border-2 border-gray-300 text-gray-700 font-semibold py-3 px-8 rounded-xl hover:bg-gray-50 transition-all text-center"
                            >
                                {t('backToHome')}
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Bottom Confetti Decoration */}
                <div className="mt-8 flex justify-center">
                    <div className="inline-flex gap-3">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div
                                key={i}
                                className="w-3 h-3 rounded-full animate-bounce"
                                style={{
                                    backgroundColor: `hsl(${(i * 360) / 12}, 70%, 60%)`,
                                    animationDelay: `${i * 0.1}s`,
                                    animationDuration: '1.5s'
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(-20vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear infinite;
        }
      `}</style>
        </div>
    )
}
