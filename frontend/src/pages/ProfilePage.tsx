import { useEffect, useState } from 'react'
import { Flame, Trophy, Target, Sparkles, Coins, ShoppingBag } from 'lucide-react'
import { loadProgress } from '../utils/dailyProgress'
import { useProgress } from '../contexts/ProgressContext'
import { allDilemmas } from '../data/dilemmas'
import { categories } from '../data/categories'
import {
  getUnlockedAchievements,
  getNextAchievement,
} from '../utils/achievements'
import { StreakBadge } from '../components/StreakBadge'
import { ShopPage } from './ShopPage'
import type { DailyProgress } from '../types'

export function ProfilePage() {
  const [progress, setProgress] = useState<DailyProgress>(() => loadProgress())
  const { state } = useProgress()
  const [showShop, setShowShop] = useState(false)

  useEffect(() => {
    setProgress(loadProgress())
  }, [])

  if (showShop) {
    return <ShopPage onClose={() => setShowShop(false)} />
  }

  const totalPlayed = Object.keys(progress.completedDilemmas).length
  const totalDilemmas = allDilemmas.length
  const achievements = getUnlockedAchievements(progress, totalPlayed)
  const nextAchievement = getNextAchievement(progress, totalPlayed)

  const categoryStats = categories.map((cat) => {
    const inCategory = allDilemmas.filter((d) => d.meta?.category === cat.id)
    const played = inCategory.filter(
      (d) => progress.completedDilemmas[d.slug],
    ).length
    return {
      ...cat,
      total: inCategory.length,
      played,
      percent:
        inCategory.length === 0
          ? 0
          : Math.round((played / inCategory.length) * 100),
    }
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Профиль</h1>
          <p className="mt-1 text-xs opacity-60">
            Пройдено {totalPlayed} из {totalDilemmas}
          </p>
        </div>
        <StreakBadge
          streak={progress.currentStreak}
          longestStreak={progress.longestStreak}
        />
      </div>

      {/* Цифры: стрик, рекорд, монеты */}
      <div
        className="grid grid-cols-3 gap-2 rounded-2xl p-4"
        style={{ backgroundColor: 'var(--app-secondary)' }}
      >
        <div className="flex flex-col items-center gap-1">
          <Flame size={20} color="#f97316" />
          <span className="text-lg font-bold tabular-nums">
            {progress.currentStreak}
          </span>
          <span className="text-[10px] opacity-60">текущий стрик</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Trophy size={20} color="#fbbf24" />
          <span className="text-lg font-bold tabular-nums">
            {progress.longestStreak}
          </span>
          <span className="text-[10px] opacity-60">рекорд</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Coins size={20} color="#fbbf24" />
          <span className="text-lg font-bold tabular-nums">
            {state.coins}
          </span>
          <span className="text-[10px] opacity-60">монет</span>
        </div>
      </div>

      {/* Кнопка магазина */}
      <button
        type="button"
        onClick={() => setShowShop(true)}
        className="flex items-center justify-between gap-3 rounded-2xl p-4 text-left transition-opacity active:opacity-80"
        style={{ backgroundColor: 'var(--app-secondary)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: '#fbbf24' }}
          >
            <ShoppingBag size={18} color="#ffffff" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Магазин</span>
            <span className="text-[11px] opacity-60">
              Заморозка, второй шанс, премиум-карточка
            </span>
          </div>
        </div>
        <span
          className="shrink-0 rounded-full px-3 py-1 text-xs font-bold tabular-nums"
          style={{ backgroundColor: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24' }}
        >
          {state.coins} 🪙
        </span>
      </button>

      {/* Индикатор активной заморозки */}
      {state.inventory.streakFreezes > 0 && (
        <div
          className="flex items-center gap-3 rounded-2xl p-3"
          style={{
            backgroundColor: 'rgba(74, 158, 255, 0.12)',
            border: '1px solid rgba(74, 158, 255, 0.3)',
          }}
        >
          <span className="text-lg">❄️</span>
          <div className="flex flex-col">
            <span className="text-xs font-semibold" style={{ color: '#4a9eff' }}>
              Заморозка активна: {state.inventory.streakFreezes}
            </span>
            <span className="text-[10px] opacity-60">
              Если пропустишь день — серия не сбросится
            </span>
          </div>
        </div>
      )}

      {/* Карта тем */}
      <div
        className="flex flex-col gap-3 rounded-2xl p-4"
        style={{ backgroundColor: 'var(--app-secondary)' }}
      >
        <div className="flex items-center gap-2">
          <Target size={16} className="opacity-60" />
          <p className="text-[10px] font-semibold uppercase tracking-wide opacity-50">
            Карта тем
          </p>
        </div>
        <div className="flex flex-col gap-2.5">
          {categoryStats.map((cat) => (
            <div key={cat.id} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium">{cat.label}</span>
                <span className="text-[11px] opacity-60 tabular-nums">
                  {cat.played}/{cat.total}
                </span>
              </div>
              <div
                className="h-1.5 w-full overflow-hidden rounded-full"
                style={{ backgroundColor: 'rgba(128,128,128,0.15)' }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${cat.percent}%`,
                    backgroundColor: cat.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Достижения */}
      <div
        className="flex flex-col gap-3 rounded-2xl p-4"
        style={{ backgroundColor: 'var(--app-secondary)' }}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="opacity-60" />
          <p className="text-[10px] font-semibold uppercase tracking-wide opacity-50">
            Достижения
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className="flex items-start gap-3 rounded-lg p-2.5"
              style={{ backgroundColor: 'rgba(74, 158, 255, 0.08)' }}
            >
              <div
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: 'var(--app-accent)' }}
              >
                <Trophy size={12} color="#ffffff" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold">{ach.title}</span>
                <span className="text-[10px] opacity-60">
                  {ach.description}
                </span>
              </div>
            </div>
          ))}

          {achievements.length === 0 && (
            <p className="text-xs opacity-50">
              Пока нет достижений. Пройди первую дилемму!
            </p>
          )}
        </div>

        {nextAchievement && (
          <div
            className="mt-1 flex items-start gap-3 rounded-lg p-2.5 opacity-70"
            style={{ backgroundColor: 'rgba(128,128,128,0.08)' }}
          >
            <div
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: 'rgba(128,128,128,0.3)' }}
            >
              <Trophy size={12} color="#ffffff" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold">
                Следующая: {nextAchievement.title}
              </span>
              <span className="text-[10px] opacity-60">
                {nextAchievement.description}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}