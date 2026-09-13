import { X, ChevronLeft, Check } from 'lucide-react'
import type { Story } from '../types'
import { useStory } from '../hooks/useStory'
import { useProgress } from '../contexts/ProgressContext'
import { SliderChoice } from '../components/SliderChoice'
import { DialogueLine } from '../components/DialogueLine'
import { FunnelCard } from '../components/FunnelCard'
import { confirmDialog } from '../utils/confirmDialog'

interface StoryPlayerProps {
  story: Story
  onClose: () => void
  onShowSummary: () => void
}

export function StoryPlayer({
  story,
  onClose,
  onShowSummary,
}: StoryPlayerProps) {
  const { addCoins } = useProgress()

  const {
    progress,
    currentChapter,
    currentNode,
    chapterIntro,
    chapterFinished,
    storyFinished,
    startChapter,
    chooseOption,
    advance,
    completeChapter,
    resetStory,
  } = useStory(story, addCoins)

  if (!currentChapter) {
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1 text-xs font-medium opacity-70"
        >
          <ChevronLeft size={14} />
          Назад
        </button>

        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-bold">{story.title}</h1>
          <p className="text-sm opacity-60">{story.subtitle}</p>
        </div>

        {storyFinished && progress.finaleId && (
          <>
            <FinaleCard
              story={story}
              finaleId={progress.finaleId}
              onReset={async () => {
                const confirmed = await confirmDialog(
                  'Сбросить прогресс этой истории и пройти заново?',
                )
                if (confirmed) resetStory()
              }}
            />
            <button
              type="button"
              onClick={onShowSummary}
              className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition-opacity active:opacity-80"
              style={{ backgroundColor: story.coverColor }}
            >
              Моя история целиком
            </button>
          </>
        )}

        <div className="flex flex-col gap-2">
          <h2 className="text-[10px] font-semibold uppercase tracking-wide opacity-50">
            Главы
          </h2>
          {story.chapters.map((ch, i) => {
            const isCompleted = progress.completedChapters.includes(ch.id)
            const isCurrent = i === progress.completedChapters.length
            const isLocked = i > progress.completedChapters.length

            return (
              <button
                key={ch.id}
                type="button"
                disabled={isLocked}
                onClick={() => startChapter(ch.id)}
                className="flex items-start gap-3 rounded-2xl p-4 text-left transition-opacity active:opacity-80 disabled:opacity-40"
                style={{
                  backgroundColor: isCurrent
                    ? `${story.coverColor}15`
                    : 'var(--app-secondary)',
                  border: isCurrent
                    ? `1px solid ${story.coverColor}40`
                    : '1px solid transparent',
                }}
              >
                <div
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: isCompleted
                      ? '#16a34a'
                      : isCurrent
                        ? story.coverColor
                        : 'rgba(128,128,128,0.2)',
                    color: isLocked ? 'var(--app-hint)' : '#ffffff',
                  }}
                >
                  {isCompleted ? <Check size={14} /> : <span>{i + 1}</span>}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{ch.title}</span>
                  {ch.subtitle && (
                    <span className="text-[11px] opacity-60">
                      {ch.subtitle}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const isChoice = currentNode?.type === 'choice'
  const isSlider = currentNode?.type === 'slider'
  const isEnding = currentNode?.type === 'ending'
  const isText = currentNode?.type === 'text'
  const isDialogue = currentNode?.type === 'dialogue'
  const isFunnel = currentNode?.type === 'funnel'

  const hasChosenInChapter = progress.choices.some(
    (c) => c.chapterId === currentChapter.id,
  )

  const reputation =
    typeof progress.variables.reputation === 'number'
      ? progress.variables.reputation
      : 5

  const reputationColor =
    reputation <= 3 ? '#dc2626' : reputation <= 6 ? '#f59e0b' : '#16a34a'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1 text-xs font-medium opacity-70"
        >
          <X size={14} />
          Закрыть главу
        </button>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] opacity-50">Репутация</span>
          <span
            className="text-xs font-bold tabular-nums"
            style={{ color: reputationColor }}
          >
            {reputation}
          </span>
          <div
            className="h-1.5 w-10 overflow-hidden rounded-full"
            style={{ backgroundColor: 'rgba(128,128,128,0.15)' }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${reputation * 10}%`,
                backgroundColor: reputationColor,
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wide opacity-50">
          {currentChapter.title}
        </span>
      </div>

      {chapterIntro && !hasChosenInChapter && (
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: 'var(--app-secondary)' }}
        >
          <p className="text-sm leading-relaxed italic opacity-80">
            {chapterIntro}
          </p>
        </div>
      )}

      {currentNode && (
        <>
          {isDialogue && (
            <DialogueLine node={currentNode} text={currentNode.text ?? ''} />
          )}

          {isFunnel && (
            <FunnelCard
              title={currentNode.title}
              text={currentNode.defaultText}
            />
          )}

          {isText && (
            <div
              className="rounded-2xl p-5"
              style={{ backgroundColor: 'var(--app-secondary)' }}
            >
              <p className="text-base leading-relaxed whitespace-pre-line">
                {currentNode.text}
              </p>
            </div>
          )}

          {(isText || isDialogue || isFunnel) &&
            'next' in currentNode &&
            currentNode.next && (
              <button
                type="button"
                onClick={advance}
                className="w-full rounded-2xl py-3.5 text-sm font-semibold transition-opacity active:opacity-80"
                style={{
                  backgroundColor: story.coverColor,
                  color: '#ffffff',
                }}
              >
                Дальше
              </button>
            )}

          {isChoice && 'options' in currentNode && currentNode.options && (
            <div className="flex flex-col gap-2">
              {currentNode.options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => chooseOption(opt.id, opt.next)}
                  className="rounded-2xl p-4 text-left text-sm leading-snug transition-opacity active:opacity-70"
                  style={{
                    backgroundColor: 'var(--app-secondary)',
                    color: 'var(--app-text)',
                  }}
                >
                  {opt.text}
                </button>
              ))}
            </div>
          )}

          {isSlider && currentNode.type === 'slider' && (
            <SliderChoice
              node={currentNode}
              onConfirm={(value, nextNodeId) =>
                chooseOption(`slider_${value}`, nextNodeId)
              }
            />
          )}

          {isEnding && chapterFinished && (
            <button
              type="button"
              onClick={completeChapter}
              className="w-full rounded-2xl py-3.5 text-sm font-semibold transition-opacity active:opacity-80"
              style={{
                backgroundColor: story.coverColor,
                color: '#ffffff',
              }}
            >
              Завершить главу
            </button>
          )}
        </>
      )}
    </div>
  )
}

interface FinaleCardProps {
  story: Story
  finaleId: string
  onReset: () => void
}

function FinaleCard({ story, finaleId, onReset }: FinaleCardProps) {
  const finale = story.finales.find((f) => f.id === finaleId)
  if (!finale) return null

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl p-5"
      style={{
        backgroundColor: `${finale.color}15`,
        border: `1px solid ${finale.color}40`,
      }}
    >
      <span
        className="text-[10px] font-bold uppercase tracking-wide"
        style={{ color: finale.color }}
      >
        Твоя концовка
      </span>
      <p className="text-lg font-bold" style={{ color: finale.color }}>
        {finale.title}
      </p>
      <p className="text-xs leading-relaxed opacity-80">
        {finale.description}
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-2 self-start rounded-xl px-4 py-2 text-xs font-semibold transition-opacity active:opacity-70"
        style={{
          backgroundColor: 'rgba(128,128,128,0.15)',
          color: 'var(--app-text)',
        }}
      >
        Пройти заново
      </button>
    </div>
  )
}