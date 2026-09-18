import type { DailyProgress, PlayMode } from '../types'

const STORAGE_KEY = 'daily-dilemma-progress-v1'

const DEFAULT: DailyProgress = {
  completedDilemmas: {},
  contemplativeDilemmas: [],
  playedDates: [],
  mentalLandscapeData: [],
  lastPlayedDate: null,
  currentStreak: 0,
  longestStreak: 0,
  impulseDilemmas: [],
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
  finalOption?: string,
): DailyProgress {
  const today = todayKey()
  const progress = loadProgress()

  // Созерцательные прохождения записываем всегда  
  if (mode === 'contemplative' && !progress.contemplativeDilemmas.includes(slug)) {
    progress.contemplativeDilemmas.push(slug)
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
    
    progress.lastPlayedDate = today
  }

  // Сохраняем данные для ментального ландшафта
  if ((mode === 'contemplative' || mode === 'normal') && finalOption) {
    progress.mentalLandscapeData.push({
      dilemmaId: slug,
      choice: finalOption,
      category: 'general', // TODO: определять категорию из дилеммы
      values: [] // TODO: определять ценности из выбора
    })
    
    // Ограничиваем размер данных (последние 50 решений)
    if (progress.mentalLandscapeData.length > 50) {
      progress.mentalLandscapeData = progress.mentalLandscapeData.slice(-50)
    }
  }

  // Трекинг импульсных дилемм для достижений
  if (mode === 'contemplative' && !progress.impulseDilemmas.includes(slug)) {
    progress.impulseDilemmas.push(slug)
  }

  // Обновление стрика (только для сегодняшних дилемм)
  if (isToday && mode === 'normal') {
    const currentDate = todayKey()
    const lastDate = progress.lastPlayedDate
    
    if (!lastDate) {
      // Первый раз играет
      progress.currentStreak = 1
    } else {
      const gap = daysBetween(lastDate, currentDate)
      if (gap === 1) {
        // Продолжение стрика
        progress.currentStreak += 1
      } else if (gap === 0) {
        // Тот же день - стрик не изменяется
      } else {
        // Пропуск дня - начинаем заново
        progress.currentStreak = 1
      }
    }

    // Обновляем рекорд
    if (progress.currentStreak > progress.longestStreak) {
      progress.longestStreak = progress.currentStreak
    }
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