import type { HTMLAttributes } from 'react'

type SpacingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'

interface SpacingProps extends HTMLAttributes<HTMLDivElement> {
  size?: SpacingSize
  horizontal?: boolean
}

export function Spacing({ 
  size = 'md', 
  horizontal = false,
  className = '',
  ...props 
}: SpacingProps) {
  const spacingMap = {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem', 
    lg: '2rem',
    xl: '3rem',
    '2xl': '4rem',
    '3xl': '6rem'
  }

  const spacing = spacingMap[size]
  
  const style = horizontal 
    ? { width: spacing, flexShrink: 0 }
    : { height: spacing, flexShrink: 0 }

  return (
    <div 
      className={className}
      style={style}
      {...props} 
    />
  )
}