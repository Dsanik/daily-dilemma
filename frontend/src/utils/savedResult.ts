import type { DilemmaResult } from '../types'

const STORAGE_KEY = 'daily-dilemma-last-result-v1'

interface SavedResult {
  slug: string
  date: string
  result: DilemmaResult
}

function todayKey(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function saveResult(slug: string, result: DilemmaResult): void {
  try {
    const payload: SavedResult = { slug, date: todayKey(), result }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    /* ignore */
  }
}

export function loadResult(slug: string): DilemmaResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SavedResult
    if (parsed.slug !== slug) return null
    if (parsed.date !== todayKey()) return null
    return parsed.result
  } catch {
    return null
  }
}