import { useMemo } from 'react'
import { Typography, Card, Spacing } from '../ui'
import { Heart, Brain, Compass, Mountain } from 'lucide-react'

interface MentalLandscapeProps {
  decisions: Array<{
    dilemmaId: string
    choice: string
    category: string
    values: string[]
  }>
  onExplore?: (archetype: string) => void
}

interface Archetype {
  id: string
  name: string
  description: string
  color: string
  icon: React.ComponentType<any>
  keywords: string[]
}

const ARCHETYPES: Archetype[] = [
  {
    id: 'heart',
    name: 'Хранитель Сердца',
    description: 'Ты выбираешь эмпатией и состраданием',
    color: '#ef4444',
    icon: Heart,
    keywords: ['сочувствие', 'забота', 'помощь', 'семья', 'друзья']
  },
  {
    id: 'mind', 
    name: 'Искатель Истины',
    description: 'Логика и анализ ведут твои решения',
    color: '#3b82f6',
    icon: Brain,
    keywords: ['анализ', 'факты', 'эффективность', 'справедливость']
  },
  {
    id: 'balance',
    name: 'Мастер Равновесия', 
    description: 'Ты ищешь гармонию во всём',
    color: '#10b981',
    icon: Compass,
    keywords: ['баланс', 'компромисс', 'гармония', 'мудрость']
  },
  {
    id: 'pioneer',
    name: 'Вольный Дух',
    description: 'Ты идёшь своим путём, несмотря ни на что',
    color: '#8b5cf6',
    icon: Mountain,
    keywords: ['свобода', 'риск', 'оригинальность', 'независимость']
  }
]

export function MentalLandscape({ decisions, onExplore }: MentalLandscapeProps) {
  const dominantArchetype = useMemo(() => {
    if (decisions.length === 0) return ARCHETYPES[2] // Default to Balance
    
    // Analyze decision patterns
    const allValues = decisions.flatMap(d => d.values).join(' ').toLowerCase()
    
    const scores = ARCHETYPES.map(archetype => ({
      archetype,
      score: archetype.keywords.reduce((sum, keyword) => {
        return sum + (allValues.includes(keyword) ? 1 : 0)
      }, 0) + Math.random() * 0.5 // Add slight randomness
    }))
    
    return scores.sort((a, b) => b.score - a.score)[0].archetype
  }, [decisions])

  const personalityMap = useMemo(() => {
    const categories: Record<string, number> = {}
    decisions.forEach(d => {
      categories[d.category] = (categories[d.category] || 0) + 1
    })
    
    return Object.entries(categories).map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / decisions.length) * 100)
    }))
  }, [decisions])

  const insights = useMemo(() => {
    if (decisions.length < 3) {
      return ['Продолжай принимать решения, чтобы раскрыть свой ментальный ландшафт']
    }
    
    const recent = decisions.slice(-5)
    const patterns = []
    
    if (recent.every(d => d.values.some(v => v.includes('забот')))) {
      patterns.push('В последних решениях ты проявляешь особую заботу о других')
    }
    
    if (personalityMap.length > 3) {
      patterns.push('Твоё мышление охватывает множество жизненных сфер')
    }
    
    patterns.push(`Твой путь формируется через призму "${dominantArchetype.name.toLowerCase()}"`)
    
    return patterns
  }, [decisions, personalityMap, dominantArchetype])

  return (
    <div className="space-y-6">
      {/* Dominant Archetype */}
      <Card variant="elevated" className="text-center">
        <div 
          className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: `${dominantArchetype.color}20` }}
        >
          <dominantArchetype.icon 
            size={32} 
            color={dominantArchetype.color}
          />
        </div>
        
        <Typography variant="h2" color="accent">
          {dominantArchetype.name}
        </Typography>
        <Spacing size="sm" />
        <Typography variant="body" color="muted" className="max-w-sm mx-auto">
          {dominantArchetype.description}
        </Typography>
        
        {onExplore && (
          <>
            <Spacing size="md" />
            <button
              onClick={() => onExplore(dominantArchetype.id)}
              className="px-6 py-2 rounded-xl calm-transition calm-scale"
              style={{
                backgroundColor: `${dominantArchetype.color}15`,
                color: dominantArchetype.color,
                border: `1px solid ${dominantArchetype.color}30`
              }}
            >
              <Typography variant="caption">
                Исследовать архетип
              </Typography>
            </button>
          </>
        )}
      </Card>

      {/* Personality Distribution */}
      {personalityMap.length > 0 && (
        <Card>
          <Typography variant="h3" className="mb-4">
            Карта твоих решений
          </Typography>
          
          <div className="space-y-3">
            {personalityMap.map(({ category, count, percentage }) => (
              <div key={category} className="flex items-center justify-between">
                <Typography variant="caption" color="muted">
                  {category}
                </Typography>
                <div className="flex items-center gap-2 flex-1 ml-4">
                  <div 
                    className="flex-1 h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: 'var(--calm-border)' }}
                  >
                    <div
                      className="h-full rounded-full calm-transition"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: dominantArchetype.color
                      }}
                    />
                  </div>
                  <Typography variant="small" color="muted" className="tabular-nums">
                    {count}
                  </Typography>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Insights */}
      <Card variant="subtle">
        <Typography variant="h3" className="mb-4">
          Озарения
        </Typography>
        
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div key={index} className="flex items-start gap-3">
              <div 
                className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                style={{ backgroundColor: dominantArchetype.color }}
              />
              <Typography variant="body" color="muted" className="italic">
                {insight}
              </Typography>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}