import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api/client'

interface ServerStreak {
  streak: number
  totalPlayed: number
  lastCompletedDate: string | null
}

export function useServerSync(userFirstName?: string, userUsername?: string) {
  const [serverStreak, setServerStreak] = useState<ServerStreak | null>(null)
  const [synced, setSynced] = useState(false)
  const registerAttempted = useRef(false)

  // Регистрация при первом запуске
  useEffect(() => {
    if (registerAttempted.current) return
    registerAttempted.current = true

    let cancelled = false

    async function doRegister() {
      const result = await api.register(userFirstName, userUsername)
      if (cancelled) return

      if (result?.ok) {
        // Подтягиваем стрик с сервера
        const streak = await api.getStreak()
        if (!cancelled && streak?.ok) {
          setServerStreak({
            streak: streak.streak,
            totalPlayed: streak.totalPlayed,
            lastCompletedDate: streak.lastCompletedDate,
          })
        }
      }
      setSynced(true)
    }

    doRegister()
    return () => {
      cancelled = true
    }
  }, [userFirstName, userUsername])

  // Отметка о завершении дилеммы
  const markCompleted = useCallback(async (dilemmaSlug: string) => {
    const result = await api.markCompleted(dilemmaSlug)
    if (result?.ok) {
      setServerStreak((prev) => ({
        streak: result.streak,
        totalPlayed: (prev?.totalPlayed ?? 0) + 1,
        lastCompletedDate: new Date().toISOString().slice(0, 10),
      }))
    }
    return result
  }, [])

  return {
    serverStreak,
    synced,
    markCompleted,
  }
}