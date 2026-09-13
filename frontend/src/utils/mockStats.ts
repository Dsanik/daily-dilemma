// Временная мок-статистика, пока нет бэкенда.
// Считаем локально из localStorage: все прохождения на этом устройстве + фейковая база.
import type { Dilemma, DilemmaResult } from '../types'

const STORAGE_KEY = 'daily-dilemma-mock-stats-v1'

// Фейковая база — имитирует других игроков.
// Когда подключим бэкенд, эта константа исчезнет.
const SEED_STATS: Record<string, Record<string, number>> = {
  wallet: {
    take_money: 34,
    give_police: 92,
    leave: 46,
    meet_public: 130,
    meet_home: 51,
    mail: 67,
  },
}

interface LocalSession {
  slug: string
  finalOption: string
  finishedAt: number
}

function loadLocal(): LocalSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as LocalSession[]
  } catch {
    return []
  }
}

function saveLocal(sessions: LocalSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  } catch {
    /* ignore */
  }
}

export function recordLocalSession(slug: string, finalOption: string) {
  const existing = loadLocal()
  // Один проход на дилемму — не пишем дубли
  if (existing.some((s) => s.slug === slug)) return
  existing.push({ slug, finalOption, finishedAt: Date.now() })
  saveLocal(existing)
}

export function getMockResult(
  dilemma: Dilemma,
  yourFinalOption: string,
): DilemmaResult {
  const seed = SEED_STATS[dilemma.slug] ?? {}
  const local = loadLocal().filter((s) => s.slug === dilemma.slug)

  const stats: Record<string, number> = { ...seed }
  for (const s of local) {
    stats[s.finalOption] = (stats[s.finalOption] ?? 0) + 1
  }

  const total = Object.values(stats).reduce((a, b) => a + b, 0)
  const yourCount = stats[yourFinalOption] ?? 0
  const matchPercent = total === 0 ? 0 : Math.round((yourCount / total) * 100)

  const outcome =
    dilemma.scenario.final_stats_map[yourFinalOption] ?? yourFinalOption

   return {
    your_choice: yourFinalOption,
    your_outcome: outcome,
    stats,
    stat_labels: dilemma.scenario.final_stats_map,
    total_players: total,
    match_percent: matchPercent,
    match_label: `из ${total} игроков ${matchPercent}% поступили как ты`,
  }
}