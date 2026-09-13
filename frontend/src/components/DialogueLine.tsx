import type { DialogueNode } from '../types'

interface DialogueLineProps {
  node: DialogueNode
  text: string
}

export function DialogueLine({ node, text }: DialogueLineProps) {
  const isNarration = !node.speaker

  if (isNarration) {
    return (
      <div
        className="rounded-2xl p-5"
        style={{
          backgroundColor: 'rgba(128,128,128,0.08)',
          borderLeft: '3px solid rgba(128,128,128,0.3)',
        }}
      >
        <p className="text-sm leading-relaxed italic opacity-75 whitespace-pre-line">
          {text}
        </p>
      </div>
    )
  }

  const color = node.speakerColor ?? 'var(--app-accent)'

  return (
    <div
      className="flex flex-col gap-2 rounded-2xl p-5"
      style={{
        backgroundColor: `${color}10`,
        borderLeft: `3px solid ${color}`,
      }}
    >
      <span
        className="text-[10px] font-bold uppercase tracking-wide"
        style={{ color }}
      >
        {node.speaker}
      </span>
      <p className="text-base leading-relaxed whitespace-pre-wrap">
        «{text}»
      </p>
    </div>
  )
}