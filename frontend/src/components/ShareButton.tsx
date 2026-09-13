import { useState } from 'react'
import { Share2, Loader2, Check, Download } from 'lucide-react'
import type { DilemmaResult } from '../types'
import { generateShareCard } from '../utils/shareCard'
import { shareImage } from '../utils/shareImage'
import { useProgress } from '../contexts/ProgressContext'

interface ShareButtonProps {
  result: DilemmaResult
  dilemmaTitle: string
}

type State = 'idle' | 'generating' | 'sharing' | 'done' | 'failed'

export function ShareButton({ result, dilemmaTitle }: ShareButtonProps) {
  const [state, setState] = useState<State>('idle')
  const [method, setMethod] = useState<'telegram' | 'download' | null>(null)
  const { hasItem, consumeItem } = useProgress()

  async function handleShare() {
    if (state === 'generating' || state === 'sharing') return

    try {
      setState('generating')
      // "Премиум-карточка" списывается за каждый шеринг — расходник.
      const premium = hasItem('premium_card') && consumeItem('premium_card')
      const blob = await generateShareCard({ result, dilemmaTitle, premium })
      setState('sharing')
      const outcome = await shareImage(blob, `dilemma-${Date.now()}.png`)

      if (outcome.method === 'failed') {
        setState('failed')
        return
      }

      setMethod(outcome.method)
      setState('done')

      setTimeout(() => {
        setState('idle')
        setMethod(null)
      }, 2500)
    } catch (err) {
      console.error('Share error:', err)
      setState('failed')
      setTimeout(() => setState('idle'), 2000)
    }
  }

  const label =
    state === 'generating'
      ? 'Создаём карточку…'
      : state === 'sharing'
        ? 'Открываем…'
        : state === 'done' && method === 'download'
          ? 'Карточка сохранена'
          : state === 'done'
            ? 'Готово'
            : state === 'failed'
              ? 'Не получилось — попробуй ещё'
              : 'Поделиться результатом'

  const Icon =
    state === 'generating' || state === 'sharing'
      ? Loader2
      : state === 'done'
        ? method === 'download'
          ? Download
          : Check
        : Share2

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={state === 'generating' || state === 'sharing'}
      className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold transition-opacity active:opacity-80 disabled:opacity-60"
      style={{
        backgroundColor: 'var(--app-accent)',
        color: 'var(--app-accent-text)',
      }}
    >
      <Icon
        size={16}
        className={
          state === 'generating' || state === 'sharing' ? 'animate-spin' : ''
        }
      />
      {label}
    </button>
  )
}