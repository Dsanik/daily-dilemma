import { Check } from 'lucide-react'

interface CompletedTodayProps {
  countdown: string
}

export function CompletedToday({ countdown }: CompletedTodayProps) {
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl p-5"
      style={{ backgroundColor: 'var(--app-secondary)' }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(22, 163, 74, 0.15)' }}
        >
          <Check size={18} color="#16a34a" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">На сегодня всё</span>
          <span className="text-[11px] opacity-60">
            Ты уже прошёл дилемму дня
          </span>
        </div>
      </div>

      <div
        className="flex items-center justify-between rounded-xl px-3 py-2.5"
        style={{ backgroundColor: 'rgba(128,128,128,0.08)' }}
      >
        <span className="text-[11px] opacity-60">Новая дилемма через</span>
        <span className="text-sm font-bold tabular-nums">{countdown}</span>
      </div>
    </div>
  )
}