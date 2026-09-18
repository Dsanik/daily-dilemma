import { DilemmaPlayer } from '../DilemmaPlayer'
import type { Dilemma, PlayMode } from '../../types'

interface GameFlowProps {
  dilemma: Dilemma
  mode: PlayMode
  onComplete: (finalOption: string, mode: PlayMode) => void
  onClose: () => void
}

export function GameFlow({
  dilemma,
  mode,
  onComplete,
  onClose
}: GameFlowProps) {
  return (
    <DilemmaPlayer
      dilemma={dilemma}
      mode={mode}
      onComplete={onComplete}
      onClose={onClose}
    />
  )
}