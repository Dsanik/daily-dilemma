import { useEffect, useState } from 'react'
import type { DailyProgress } from '../types'
import {
  refreshStreak,
  msUntilMidnight,
  formatCountdown,
} from '../utils/dailyProgress'

export function useStreak(
  hasFreeze?: () => boolean,
  consumeFreeze?: () => void,
) {
  const [progress, setProgress] = useState<DailyProgress>(() =>
    refreshStreak(hasFreeze, consumeFreeze),
  )
  const [countdown, setCountdown] = useState(() =>
    formatCountdown(msUntilMidnight()),
  )

  useEffect(() => {
    const id = setInterval(() => {
      setCountdown(formatCountdown(msUntilMidnight()))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    function onFocus() {
      setProgress(refreshStreak(hasFreeze, consumeFreeze))
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [hasFreeze, consumeFreeze])

  return { progress, setProgress, countdown }
}