import { useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Typography } from '../ui'

interface BreathingChoiceProps {
  children: ReactNode
  onConfirm: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary'
  breathCycles?: number // Количество дыхательных циклов для подтверждения
}

export function BreathingChoice({
  children,
  onConfirm,
  disabled = false,
  variant = 'primary',
  breathCycles = 3
}: BreathingChoiceProps) {
  const [isBreathing, setIsBreathing] = useState(false)
  const [currentCycle, setCurrentCycle] = useState(0)
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale')
  const [isCompleted, setIsCompleted] = useState(false)
  const [breathScale, setBreathScale] = useState(1)
  
  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const phaseStartRef = useRef<number>(0)
  
  // Длительность фаз дыхания в миллисекундах
  const INHALE_DURATION = 4000
  const HOLD_DURATION = 2000  
  const EXHALE_DURATION = 6000
  
  const startBreathing = () => {
    if (disabled || isCompleted) return
    
    setIsBreathing(true)
    setCurrentCycle(0)
    setBreathPhase('inhale')
    startTimeRef.current = Date.now()
    phaseStartRef.current = Date.now()
    
    animateBreathing()
  }
  
  const animateBreathing = () => {
    const now = Date.now()
    const phaseElapsed = now - phaseStartRef.current
    
    let newPhase = breathPhase
    let newCycle = currentCycle
    let scale = 1
    
    // Переход между фазами дыхания
    switch (breathPhase) {
      case 'inhale':
        if (phaseElapsed >= INHALE_DURATION) {
          newPhase = 'hold'
          phaseStartRef.current = now
        } else {
          // Плавное увеличение масштаба при вдохе
          scale = 1 + (phaseElapsed / INHALE_DURATION) * 0.3
        }
        break
        
      case 'hold':
        if (phaseElapsed >= HOLD_DURATION) {
          newPhase = 'exhale'
          phaseStartRef.current = now
        } else {
          scale = 1.3 // Держим максимальный размер
        }
        break
        
      case 'exhale':
        if (phaseElapsed >= EXHALE_DURATION) {
          newCycle = currentCycle + 1
          if (newCycle >= breathCycles) {
            // Завершили все циклы
            setIsCompleted(true)
            setIsBreathing(false)
            setTimeout(onConfirm, 300)
            return
          } else {
            // Переходим к следующему циклу
            newPhase = 'inhale'
            phaseStartRef.current = now
          }
        } else {
          // Плавное уменьшение масштаба при выдохе
          scale = 1.3 - (phaseElapsed / EXHALE_DURATION) * 0.3
        }
        break
    }
    
    setBreathPhase(newPhase)
    setCurrentCycle(newCycle)
    setBreathScale(scale)
    
    if (isBreathing && !isCompleted) {
      animationRef.current = requestAnimationFrame(animateBreathing)
    }
  }
  
  const stopBreathing = () => {
    if (isCompleted) return
    
    setIsBreathing(false)
    setCurrentCycle(0)
    setBreathPhase('inhale')
    setBreathScale(1)
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }
  
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])
  
  const getPhaseText = () => {
    switch (breathPhase) {
      case 'inhale': return 'Вдохни...'
      case 'hold': return 'Задержи дыхание...'
      case 'exhale': return 'Выдохни медленно...'
    }
  }
  
  return (
    <div className="relative overflow-hidden">
      <button
        type="button"
        onMouseDown={startBreathing}
        onMouseUp={stopBreathing}
        onMouseLeave={stopBreathing}
        onTouchStart={startBreathing}
        onTouchEnd={stopBreathing}
        disabled={disabled}
        className="relative w-full rounded-2xl px-8 py-6 font-medium calm-transition disabled:opacity-60"
        style={{
          backgroundColor: variant === 'primary' 
            ? 'var(--tg-theme-button-color, #667eea)'
            : 'var(--tg-theme-secondary-bg-color, #4a5568)',
          color: variant === 'primary'
            ? 'var(--tg-theme-button-text-color, #ffffff)'
            : 'var(--tg-theme-text-color, #f7fafc)',
          transform: `scale(${breathScale})`,
        }}
      >
        {/* Дыхательный индикатор */}
        {isBreathing && (
          <div
            className="absolute inset-0 rounded-2xl calm-transition opacity-20"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              animation: breathPhase === 'hold' ? 'pulse 1s ease-in-out infinite alternate' : 'none'
            }}
          />
        )}
        
        <div className="relative z-10 space-y-2">
          <Typography variant="body">
            {children}
          </Typography>
          
          {isBreathing && !isCompleted && (
            <>
              <Typography variant="caption" className="opacity-80 italic">
                {getPhaseText()}
              </Typography>
              <Typography variant="small" className="opacity-60">
                Цикл {currentCycle + 1} из {breathCycles}
              </Typography>
            </>
          )}
          
          {!isBreathing && !isCompleted && (
            <Typography variant="small" className="opacity-70">
              Держи и дыши с выбором
            </Typography>
          )}
        </div>
      </button>
    </div>
  )
}