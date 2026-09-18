import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'

interface ThoughtFogProps {
  children: ReactNode
  delay?: number
  duration?: number
  onComplete?: () => void
}

export function ThoughtFog({ 
  children, 
  delay = 500, 
  duration = 2000,
  onComplete 
}: ThoughtFogProps) {
  const [opacity, setOpacity] = useState(0)
  const [blur, setBlur] = useState(20)

  useEffect(() => {
    const timer1 = setTimeout(() => {
      // Начинаем проявление
      const startTime = Date.now()
      
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // Эффект sigmoid для более естественного появления
        const eased = progress < 0.5 
          ? 2 * progress * progress 
          : 1 - 2 * (1 - progress) * (1 - progress)
        
        setOpacity(eased)
        setBlur(20 * (1 - eased))
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        } else if (onComplete) {
          setTimeout(onComplete, 500)
        }
      }
      
      requestAnimationFrame(animate)
    }, delay)

    return () => clearTimeout(timer1)
  }, [delay, duration, onComplete])

  return (
    <div
      className="calm-transition"
      style={{
        opacity,
        filter: `blur(${blur}px)`,
        transform: `translateY(${20 * (1 - opacity)}px)`,
      }}
    >
      {children}
    </div>
  )
}