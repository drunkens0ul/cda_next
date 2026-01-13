interface ChevronLeftIconProps {
  className?: string
}

export function ChevronLeftIcon({ className = 'w-6 h-6' }: ChevronLeftIconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  )
}
