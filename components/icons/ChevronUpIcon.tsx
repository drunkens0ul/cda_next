interface ChevronUpIconProps {
  className?: string
}

export function ChevronUpIcon({ className = 'w-6 h-6' }: ChevronUpIconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
  )
}
