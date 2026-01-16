interface LocationIconProps {
  className?: string
}

export function LocationIcon({ className = 'w-6 h-6' }: LocationIconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.5 18L15.5 20L20 15.5M20.9851 11.5499C20.995 11.3678 21 11.1845 21 11C21 5.47715 16.5228 1 11 1C5.47715 1 1 5.47715 1 11C1 16.4354 5.33651 20.858 10.7385 20.9966M11 5V11L14.7384 12.8692" stroke="#0057B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>

  )
}
