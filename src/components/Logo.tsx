interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const dims = {
    sm: { box: 'h-8 w-8', icon: 16, text: 'text-base' },
    md: { box: 'h-9 w-9', icon: 18, text: 'text-lg' },
    lg: { box: 'h-11 w-11', icon: 22, text: 'text-2xl' },
  }
  const d = dims[size]

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`relative flex ${d.box} items-center justify-center shrink-0`}>
        <svg viewBox="0 0 40 40" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Rounded square background */}
          <rect width="40" height="40" rx="10" fill="#dc2626" />
          {/* Search magnifier circle */}
          <circle cx="17" cy="17" r="8" stroke="white" strokeWidth="2.5" />
          {/* Search handle doubling as a price tag hook */}
          <path d="M23 23 L30 30" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          {/* Percent symbol inside lens - the "deal" indicator */}
          <circle cx="14.5" cy="15" r="1.3" fill="white" />
          <circle cx="19.5" cy="19" r="1.3" fill="white" />
          <path d="M13 20.5 L21 13.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      {showText && (
        <span className={`font-bold tracking-tight ${d.text} text-neutral-900`}>
          Deal<span className="text-primary-600">Find</span>er
        </span>
      )}
    </div>
  )
}
