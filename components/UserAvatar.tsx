'use client'

import { memo } from 'react'

interface UserAvatarProps {
  initials: string
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
}

function UserAvatar({ initials, size = 'md', onClick, className = '' }: UserAvatarProps) {
  return (
    <button
      onClick={onClick}
      className={`
        ${sizeClasses[size]}
        rounded-full
        bg-primary
        text-white
        font-semibold
        flex
        items-center
        justify-center
        cursor-pointer
        hover:bg-primary-700
        transition-colors
        focus:outline-none
        focus:ring-2
        focus:ring-primary
        focus:ring-offset-2
        ${className}
      `}
      aria-label="User menu"
    >
      {initials}
    </button>
  )
}

export default memo(UserAvatar)
