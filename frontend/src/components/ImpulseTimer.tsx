import { useEffect, useRef, useState } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'
import { TENSION_SECONDS, type Tension } from '../types'

interface ImpulseTimerProps {
  tension: Tension
  onExpire: () => void
  paused?: boolean
  resetKey?: string | number
  hasSecondChance?: () => boolean
  consumeSecondChance?: () => void
}

export function ImpulseTimer({
  tension,
  onExpire,
  paused = false,
  resetKey,
  hasSecondChance,
  consumeSecondChance,
}: ImpulseTimerProps) {
  const totalSeconds = TENSION_SECONDS[tension]
  const [remaining, setRemaining] = useState(totalSeconds)
  const expiredRef = useRef(false)
  const usedSecondChanceRef = useRef(false)
  const [extended, setExtended] = useState(false)

  useEffect(() => {
    setRemaining(totalSeconds)
    expiredRef.current = false
    usedSecondChanceRef.current = false
    setExtended(false)
  }, [resetKey, totalSeconds])

  useEffect(() => {
    if (paused) return
    if (remaining <= 0) {
      if (!expiredRef.current) {
        expiredRef.current = true

        // "Второй шанс" из магазина: если он есть в инвентаре и ещё не
        // использован в этом раунде — списываем один и молча даём +5 сек
        // вместо немедленного истечения таймера.
        if (
          !usedSecondChanceRef.current &&
          hasSecondChance?.() &&
          consumeSecondChance
        ) {
          usedSecondChanceRef.current = true
          consumeSecondChance()
          expiredRef.current = false
          setExtended(true)
          setRemaining(5)
          return
        }

        onExpire()
      }
      return
    }

    const id = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1))
    }, 1000)

    return () => clearInterval(id)
  }, [remaining, paused, onExpire, hasSecondChance, consumeSecondChance])

  const ratio = remaining / totalSeconds
  const size = 44
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - ratio)

  const isCritical = tension === 'critical'
  const isTense = tension === 'tense'

  const color = isCritical ? '#dc2626' : isTense ? '#f59e0b' : '#4a9eff'
  const bg = isCritical
    ? 'rgba(220, 38, 38, 0.12)'
    : isTense
      ? 'rgba(245, 158, 11, 0.12)'
      : 'rgba(74, 158, 255, 0.12)'

  const Icon = isCritical ? AlertTriangle : Clock

  return (
    <div className="flex items-center gap-2">
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size, backgroundColor: bg, borderRadius: 999 }}
      >
        <svg
          width={size}
          height={size}
          className="absolute inset-0 -rotate-90"
          style={{ transform: 'rotate(-90deg)' }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(128,128,128,0.15)"
            strokeWidth={3}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <span
          className="text-sm font-bold tabular-nums"
          style={{ color }}
        >
          {remaining}
        </span>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <Icon size={12} color={color} />
          <span
            className="text-[10px] font-semibold uppercase tracking-wide"
            style={{ color }}
          >
            {isCritical ? 'Критично' : isTense ? 'Напряжение' : 'Спокойно'}
          </span>
        </div>
        <span className="text-[10px] opacity-50">
          {isCritical
            ? 'Решай быстро'
            : isTense
              ? 'Не тяни'
              : 'Можно подумать'}
        </span>
        {extended && (
          <span className="text-[10px] font-semibold" style={{ color: '#4a9eff' }}>
            ⏱ +5 сек — второй шанс
          </span>
        )}
      </div>
    </div>
  )
}