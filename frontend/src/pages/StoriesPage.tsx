import { useMemo } from 'react'
import { ChevronRight, Lock, CheckCircle2 } from 'lucide-react'
import { allStories } from '../data/stories'
import { loadStoryProgress, getStoryProgressPercent } from '../utils/storyEngine'
import { getCategoryInfo } from '../data/categories'
import type { Story } from '../types'

interface StoriesPageProps {
  onOpenStory: (story: Story) => void
}

export function StoriesPage({ onOpenStory }: StoriesPageProps) {
  const storiesWithProgress = useMemo(
    () =>
      allStories.map((story) => ({
        story,
        progress: loadStoryProgress(story),
      })),
    [],
  )

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">Истории</h1>
        <p className="mt-1 text-xs opacity-60">
          {allStories.length} {allStories.length === 1 ? 'история' : 'истории'} в разработке
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {storiesWithProgress.map(({ story, progress }) => {
          const category = getCategoryInfo(story.category)
          const percent = getStoryProgressPercent(story, progress)
          const isFinished = progress.finaleId !== null
          const isStarted = progress.completedChapters.length > 0

          return (
            <button
              key={story.slug}
              type="button"
              onClick={() => onOpenStory(story)}
              className="flex flex-col gap-3 rounded-2xl p-5 text-left transition-opacity active:opacity-80"
              style={{ backgroundColor: 'var(--app-secondary)' }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: story.coverColor }}
                >
                  <span className="text-2xl">📖</span>
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.label}
                    </span>
                    {isFinished && (
                      <CheckCircle2 size={12} color="#16a34a" />
                    )}
                  </div>
                  <p className="text-sm font-semibold leading-snug">
                    {story.title}
                  </p>
                  <p className="text-[11px] leading-snug opacity-60">
                    {story.subtitle}
                  </p>
                </div>
                <ChevronRight size={18} className="mt-4 shrink-0 opacity-40" />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] font-medium opacity-60">
                    {progress.completedChapters.length} из{' '}
                    {story.chapters.length} глав
                  </span>
                  <span
                    className="text-[10px] font-bold tabular-nums"
                    style={{ color: story.coverColor }}
                  >
                    {percent}%
                  </span>
                </div>
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full"
                  style={{ backgroundColor: 'rgba(128,128,128,0.15)' }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: story.coverColor,
                    }}
                  />
                </div>
              </div>

              {!isStarted && (
                <p className="text-[10px] opacity-40">
                  Не начата · ~{story.chapters.length * 5} мин
                </p>
              )}
            </button>
          )
        })}
      </div>

      <div
        className="flex items-start gap-3 rounded-2xl p-4"
        style={{ backgroundColor: 'rgba(139, 92, 246, 0.08)' }}
      >
        <Lock size={16} className="mt-0.5 shrink-0" color="#8b5cf6" />
        <p className="text-[11px] leading-relaxed opacity-80">
          Новые истории выходят раз в две недели. Скоро: «Семья и деньги», «Городской роман», «Разговор с отцом».
        </p>
      </div>
    </div>
  )
}