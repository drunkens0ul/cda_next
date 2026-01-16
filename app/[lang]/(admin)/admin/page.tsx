'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { defaultLocale } from '@/i18n/config'

export default function AdminPage() {
  const router = useRouter()
  const params = useParams()
  const lang = params.lang as string || defaultLocale

  useEffect(() => {
    router.replace(`/${lang}/admin/users`)
  }, [router, lang])

  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}
