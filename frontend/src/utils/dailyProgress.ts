import type { DailyProgress, PlayMode } from '../types'

const STORAGE_KEY = 'daily-dilemma-progress-v1'

const DEFAULT: DailyProgress = {
  completedDilemmas: {},
  impulseDilemmas: [],
  playedDates: [],
  currentStreak: 0,
  longestStreak: 0,
  lastPlayedDate: null,
}

export function todayKey(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00').getTime()
  const db = new Date(b + 'T00:00:00').getTime()
  return Math.round((db - da) / 86400000)
}

export function loadProgress(): DailyProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT }
    const parsed = JSON.parse(raw) as Partial<DailyProgress>
    return { ...DEFAULT, ...parsed }
  } catch {
    return { ...DEFAULT }
  }
}

function save(progress: DailyProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    /* ignore */
  }
}

export function markDilemmaCompleted(
  slug: string,
  mode: PlayMode = 'normal',
  isToday: boolean = true,
): DailyProgress {
  const today = todayKey()
  const progress = loadProgress()

  // Импульсные прохождения записываем всегда
  if (mode === 'impulse' && !progress.impulseDilemmas.includes(slug)) {
    progress.impulseDilemmas.push(slug)
  }

  // Дневной прогресс — только при первом прохождении в обычном режиме
  if (progress.completedDilemmas[slug] === today) {
    save(progress)
    return progress
  }

  if (mode === 'normal') {
    progress.completedDilemmas[slug] = today
  } else if (!progress.completedDilemmas[slug]) {
    // если играл только в импульсе — тоже засчитываем день
    progress.completedDilemmas[slug] = today
  }

  // Стрик двигаем только за прохождение дилеммы СЕГОДНЯШНЕГО дня.
  // Прохождение архивных дилемм засчитывается в прогресс/достижения,
  // но не должно продлевать или создавать серию.
  if (isToday) {
    if (!progress.playedDates.includes(today)) {
      progress.playedDates.push(today)
      progress.playedDates.sort()
    }

    if (!progress.lastPlayedDate) {
      progress.currentStreak = 1
    } else if (progress.lastPlayedDate !== today) {
      const gap = daysBetween(progress.lastPlayedDate, today)
      if (gap === 1) {
        progress.currentStreak += 1
      } else if (gap > 1) {
        progress.currentStreak = 1
      }
    }

    progress.lastPlayedDate = today
    progress.longestStreak = Math.max(
      progress.longestStreak,
      progress.currentStreak,
    )
  }

  save(progress)
  return progress
}

export function refreshStreak(
  hasFreeze?: () => boolean,
  consumeFreeze?: () => void,
): DailyProgress {
  const today = todayKey()
  const progress = loadProgress()

  if (!progress.lastPlayedDate) return progress

  const gap = daysBetween(progress.lastPlayedDate, today)
  if (gap > 1 && progress.currentStreak > 0) {
    if (hasFreeze?.() && consumeFreeze) {
      // Заморозка спасает серию: списываем одну штуку и "закрываем"
      // пропущенный период сегодняшним днём — сама серия не сбрасывается.
      consumeFreeze()
      progress.lastPlayedDate = today
    } else {
      progress.currentStreak = 0
    }
    save(progress)
  }

  return progress
}

export function isDilemmaCompletedToday(slug: string): boolean {
  const progress = loadProgress()
  return progress.completedDilemmas[slug] === todayKey()
}

export function msUntilMidnight(): number {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  return midnight.getTime() - now.getTime()
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}