import type { ReactNode, ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
  isLoading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  isLoading = false,
  disabled,
  className = '',
  style = {},
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-2xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'text-white shadow-sm',
    secondary: 'shadow-sm',
    ghost: 'shadow-none',
    destructive: 'text-white shadow-sm'
  }
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base'
  }

  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        return 'var(--tg-theme-button-color, #667eea)'
      case 'secondary':
        return 'var(--tg-theme-secondary-bg-color, #4a5568)'
      case 'ghost':
        return 'transparent'
      case 'destructive':
        return 'var(--tg-theme-destructive-text-color, #ef4444)'
      default:
        return 'var(--tg-theme-button-color, #667eea)'
    }
  }

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return 'var(--tg-theme-button-text-color, #ffffff)'
      case 'secondary':
        return 'var(--tg-theme-text-color, #f7fafc)'
      case 'ghost':
        return 'var(--tg-theme-text-color, #f7fafc)'
      case 'destructive':
        return '#ffffff'
      default:
        return 'var(--tg-theme-button-text-color, #ffffff)'
    }
  }

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`
  
  const combinedStyle = {
    backgroundColor: getBackgroundColor(),
    color: getTextColor(),
    ...style
  }

  return (
    <button
      className={combinedClasses}
      style={combinedStyle}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent opacity-60"></div>
          Загрузка...
        </span>
      ) : (
        children
      )}
    </button>
  )
}