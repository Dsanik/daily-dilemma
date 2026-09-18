import type { ReactNode, HTMLAttributes } from 'react'

type CardVariant = 'default' | 'elevated' | 'outlined' | 'subtle'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  children: ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({
  variant = 'default',
  children,
  padding = 'md',
  className = '',
  style = {},
  ...props
}: CardProps) {
  const baseClasses = 'rounded-2xl'
  
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  const getBackgroundColor = () => {
    switch (variant) {
      case 'default':
        return 'var(--tg-theme-secondary-bg-color, #4a5568)'
      case 'elevated':
        return 'var(--tg-theme-secondary-bg-color, #4a5568)'
      case 'outlined':
        return 'transparent'
      case 'subtle':
        return 'rgba(128, 128, 128, 0.08)'
      default:
        return 'var(--tg-theme-secondary-bg-color, #4a5568)'
    }
  }

  const getBorder = () => {
    if (variant === 'outlined') {
      return '1px solid rgba(128, 128, 128, 0.2)'
    }
    return 'none'
  }

  const getShadow = () => {
    if (variant === 'elevated') {
      return '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    }
    return 'none'
  }

  const combinedClasses = `${baseClasses} ${paddingClasses[padding]} ${className}`
  
  const combinedStyle = {
    backgroundColor: getBackgroundColor(),
    border: getBorder(),
    boxShadow: getShadow(),
    ...style
  }

  return (
    <div
      className={combinedClasses}
      style={combinedStyle}
      {...props}
    >
      {children}
    </div>
  )
}