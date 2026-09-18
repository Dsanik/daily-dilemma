import { Check, Moon, Sunrise } from 'lucide-react'

interface CompletedTodayProps {
  countdown: string
}

export function CompletedToday({ countdown }: CompletedTodayProps) {
  // Определяем время суток для подходящего сообщения
  const hour = new Date().getHours()
  const isEvening = hour >= 18 || hour < 6
  const Icon = isEvening ? Moon : Sunrise
  
  return (
    <div
      className="flex flex-col gap-4 rounded-2xl p-6"
      style={{ backgroundColor: 'var(--app-secondary)' }}
    >
      <div className="flex items-center gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full calm-transition"
          style={{ backgroundColor: 'rgba(22, 163, 74, 0.15)' }}
        >
          <Check size={20} color="#16a34a" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-medium">Решение принято</span>
          <span className="text-sm opacity-70">
            {isEvening 
              ? "Позволь мыслям отстояться до утра" 
              : "Новый день принесёт новые размышления"
            }
          </span>
        </div>
      </div>

      <div
        className="flex items-center justify-center gap-3 rounded-xl px-4 py-3 calm-transition"
        style={{ backgroundColor: 'rgba(128,128,128,0.05)' }}
      >
        <Icon size={16} className="opacity-60" />
        <span className="text-sm opacity-70">
          {isEvening ? "До рассвета идей" : "Время для созерцания"}
        </span>
      </div>
    </div>
  )
}