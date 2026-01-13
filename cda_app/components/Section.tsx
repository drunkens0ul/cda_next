'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

function Section({ children, id, className, variant = 'default' }: { children: ReactNode; id?: string; className?: string; variant?: 'default' | 'blue' }) {
  const variantStyles = variant === 'blue' ? 'bg-vision' : 'bg-white border-t border-gray-100'

  return (
    <section id={id} className={cn('section-padding', variantStyles, className)}>
      <div className="container-custom">
        {children}
      </div>
    </section>
  )
}

export default memo(Section)
