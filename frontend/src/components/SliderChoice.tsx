import { useMemo, useState } from 'react'
import type { SliderNode } from '../types'

interface SliderChoiceProps {
  node: SliderNode
  onConfirm: (value: number, outcomeNodeId: string) => void
}

export function SliderChoice({ node, onConfirm }: SliderChoiceProps) {
  const [value, setValue] = useState(node.defaultValue)

  // Находим текущий шаг — ближайший с threshold ≤ value
  const currentStep = useMemo(() => {
    const sorted = [...node.steps].sort((a, b) => b.threshold - a.threshold)
    return sorted.find((s) => value >= s.threshold) ?? node.steps[0]
  }, [value, node.steps])

  // Определяем цвет — интерполяция между leftColor и rightColor
  const currentColor = useMemo(() => {
    const ratio = value / 100
    return interpolateColor(node.leftColor, node.rightColor, ratio)
  }, [value, node.leftColor, node.rightColor])

  // Определяем outcome по текущему порогу
  const currentOutcomeNodeId = useMemo(() => {
    const sorted = [...node.steps].sort((a, b) => b.threshold - a.threshold)
    const step = sorted.find((s) => value >= s.threshold) ?? node.steps[0]
    return node.outcomes[step.threshold] ?? Object.values(node.outcomes)[0]
  }, [value, node.steps, node.outcomes])

  function handleConfirm() {
    onConfirm(value, currentOutcomeNodeId)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Текущая реплика — реакция интерфейса */}
      <div
        className="flex items-center gap-3 rounded-2xl p-4 transition-colors"
        style={{
          backgroundColor: `${currentColor}15`,
          border: `1px solid ${currentColor}40`,
        }}
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors"
          style={{ backgroundColor: currentColor }}
        >
          <span className="text-sm font-bold text-white tabular-nums">
            {value}
          </span>
        </div>
        <p
          className="text-sm font-medium leading-snug transition-colors"
          style={{ color: currentColor }}
        >
          {currentStep.label}
        </p>
      </div>

      {/* Слайдер */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="max-w-[45%] text-[11px] font-semibold uppercase tracking-wide opacity-60">
            {node.leftLabel}
          </span>
          <span className="max-w-[45%] text-right text-[11px] font-semibold uppercase tracking-wide opacity-60">
            {node.rightLabel}
          </span>
        </div>

        <div className="relative py-3">
          {/* Фон слайдера */}
          <div
            className="h-2 w-full overflow-hidden rounded-full"
            style={{
              background: `linear-gradient(to right, ${node.leftColor}, ${node.rightColor})`,
            }}
          />

          {/* Родной input слайдера поверх — но прозрачный */}
          <input
            type="range"
            min="0"
            max="100"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="slider-input absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="Шкала выбора"
          />

          {/* Маркер — визуальный */}
          <div
            className="pointer-events-none absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform"
            style={{
              left: `${value}%`,
              backgroundColor: currentColor,
              boxShadow: `0 0 0 4px ${currentColor}30, 0 4px 12px rgba(0,0,0,0.4)`,
            }}
          />
        </div>

        {/* Метки по шкале */}
        <div className="flex justify-between text-[10px] opacity-40">
          <span>0</span>
          <span>25</span>
          <span>50</span>
          <span>75</span>
          <span>100</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleConfirm}
        className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition-opacity active:opacity-80"
        style={{ backgroundColor: currentColor }}
      >
        Подтвердить выбор
      </button>
    </div>
  )
}

/**
 * Линейная интерполяция между двумя hex-цветами.
 */
function interpolateColor(hexA: string, hexB: string, ratio: number): string {
  const a = hexToRgb(hexA)
  const b = hexToRgb(hexB)
  if (!a || !b) return hexA

  const r = Math.round(a.r + (b.r - a.r) * ratio)
  const g = Math.round(a.g + (b.g - a.g) * ratio)
  const bl = Math.round(a.b + (b.b - a.b) * ratio)

  return `rgb(${r}, ${g}, ${bl})`
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return null
  const num = parseInt(clean, 16)
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}