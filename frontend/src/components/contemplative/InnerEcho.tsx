import { useState, useEffect } from 'react'
import { Typography, Card, Spacing } from '../ui'

interface InnerEchoProps {
  choice: string
  outcome: string
  onContinue: () => void
}

export function InnerEcho({ choice, outcome, onContinue }: InnerEchoProps) {
  const [phase, setPhase] = useState<'breath' | 'reflection' | 'integration'>('breath')
  const [breathCycle, setBreathCycle] = useState(0)
  const [ripples, setRipples] = useState<number[]>([])

  useEffect(() => {
    // Breathing phase - 3 cycles
    const breathTimer = setInterval(() => {
      setBreathCycle(prev => {
        if (prev >= 2) {
          setPhase('reflection')
          return prev
        }
        return prev + 1
      })
    }, 4000)

    // Create ripple effects
    const rippleTimer = setInterval(() => {
      setRipples(prev => [...prev, Date.now()].slice(-3))
    }, 1500)

    // Move to integration after reflection
    const phaseTimer = setTimeout(() => {
      if (phase === 'reflection') {
        setPhase('integration')
      }
    }, 12000)

    return () => {
      clearInterval(breathTimer)
      clearInterval(rippleTimer)
      clearTimeout(phaseTimer)
    }
  }, [phase])

  const breathScale = Math.sin(Date.now() / 2000) * 0.1 + 1

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden opacity-20">
        {ripples.map(rippleId => (
          <div
            key={rippleId}
            className="absolute top-1/2 left-1/2 rounded-full border border-current"
            style={{
              animation: 'ripple 3s ease-out forwards',
              transform: 'translate(-50%, -50%)',
              color: 'var(--tg-theme-button-color, #667eea)'
            }}
          />
        ))}
      </div>

      {phase === 'breath' && (
        <div className="text-center">
          <div 
            className="mx-auto w-32 h-32 rounded-full border-2 border-current mb-8 calm-transition"
            style={{ 
              transform: `scale(${breathScale})`,
              borderColor: 'var(--tg-theme-button-color, #667eea)',
            }}
          />
          <Typography variant="h3" color="muted" className="text-center">
            Вдохни... Выдохни...
          </Typography>
          <Typography variant="small" color="muted" className="mt-2">
            Цикл {breathCycle + 1} из 3
          </Typography>
        </div>
      )}

      {phase === 'reflection' && (
        <Card className="max-w-md text-center">
          <Typography variant="caption" color="muted" className="uppercase tracking-wide">
            Твой выбор
          </Typography>
          <Spacing size="sm" />
          <Typography variant="h2" color="accent">
            {choice}
          </Typography>
          <Spacing size="md" />
          <Typography variant="body" color="muted">
            {outcome}
          </Typography>
          <Spacing size="lg" />
          <Typography variant="small" color="muted" className="italic">
            Позволь этому решению отзвучать в твоём сознании...
          </Typography>
        </Card>
      )}

      {phase === 'integration' && (
        <div className="text-center space-y-6">
          <Card className="max-w-sm">
            <Typography variant="body" color="primary" className="text-center">
              Каждое решение формирует того, кем мы становимся
            </Typography>
          </Card>
          
          <button
            onClick={onContinue}
            className="px-8 py-3 rounded-2xl calm-transition calm-scale"
            style={{
              backgroundColor: 'var(--tg-theme-button-color, #667eea)',
              color: 'var(--tg-theme-button-text-color, #ffffff)'
            }}
          >
            <Typography variant="body">
              Продолжить путь
            </Typography>
          </button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes ripple {
            from {
              width: 0;
              height: 0;
              opacity: 1;
            }
            to {
              width: 400px;
              height: 400px;
              opacity: 0;
            }
          }
        `
      }} />
    </div>
  )
}