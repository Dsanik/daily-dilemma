import type { ReactNode, HTMLAttributes } from 'react'
import { createElement } from 'react'

type TextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'small'
type TextColor = 'primary' | 'secondary' | 'muted' | 'accent'

interface TypographyProps extends HTMLAttributes<HTMLElement> {
  variant?: TextVariant
  color?: TextColor
  children: ReactNode
  as?: string
}

export function Typography({
  variant = 'body',
  color = 'primary',
  children,
  as,
  className = '',
  style = {},
  ...props
}: TypographyProps) {
  
  const getTextColor = () => {
    switch (color) {
      case 'primary':
        return 'var(--tg-theme-text-color, #f7fafc)'
      case 'secondary':
        return 'var(--tg-theme-text-color, #f7fafc)'
      case 'muted':
        return 'var(--tg-theme-hint-color, #a0aec0)'
      case 'accent':
        return 'var(--tg-theme-button-color, #667eea)'
      default:
        return 'var(--tg-theme-text-color, #f7fafc)'
    }
  }

  const variantStyles = {
    h1: {
      fontSize: 'clamp(1.75rem, 4vw, 2rem)',
      lineHeight: '1.3',
      fontWeight: '700',
      letterSpacing: '-0.025em'
    },
    h2: {
      fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', 
      lineHeight: '1.4',
      fontWeight: '600',
      letterSpacing: '-0.025em'
    },
    h3: {
      fontSize: 'clamp(1.125rem, 2.5vw, 1.25rem)',
      lineHeight: '1.5',
      fontWeight: '600'
    },
    body: {
      fontSize: 'clamp(0.875rem, 2vw, 1rem)',
      lineHeight: '1.7',
      fontWeight: '400'
    },
    caption: {
      fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
      lineHeight: '1.5',
      fontWeight: '500'
    },
    small: {
      fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)',
      lineHeight: '1.4',
      fontWeight: '400'
    }
  }

  const elementMap = {
    h1: 'h1',
    h2: 'h2', 
    h3: 'h3',
    body: 'p',
    caption: 'span',
    small: 'small'
  }

  const element = as || elementMap[variant]
  
  const combinedStyle = {
    ...variantStyles[variant],
    color: getTextColor(),
    margin: 0,
    ...style
  }

  return createElement(
    element,
    {
      className,
      style: combinedStyle,
      ...props
    },
    children
  )
}