import { useState, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'
import { Typography } from '../ui'

interface WeightedChoiceProps {
  children: ReactNode
  onConfirm: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary'
  holdDuration?: number
}

export function WeightedChoice({
  children,
  onConfirm,
  disabled = false,
  variant = 'primary',
  holdDuration = 3000
}: WeightedChoiceProps) {
  const [isHolding, setIsHolding] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  
  const holdStartRef = useRef<number>(0)
  const animationRef = useRef<number | null>(null)
  const timeoutRef = useRef<number | null>(null)

  const startHold = () => {
    if (disabled || isCompleted) return
    
    setIsHolding(true)
    setProgress(0)
    holdStartRef.current = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - holdStartRef.current
      const newProgress = Math.min(elapsed / holdDuration, 1)
      
      setProgress(newProgress)
      
      if (newProgress >= 1) {
        setIsCompleted(true)
        timeoutRef.current = window.setTimeout(() => {
          onConfirm()
        }, 200)
      } else {
        animationRef.current = requestAnimationFrame(animate)
      }
    }
    
    animationRef.current = requestAnimationFrame(animate)
  }

  const endHold = () => {
    if (isCompleted) return
    
    setIsHolding(false)
    setProgress(0)
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const getBackgroundColor = () => {
    if (variant === 'primary') {
      return 'var(--tg-theme-button-color, #667eea)'
    }
    return 'var(--tg-theme-secondary-bg-color, #4a5568)'
  }

  const getTextColor = () => {
    if (variant === 'primary') {
      return 'var(--tg-theme-button-text-color, #ffffff)'
    }
    return 'var(--tg-theme-text-color, #f7fafc)'
  }

  return (
    <div className="relative overflow-hidden">
      <button
        type="button"
        onMouseDown={startHold}
        onMouseUp={endHold}
        onMouseLeave={endHold}
        onTouchStart={startHold}
        onTouchEnd={endHold}
        disabled={disabled}
        className="relative w-full rounded-2xl px-8 py-4 font-medium calm-transition disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          backgroundColor: getBackgroundColor(),
          color: getTextColor(),
          transform: isHolding ? 'scale(0.98)' : 'scale(1)',
        }}
      >
        {/* Progress Fill */}
        <div
          className="absolute inset-0 rounded-2xl calm-transition"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            transform: `scaleX(${progress})`,
            transformOrigin: 'left',
            transition: isHolding ? 'none' : 'transform 0.3s ease-out'
          }}
        />
        
        {/* Content */}
        <div className="relative z-10">
          <Typography variant="body" style={{ color: getTextColor() }}>
            {children}
          </Typography>
          {!isCompleted && (
            <Typography 
              variant="small" 
              className="mt-1 opacity-70"
              style={{ color: getTextColor() }}
            >
              {isHolding ? 'Держи, чтобы подтвердить...' : 'Зажми и подумай'}
            </Typography>
          )}
        </div>
      </button>
    </div>
  )
}