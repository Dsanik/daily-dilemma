import type {
  ConditionalRoute,
  Story,
  StoryChapter,
  StoryFinale,
  StoryProgress,
  StoryVariables,
  VariableCondition,
  VariableValue,
} from '../types'

const STORAGE_PREFIX = 'daily-dilemma-story-'

export function checkCondition(
  condition: VariableCondition,
  variables: StoryVariables,
): boolean {
  const value = variables[condition.variable]

  // Если в условии только variable — проверяем, что переменная вообще существует
  const hasAnyValueCheck =
    condition.equals !== undefined ||
    condition.notEquals !== undefined ||
    condition.gt !== undefined ||
    condition.lt !== undefined

  if (!hasAnyValueCheck) {
    return value !== undefined
  }

  // Все проверки должны совпасть
  if (condition.equals !== undefined && value !== condition.equals) {
    return false
  }

  if (condition.notEquals !== undefined && value === condition.notEquals) {
    return false
  }

  if (condition.gt !== undefined) {
    if (typeof value !== 'number' || value <= condition.gt) return false
  }

  if (condition.lt !== undefined) {
    if (typeof value !== 'number' || value >= condition.lt) return false
  }

  return true
}

/**
 * Находит первый подходящий route.
 */
export function findRoute(
  branches: { if: VariableCondition; next: string }[],
  variables: StoryVariables,
  fallback: string,
): string {
  for (const branch of branches) {
    if (checkCondition(branch.if, variables)) {
      return branch.next
    }
  }
  return fallback
}

export function resolveConditionalRoute(
  routes: ConditionalRoute[] | undefined,
  variables: StoryVariables,
  fallback: string,
): string {
  if (!routes || routes.length === 0) return fallback

  for (const route of routes) {
    if (checkCondition(route.if, variables)) {
      return route.then
    }
  }
  return fallback
}

export function interpolateText(
  text: string,
  variables: StoryVariables,
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = variables[key]
    if (value === undefined) return `{{${key}}}`
    return String(value)
  })
}

export function resolveFinale(
  story: Story,
  variables: StoryVariables,
): StoryFinale | null {
  for (const finale of story.finales) {
    const allMatch = finale.conditions.every((cond) =>
      checkCondition(cond, variables),
    )
    if (allMatch) return finale
  }
  return null
}

/**
 * Применяет эффекты выбора к переменным.
 */
export function applyEffects(
  variables: StoryVariables,
  effects: Record<string, VariableValue> | undefined,
): StoryVariables {
  if (!effects) return variables
  return { ...variables, ...effects }
}

/**
 * Извлекает читаемую метку для истории выборов.
 */
export function extractChoiceLabel(
  optionText: string | undefined,
  fallback: string,
): string {
  return optionText ?? fallback
}

// ─── Хранилище ───

export function loadStoryProgress(story: Story): StoryProgress {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + story.slug)
    if (!raw) return createInitialProgress(story)
    const parsed = JSON.parse(raw) as StoryProgress
    return {
      ...parsed,
      variables: { ...story.initialVariables, ...parsed.variables },
    }
  } catch {
    return createInitialProgress(story)
  }
}

export function saveStoryProgress(progress: StoryProgress): void {
  try {
    localStorage.setItem(
      STORAGE_PREFIX + progress.storySlug,
      JSON.stringify(progress),
    )
  } catch {
    /* ignore */
  }
}

export function createInitialProgress(story: Story): StoryProgress {
  return {
    storySlug: story.slug,
    completedChapters: [],
    variables: { ...story.initialVariables },
    choices: [],
    finaleId: null,
    startedAt: Date.now(),
    completedAt: null,
  }
}

export function isStoryCompleted(progress: StoryProgress): boolean {
  return progress.finaleId !== null
}

export function getStoryProgressPercent(
  story: Story,
  progress: StoryProgress,
): number {
  const total = story.chapters.length
  if (total === 0) return 0
  const done = progress.completedChapters.length
  return Math.round((done / total) * 100)
}

export function getStoryChapterById(
  story: Story,
  chapterId: string,
): StoryChapter | undefined {
  return story.chapters.find((c) => c.id === chapterId)
}

export function getAllStoryProgress(
  stories: Story[],
): Record<string, StoryProgress> {
  const result: Record<string, StoryProgress> = {}
  for (const story of stories) {
    result[story.slug] = loadStoryProgress(story)
  }
  return result
}

// ─── Реестр наград ───
// Хранится ОТДЕЛЬНО от StoryProgress и не трогается при сбросе прогресса
// истории (см. onReset в App.tsx — он чистит только ключ STORAGE_PREFIX).
// Без этого разделения игрок мог сбросить прогресс, пройти главы заново
// и получить монеты за них повторно — сколько угодно раз.
const REWARDS_STORAGE_PREFIX = 'daily-dilemma-story-rewards-'

interface StoryRewardLedger {
  rewardedChapters: string[]
  finaleRewarded: boolean
}

function loadRewardLedger(storySlug: string): StoryRewardLedger {
  try {
    const raw = localStorage.getItem(REWARDS_STORAGE_PREFIX + storySlug)
    if (!raw) return { rewardedChapters: [], finaleRewarded: false }
    return JSON.parse(raw) as StoryRewardLedger
  } catch {
    return { rewardedChapters: [], finaleRewarded: false }
  }
}

function saveRewardLedger(storySlug: string, ledger: StoryRewardLedger): void {
  try {
    localStorage.setItem(
      REWARDS_STORAGE_PREFIX + storySlug,
      JSON.stringify(ledger),
    )
  } catch {
    /* ignore */
  }
}

export function hasChapterBeenRewarded(
  storySlug: string,
  chapterId: string,
): boolean {
  return loadRewardLedger(storySlug).rewardedChapters.includes(chapterId)
}

export function markChapterRewarded(storySlug: string, chapterId: string): void {
  const ledger = loadRewardLedger(storySlug)
  if (ledger.rewardedChapters.includes(chapterId)) return
  saveRewardLedger(storySlug, {
    ...ledger,
    rewardedChapters: [...ledger.rewardedChapters, chapterId],
  })
}

export function hasFinaleBeenRewarded(storySlug: string): boolean {
  return loadRewardLedger(storySlug).finaleRewarded
}

export function markFinaleRewarded(storySlug: string): void {
  const ledger = loadRewardLedger(storySlug)
  if (ledger.finaleRewarded) return
  saveRewardLedger(storySlug, { ...ledger, finaleRewarded: true })
}