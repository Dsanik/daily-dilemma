import type { Achievement, DailyProgress } from '../types'

export interface AchievementDefinition {
  id: string
  title: string
  description: string
  check: (progress: DailyProgress, totalPlayed: number) => boolean
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: 'first-step',
    title: 'Первый шаг',
    description: 'Прошёл первую дилемму',
    check: (_p, total) => total >= 1,
  },
  {
    id: 'three-days',
    title: 'Три дня подряд',
    description: 'Стрик 3 дня',
    check: (p) => p.longestStreak >= 3,
  },
  {
    id: 'week',
    title: 'Неделя рефлексии',
    description: 'Стрик 7 дней',
    check: (p) => p.longestStreak >= 7,
  },
  {
    id: 'five-dilemmas',
    title: 'Пять выборов',
    description: 'Прошёл 5 разных дилемм',
    check: (_p, total) => total >= 5,
  },
  {
    id: 'ten-dilemmas',
    title: 'Десять выборов',
    description: 'Прошёл 10 разных дилемм',
    check: (_p, total) => total >= 10,
  },
  {
    id: 'instinct',
    title: 'Инстинкт',
    description: 'Прошёл 3 дилеммы в импульсном режиме',
    check: (p) => p.impulseDilemmas.length >= 3,
  },
]

export function getUnlockedAchievements(
  progress: DailyProgress,
  totalPlayed: number,
): Achievement[] {
  const playedDates = progress.playedDates
  const unlockDate = playedDates[playedDates.length - 1] ?? ''
  const unlockTime = unlockDate ? new Date(unlockDate).getTime() : Date.now()

  return ACHIEVEMENT_DEFINITIONS.filter((def) =>
    def.check(progress, totalPlayed),
  ).map((def) => ({
    id: def.id,
    title: def.title,
    description: def.description,
    unlockedAt: unlockTime,
  }))
}

export function getNextAchievement(
  progress: DailyProgress,
  totalPlayed: number,
): AchievementDefinition | null {
  return (
    ACHIEVEMENT_DEFINITIONS.find((def) => !def.check(progress, totalPlayed)) ??
    null
  )
}