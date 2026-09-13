import { Sparkles } from 'lucide-react'
import type { MinorityMirror as MirrorType } from '../data/minorityMirrors'
import { formatMirrorHeadline } from '../data/minorityMirrors'

interface MinorityMirrorProps {
  mirror: MirrorType
  percent: number
}

export function MinorityMirror({ mirror, percent }: MinorityMirrorProps) {
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl p-5"
      style={{
        backgroundColor: 'rgba(139, 92, 246, 0.08)',
        border: '1px solid rgba(139, 92, 246, 0.25)',
      }}
    >
      <div className="flex items-start gap-2.5">
        <Sparkles size={16} color="#8b5cf6" className="mt-0.5 shrink-0" />
        <p
          className="text-sm font-semibold leading-snug"
          style={{ color: '#a78bfa' }}
        >
          {formatMirrorHeadline(mirror, percent)}
        </p>
      </div>

      <p className="text-[11px] uppercase tracking-wide opacity-50">
        Как мыслят люди с похожим выбором
      </p>

      <div className="flex flex-col gap-2.5">
        {mirror.reflections.map((reflection, i) => (
          <div key={i} className="flex items-start gap-2">
            <span
              className="mt-2 h-1 w-1 shrink-0 rounded-full"
              style={{ backgroundColor: '#8b5cf6' }}
            />
            <p className="text-xs leading-relaxed opacity-80">{reflection}</p>
          </div>
        ))}
      </div>

      <p className="mt-1 text-[10px] opacity-40">
        Это не диагноз и не профиль. Просто срез — как ещё поступают люди с таким же выбором.
      </p>
    </div>
  )
}