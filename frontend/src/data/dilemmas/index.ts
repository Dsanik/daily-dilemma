import type { Dilemma } from '../../types'
import { walletDilemma } from './wallet'
import { lateColleagueDilemma } from './lateColleague'
import { noisyNeighborDilemma } from './noisyNeighbor'
import { firingDilemma } from './firing'

export const allDilemmas: Dilemma[] = [
  walletDilemma,
  lateColleagueDilemma,
  noisyNeighborDilemma,
  firingDilemma,
]

// Стабильный номер календарного дня (по локальной дате устройства),
// используется чтобы каждый день детерминированно показывать новую дилемму.
function localDayIndex(date: Date): number {
  const utcMidnight = Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  )
  return Math.floor(utcMidnight / 86400000)
}

export function getTodayDilemma(): Dilemma {
  const index = localDayIndex(new Date()) % allDilemmas.length
  return allDilemmas[index]
}

export function getArchivedDilemmas(todaySlug: string): Dilemma[] {
  return allDilemmas.filter((d) => d.slug !== todaySlug)
}

export function getDilemmaBySlug(slug: string): Dilemma | undefined {
  return allDilemmas.find((d) => d.slug === slug)
}