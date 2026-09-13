import { useState } from 'react'
import { MessageSquare, Send, Check } from 'lucide-react'

interface AnonymousTribunalProps {
  opponentArguments: string[]
  onSubmitArgument: (text: string) => void
  alreadySubmitted: boolean
}

const MAX_LENGTH = 140

export function AnonymousTribunal({
  opponentArguments,
  onSubmitArgument,
  alreadySubmitted,
}: AnonymousTribunalProps) {
  const [draft, setDraft] = useState('')
  const [submitted, setSubmitted] = useState(alreadySubmitted)

  function handleSubmit() {
    const trimmed = draft.trim()
    if (!trimmed || trimmed.length > MAX_LENGTH || submitted) return
    onSubmitArgument(trimmed)
    setSubmitted(true)
    setDraft('')
  }

  return (
    <div className="flex flex-col gap-4">
      {opponentArguments.length > 0 && (
        <div
          className="flex flex-col gap-3 rounded-2xl p-5"
          style={{ backgroundColor: 'var(--app-secondary)' }}
        >
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="opacity-60" />
            <p className="text-[10px] font-semibold uppercase tracking-wide opacity-50">
              Что говорят те, кто выбрал иначе
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {opponentArguments.map((arg, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{
                    backgroundColor: 'rgba(128,128,128,0.15)',
                    color: 'var(--app-text)',
                  }}
                >
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed opacity-85">«{arg}»</p>
              </div>
            ))}
          </div>

          <p className="text-[10px] opacity-40">
            Примеры типичных аргументов, а не сообщения конкретных людей.
          </p>
        </div>
      )}

      {!submitted && (
        <div
          className="flex flex-col gap-3 rounded-2xl p-5"
          style={{ backgroundColor: 'var(--app-secondary)' }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide opacity-50">
            Твой аргумент
          </p>
          <p className="text-xs opacity-70">
            Почему ты поступил именно так? Коротко, до {MAX_LENGTH} символов.
            Он сохранится у тебя как заметка к этому выбору.
          </p>

          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, MAX_LENGTH))}
            placeholder="Я выбрал так, потому что…"
            rows={3}
            className="w-full resize-none rounded-xl p-3 text-sm outline-none"
            style={{
              backgroundColor: 'rgba(128,128,128,0.1)',
              color: 'var(--app-text)',
              border: '1px solid rgba(128,128,128,0.15)',
            }}
          />

          <div className="flex items-center justify-between">
            <span className="text-[10px] opacity-40 tabular-nums">
              {draft.length} / {MAX_LENGTH}
            </span>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!draft.trim()}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-opacity active:opacity-80 disabled:opacity-30"
              style={{
                backgroundColor: 'var(--app-accent)',
                color: 'var(--app-accent-text)',
              }}
            >
              <Send size={12} />
              Сохранить свой аргумент
            </button>
          </div>
        </div>
      )}

      {submitted && (
        <div
          className="flex items-center gap-3 rounded-2xl p-4"
          style={{ backgroundColor: 'rgba(22, 163, 74, 0.08)' }}
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(22, 163, 74, 0.15)' }}
          >
            <Check size={16} color="#16a34a" />
          </div>
          <p className="text-xs leading-relaxed opacity-80">
            Аргумент сохранён. Ты сможешь вернуться к нему позже.
          </p>
        </div>
      )}
    </div>
  )
}