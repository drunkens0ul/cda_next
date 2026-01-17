interface ChevronDownIconProps {
  className?: string
}

export function ChevronDownIcon({ className = 'w-6 h-6' }: ChevronDownIconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  )
}
