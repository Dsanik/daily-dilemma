import { useState, useEffect } from 'react'
import { Typography } from '../ui'
import { Sparkles, Zap, Sun } from 'lucide-react'

interface EnergyIndicatorProps {
  energy: number
  maxEnergy: number
  onRestore?: () => void
}

export function EnergyIndicator({ energy, maxEnergy, onRestore }: EnergyIndicatorProps) {
  const [ripples, setRipples] = useState<number[]>([])
  const energyPercent = Math.max(0, Math.min(100, (energy / maxEnergy) * 100))
  
  useEffect(() => {
    // Создаем волны энергии
    const interval = setInterval(() => {
      if (energyPercent > 75) {
        setRipples(prev => [...prev, Date.now()].slice(-2))
      }
    }, 3000)
    
    return () => clearInterval(interval)
  }, [energyPercent])
  
  const getEnergyColor = () => {
    if (energyPercent > 75) return '#10b981' // Зеленый
    if (energyPercent > 50) return '#f59e0b' // Янтарный
    if (energyPercent > 25) return '#ef4444' // Красный
    return '#6b7280' // Серый
  }
  
  const getEnergyIcon = () => {
    if (energyPercent > 75) return Sun
    if (energyPercent > 25) return Zap
    return Sparkles
  }
  
  const getEnergyText = () => {
    if (energyPercent > 75) return "Энергия переполняет"
    if (energyPercent > 50) return "Готов к размышлениям"
    if (energyPercent > 25) return "Нужна передышка"
    return "Время для восстановления"
  }
  
  const Icon = getEnergyIcon()
  const color = getEnergyColor()
  
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl relative overflow-hidden"
         style={{ backgroundColor: `${color}10` }}>
      
      {/* Background ripples for high energy */}
      {ripples.map(rippleId => (
        <div
          key={rippleId}
          className="absolute top-1/2 left-1/2 rounded-full border opacity-20"
          style={{
            animation: 'energy-ripple 2s ease-out forwards',
            transform: 'translate(-50%, -50%)',
            borderColor: color
          }}
        />
      ))}
      
      <div className="relative z-10 flex items-center gap-3 w-full">
        {/* Energy Icon */}
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center calm-transition"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon 
            size={20} 
            color={color}
            style={{
              filter: energyPercent > 75 ? 'drop-shadow(0 0 8px currentColor)' : 'none'
            }}
          />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <Typography variant="caption" style={{ color }}>
              Энергия размышлений
            </Typography>
            <Typography variant="small" color="muted">
              {Math.round(energyPercent)}%
            </Typography>
          </div>
          
          {/* Energy Bar */}
          <div 
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: `${color}15` }}
          >
            <div
              className="h-full rounded-full calm-transition"
              style={{
                width: `${energyPercent}%`,
                backgroundColor: color,
                boxShadow: energyPercent > 75 ? `0 0 10px ${color}50` : 'none',
                transition: 'all 0.8s ease-out'
              }}
            />
          </div>
          
          <Typography variant="small" color="muted" className="mt-1 italic">
            {getEnergyText()}
          </Typography>
        </div>
        
        {/* Restore button (if needed) */}
        {onRestore && energyPercent < 50 && (
          <button
            onClick={onRestore}
            className="px-3 py-1 rounded-lg calm-transition calm-scale text-xs"
            style={{
              backgroundColor: `${color}20`,
              color: color,
              border: `1px solid ${color}30`
            }}
          >
            Восстановить
          </button>
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes energy-ripple {
            from {
              width: 0;
              height: 0;
              opacity: 0.4;
            }
            to {
              width: 120px;
              height: 120px;
              opacity: 0;
            }
          }
        `
      }} />
    </div>
  )
}