'use client'

import { memo } from 'react'

interface RegistrationProgressProps {
  registered: number
  spotsLeft: number | null
  locale?: string
}

function RegistrationProgress({ registered, spotsLeft, locale = 'en' }: RegistrationProgressProps) {
  const isRtl = locale === 'ar'
  const total = registered + (spotsLeft || 0)
  const percentage = total > 0 ? (registered / total) * 100 : 0
  
  const getProgressColor = () => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 70) return 'bg-orange-500'
    return 'bg-primary'
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-gray font-medium">
          {registered.toLocaleString()} {isRtl ? 'مسجل' : 'Registered'}
        </span>
        {spotsLeft !== null && (
          <span className="text-primary font-semibold">
            {spotsLeft.toLocaleString()} {isRtl ? 'مقعد متبقي' : 'spots left'}
          </span>
        )}
      </div>
      
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getProgressColor()} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}

export default memo(RegistrationProgress)