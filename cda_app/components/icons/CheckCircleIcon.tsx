export function CheckCircleIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"></circle>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12l3 3 5-5"></path>
    </svg>
  )
}
