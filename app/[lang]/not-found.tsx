"use client"

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
 
export default function NotFound() {
  const t = useTranslations('NotFound')
 
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Main Content with Gradient Background */}
      <div className="flex-1 flex items-center justify-center px-4 py-16 bg-gradient-to-b from-blue-50 via-white to-blue-50">
        <div className="max-w-3xl w-full text-center">
          
          {/* 404 SVG Illustration - Smaller */}
          <div className="mb-8">
            <div className="w-full max-w-lg mx-auto">
              <Image
                src="/assets/404.svg"
                alt="404 Illustration"
                width={600}
                height={400}
                className="w-full h-auto"
                priority
              />
            </div>
          </div>
 
          {/* Error Message */}
          <div className="mb-10">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">
              {t('title') || "We can't find this page"}
            </h1>
            <p className="text-lg text-gray-600 max-w-md mx-auto">
              {t('description') || "We couldn't load this page right now."}
            </p>
          </div>
 
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-base px-8 py-3 rounded-lg inline-flex items-center justify-center gap-2 min-w-[140px] transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              {t('goHome') || 'Go Home'}
            </Link>
 
            <button
              onClick={() => window.history.back()}
              className="bg-white hover:bg-gray-50 text-blue-600 font-medium text-base px-8 py-3 rounded-lg inline-flex items-center justify-center gap-2 min-w-[140px] border-2 border-blue-600 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              {t('goBack') || 'Go Back'}
            </button>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}