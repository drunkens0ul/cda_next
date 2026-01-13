'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'

function Button({ children, variant = 'default', size = 'md', className, ...props }: { children: React.ReactNode; variant?: 'default' | 'primary' | 'secondary' | 'outline'; size?: 'sm' | 'md' | 'lg'; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const variantStyles = {
    default: 'bg-gray-600 text-white hover:bg-gray-700',
    primary: 'bg-primary-600 text-white hover:bg-primary-700',
    secondary: 'bg-teal-600 text-white hover:bg-teal-700',
    outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50',
  }

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button className={cn('font-medium rounded-lg transition-colors', variantStyles[variant], sizeStyles[size], className)} {...props}>
      {children}
    </button>
  )
}

export default memo(Button)
