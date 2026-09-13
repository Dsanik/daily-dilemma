import { ChevronRight } from 'lucide-react'

interface StoryPathCardProps {
  chapterTitle: string
  chapterIndex: number
  choiceLabel: string
  chapterColor: string
}

export function StoryPathCard({
  chapterTitle,
  chapterIndex,
  choiceLabel,
  chapterColor,
}: StoryPathCardProps) {
  return (
    <div
      className="flex items-start gap-3 rounded-2xl p-4"
      style={{ backgroundColor: 'var(--app-secondary)' }}
    >
      <div
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: chapterColor }}
      >
        {chapterIndex}
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-wide opacity-50">
          {chapterTitle}
        </span>
        <span className="text-sm leading-snug">{choiceLabel}</span>
      </div>
      <ChevronRight size={16} className="mt-2 shrink-0 opacity-30" />
    </div>
  )
}