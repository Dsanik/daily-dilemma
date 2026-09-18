import { useState, useEffect } from 'react'
import { Typography, Card, Spacing } from '../ui'
import { Heart, Brain, Compass, Mountain, Eye, Sparkles } from 'lucide-react'

interface MentalMirrorProps {
  choice: string
  outcome: string
  dilemmaCategory: string
  onComplete: () => void
}

interface Reflection {
  type: 'emotion' | 'thought' | 'value' | 'growth'
  icon: React.ComponentType<any>
  color: string
  question: string
  insight: string
}

const REFLECTIONS: Reflection[] = [
  {
    type: 'emotion',
    icon: Heart,
    color: '#ef4444',
    question: 'Что я почувствовал, принимая это решение?',
    insight: 'Эмоции — компас нашей души'
  },
  {
    type: 'thought',
    icon: Brain,
    color: '#3b82f6',
    question: 'Какие мысли привели меня к этому выбору?',
    insight: 'Осознанность мысли делает нас свободными'
  },
  {
    type: 'value',
    icon: Compass,
    color: '#10b981',
    question: 'Какие ценности проявились в моём решении?',
    insight: 'Ценности — маяки в океане выборов'
  },
  {
    type: 'growth',
    icon: Mountain,
    color: '#8b5cf6',
    question: 'Что это решение говорит о моём росте?',
    insight: 'Каждый выбор формирует нас'
  }
]

export function MentalMirror({ choice, outcome, dilemmaCategory, onComplete }: MentalMirrorProps) {
  const [currentReflection, setCurrentReflection] = useState(0)
  const [ripples, setRipples] = useState<number[]>([])
  const [showInsight, setShowInsight] = useState(false)
  
  useEffect(() => {
    // Создаем волны отражений
    const interval = setInterval(() => {
      setRipples(prev => [...prev, Date.now()].slice(-2))
    }, 2000)
    
    return () => clearInterval(interval)
  }, [])
  
  useEffect(() => {
    // Автоматический переход между размышлениями
    const timer = setTimeout(() => {
      if (currentReflection < REFLECTIONS.length - 1) {
        setCurrentReflection(prev => prev + 1)
        setShowInsight(false)
      } else {
        setShowInsight(true)
      }
    }, 4000)
    
    return () => clearTimeout(timer)
  }, [currentReflection])
  
  const reflection = REFLECTIONS[currentReflection]
  const progress = ((currentReflection + 1) / REFLECTIONS.length) * 100
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 relative">
      {/* Progress indicator */}
      <div className="w-full max-w-md mb-8">
        <div 
          className="h-1 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--calm-border)' }}
        >
          <div
            className="h-full rounded-full calm-transition"
            style={{
              width: `${progress}%`,
              backgroundColor: reflection.color,
              transition: 'width 0.5s ease-out'
            }}
          />
        </div>
      </div>
      
      {/* Content */}
      <Card className="max-w-md text-center">
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Eye size={16} style={{ color: reflection.color }} />
            <Typography variant="caption" style={{ color: reflection.color }}>
              Зеркало {currentReflection + 1} из {REFLECTIONS.length}
            </Typography>
          </div>
          
          <Typography variant="h3" color="accent">
            {reflection.question}
          </Typography>
          
          <Spacing size="sm" />
          
          <Typography variant="body" color="muted" className="italic">
            {choice} → {outcome}
          </Typography>
          
          {showInsight && (
            <>
              <Spacing size="md" />
              <div 
                className="p-4 rounded-xl"
                style={{ backgroundColor: `${reflection.color}10` }}
              >
                <Typography variant="body" style={{ color: reflection.color }}>
                  {reflection.insight}
                </Typography>
              </div>
              
              <Spacing size="lg" />
              
              <button
                onClick={onComplete}
                className="px-8 py-3 rounded-2xl calm-transition calm-scale"
                style={{
                  backgroundColor: reflection.color,
                  color: 'white'
                }}
              >
                <Typography variant="body">
                  Завершить созерцание
                </Typography>
              </button>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}