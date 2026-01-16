'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'

function Badge({ children, variant = 'default', size = 'md', className }: { children: React.ReactNode; variant?: 'default' | 'primary' | 'success' | 'warning'; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const variantStyles = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-teal-100 text-teal-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
  }

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  }

  return (
    <span className={cn('inline-block font-semibold rounded', variantStyles[variant], sizeStyles[size], className)}>
      {children}
    </span>
  )
}

export default memo(Badge)
