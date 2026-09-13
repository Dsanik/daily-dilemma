interface FunnelCardProps {
  title: string
  text: string
}

export function FunnelCard({ title, text }: FunnelCardProps) {
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl p-5"
      style={{
        backgroundColor: 'rgba(139, 92, 246, 0.08)',
        border: '1px solid rgba(139, 92, 246, 0.25)',
      }}
    >
      <span
        className="text-[10px] font-bold uppercase tracking-wide"
        style={{ color: '#a78bfa' }}
      >
        {title}
      </span>
      <p className="text-sm leading-relaxed italic opacity-90">{text}</p>
    </div>
  )
}