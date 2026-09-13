import { useMemo, useState } from 'react'
import { getArchivedDilemmas, getTodayDilemma } from '../data/dilemmas'
import { categories, getCategoryInfo } from '../data/categories'
import { loadProgress } from '../utils/dailyProgress'
import type { Dilemma, DilemmaCategory } from '../types'

interface ArchivePageProps {
  onOpenDilemma: (dilemma: Dilemma) => void
}

export function ArchivePage({ onOpenDilemma }: ArchivePageProps) {
  const [filter, setFilter] = useState<DilemmaCategory | 'all'>('all')
  const todaySlug = getTodayDilemma().slug
  const archive = getArchivedDilemmas(todaySlug)
  const progress = loadProgress()

  const filtered = useMemo(() => {
    if (filter === 'all') return archive
    return archive.filter((d) => d.meta?.category === filter)
  }, [archive, filter])

  function isPlayed(slug: string): boolean {
    return Boolean(progress.completedDilemmas[slug])
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">Архив</h1>
        <p className="mt-1 text-xs opacity-60">
          {archive.length} {archive.length === 1 ? 'дилемма' : 'дилеммы'} в архиве
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors"
          style={{
            backgroundColor:
              filter === 'all' ? 'var(--app-accent)' : 'var(--app-secondary)',
            color:
              filter === 'all' ? 'var(--app-accent-text)' : 'var(--app-text)',
          }}
        >
          Все
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setFilter(cat.id)}
            className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors"
            style={{
              backgroundColor:
                filter === cat.id ? cat.color : 'var(--app-secondary)',
              color: filter === cat.id ? '#ffffff' : 'var(--app-text)',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div
          className="rounded-2xl p-6 text-center"
          style={{ backgroundColor: 'var(--app-secondary)' }}
        >
          <p className="text-sm opacity-60">В этой категории пока ничего нет</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map((dilemma) => {
          const played = isPlayed(dilemma.slug)
          const category = dilemma.meta
            ? getCategoryInfo(dilemma.meta.category)
            : null
          return (
            <button
              key={dilemma.slug}
              type="button"
              onClick={() => onOpenDilemma(dilemma)}
              className="flex flex-col gap-2.5 rounded-2xl p-4 text-left transition-opacity active:opacity-80"
              style={{ backgroundColor: 'var(--app-secondary)' }}
            >
              <div className="flex items-center justify-between gap-2">
                {category && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
                    style={{ backgroundColor: category.color }}
                  >
                    {category.label}
                  </span>
                )}
                {played && (
                  <span className="text-[10px] font-semibold opacity-50">
                    пройдено
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold leading-snug">
                {dilemma.title}
              </p>
              <p className="line-clamp-2 text-xs leading-relaxed opacity-70">
                {dilemma.intro}
              </p>
              {dilemma.meta && (
                <p className="text-[10px] opacity-40">
                  ~{dilemma.meta.estimatedMinutes} мин
                </p>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}