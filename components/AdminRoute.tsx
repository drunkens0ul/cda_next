'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from './providers/AuthProvider'
import { defaultLocale } from '@/i18n/config'

interface AdminRouteProps {
  children: React.ReactNode
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const lang = params.lang as string || defaultLocale

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(`/${lang}/login`)
      } else if (!isAdmin) {
        router.push(`/${lang}/dashboard`)
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, router, lang])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <>{children}</>
}
