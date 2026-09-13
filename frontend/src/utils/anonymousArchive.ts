const STORAGE_KEY = 'daily-dilemma-anonymous-args-v1'

interface SubmittedArgument {
  slug: string
  text: string
  submittedAt: number
}

function load(): SubmittedArgument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SubmittedArgument[]
  } catch {
    return []
  }
}

function save(items: SubmittedArgument[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    /* ignore */
  }
}

export function hasSubmittedArgument(slug: string): boolean {
  return load().some((item) => item.slug === slug)
}

export function submitArgument(slug: string, text: string): void {
  const items = load()
  if (items.some((item) => item.slug === slug)) return
  items.push({ slug, text, submittedAt: Date.now() })
  save(items)
}