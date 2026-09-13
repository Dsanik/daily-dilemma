import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type {
  ProgressState,
  Inventory,
  ShopItemType,
} from '../types'
import { DAILY_REWARDS } from '../data/dailyRewards'
import { SHOP_ITEMS } from '../data/shopItems'

// ВАЖНО: этот ключ должен отличаться от STORAGE_KEY в utils/dailyProgress.ts.
// Раньше здесь стоял тот же 'daily-dilemma-progress-v1', что и там — два
// независимых стейта (этот: монеты/XP/инвентарь; тот: стрик/пройденные
// дилеммы) писали в одну и ту же ячейку localStorage с несовместимыми
// форматами и постоянно затирали данные друг друга при каждом сохранении.
const STORAGE_KEY = 'daily-dilemma-gamestate-v1'
export const MAX_HEARTS = 5
export const HEART_REFILL_MS = 30 * 60 * 1000

const DEFAULT_INVENTORY: Inventory = {
  streakFreezes: 0,
  secondChances: 0,
  premiumCards: 0,
}

const DEFAULT_STATE: ProgressState = {
  xp: 0,
  coins: 0,
  streak: 0,
  longestStreak: 0,
  lastVisitDate: '',
  hearts: MAX_HEARTS,
  heartsLastRefill: Date.now(),
  claimedRewards: [],
  weeklyXp: 0,
  weekStart: '',
  lastRewardClaimDate: '',
  inventory: DEFAULT_INVENTORY,
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysBetween(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00`).getTime()
  const db = new Date(`${b}T00:00:00`).getTime()
  return Math.round((db - da) / 86400000)
}

function getWeekStart(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1)
  return d.toISOString().slice(0, 10)
}

function loadState(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {
        ...DEFAULT_STATE,
        lastVisitDate: todayStr(),
        weekStart: getWeekStart(),
        heartsLastRefill: Date.now(),
      }
    }
    const parsed = JSON.parse(raw) as Partial<ProgressState>
    return {
      ...DEFAULT_STATE,
      ...parsed,
      inventory: { ...DEFAULT_INVENTORY, ...(parsed.inventory ?? {}) },
    }
  } catch {
    return {
      ...DEFAULT_STATE,
      lastVisitDate: todayStr(),
      weekStart: getWeekStart(),
      heartsLastRefill: Date.now(),
    }
  }
}

function saveState(state: ProgressState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

interface ProgressContextValue {
  state: ProgressState
  addXp: (amount: number) => void
  addCoins: (amount: number) => void
  spendCoins: (amount: number) => boolean
  loseHeart: () => void
  refillHearts: () => void
  claimReward: (day: number) => void
  resetProgress: () => void
  canClaimToday: boolean
  nextRewardDay: number | null
  buyItem: (itemId: ShopItemType) => boolean
  consumeItem: (itemId: ShopItemType) => boolean
  hasItem: (itemId: ShopItemType) => boolean
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(() => loadState())

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    const today = todayStr()
    const currentWeek = getWeekStart()

    setState((prev) => {
      // Это отдельный, невидимый пользователю счётчик "визитов подряд" —
      // он не показывается нигде в интерфейсе (реальный стрик, который
      // видит игрок, считается в utils/dailyProgress.ts). Раньше здесь же
      // списывалась "заморозка стрика" из инвентаря магазина — то есть
      // покупка защищала число, которое никто не видит, а не тот стрик,
      // который защита обещает по описанию товара. Настоящее списание
      // теперь происходит в App.tsx, рядом с реальным стриком.
      let streak = prev.streak
      let longestStreak = prev.longestStreak
      let lastVisitDate = prev.lastVisitDate

      if (prev.lastVisitDate !== today) {
        if (!prev.lastVisitDate) {
          streak = 1
        } else {
          const gap = daysBetween(prev.lastVisitDate, today)
          streak = gap === 1 ? prev.streak + 1 : 1
        }
        longestStreak = Math.max(prev.longestStreak, streak)
        lastVisitDate = today
      }

      let hearts = prev.hearts
      let heartsLastRefill = prev.heartsLastRefill
      if (hearts < MAX_HEARTS) {
        const elapsed = Date.now() - prev.heartsLastRefill
        const gained = Math.floor(elapsed / HEART_REFILL_MS)
        if (gained > 0) {
          hearts = Math.min(MAX_HEARTS, prev.hearts + gained)
          heartsLastRefill =
            hearts === MAX_HEARTS
              ? Date.now()
              : prev.heartsLastRefill + gained * HEART_REFILL_MS
        }
      } else {
        heartsLastRefill = Date.now()
      }

      let weeklyXp = prev.weeklyXp
      let weekStart = prev.weekStart
      let claimedRewards = prev.claimedRewards
      let lastRewardClaimDate = prev.lastRewardClaimDate

      if (prev.weekStart !== currentWeek) {
        weeklyXp = 0
        weekStart = currentWeek
        claimedRewards = []
        lastRewardClaimDate = ''
      }

      const changed =
        streak !== prev.streak ||
        longestStreak !== prev.longestStreak ||
        lastVisitDate !== prev.lastVisitDate ||
        hearts !== prev.hearts ||
        heartsLastRefill !== prev.heartsLastRefill ||
        weeklyXp !== prev.weeklyXp ||
        weekStart !== prev.weekStart ||
        claimedRewards !== prev.claimedRewards ||
        lastRewardClaimDate !== prev.lastRewardClaimDate

      if (!changed) return prev

      return {
        ...prev,
        streak,
        longestStreak,
        lastVisitDate,
        hearts,
        heartsLastRefill,
        weeklyXp,
        weekStart,
        claimedRewards,
        lastRewardClaimDate,
      }
    })
  }, [])

  const addXp = useCallback((amount: number) => {
    setState((prev) => ({
      ...prev,
      xp: prev.xp + amount,
      weeklyXp: prev.weeklyXp + amount,
    }))
  }, [])

  const addCoins = useCallback((amount: number) => {
    setState((prev) => ({ ...prev, coins: prev.coins + amount }))
  }, [])

  const spendCoins = useCallback(
    (amount: number): boolean => {
      let success = false
      setState((prev) => {
        if (prev.coins < amount) {
          success = false
          return prev
        }
        success = true
        return { ...prev, coins: prev.coins - amount }
      })
      return success
    },
    [],
  )

  const loseHeart = useCallback(() => {
    setState((prev) => ({ ...prev, hearts: Math.max(0, prev.hearts - 1) }))
  }, [])

  const refillHearts = useCallback(() => {
    setState((prev) => ({
      ...prev,
      hearts: MAX_HEARTS,
      heartsLastRefill: Date.now(),
    }))
  }, [])

  const claimReward = useCallback((day: number) => {
    setState((prev) => {
      const today = todayStr()

      if (prev.lastRewardClaimDate === today) return prev
      if (day !== prev.claimedRewards.length + 1) return prev

      const reward = DAILY_REWARDS.find((r) => r.day === day)
      if (!reward) return prev

      const next: ProgressState = {
        ...prev,
        claimedRewards: [...prev.claimedRewards, day],
        lastRewardClaimDate: today,
      }

      switch (reward.type) {
        case 'xp':
          next.xp = prev.xp + reward.amount
          next.weeklyXp = prev.weeklyXp + reward.amount
          break
        case 'coins':
          next.coins = prev.coins + reward.amount
          break
        case 'heart':
          next.hearts = Math.min(MAX_HEARTS, prev.hearts + reward.amount)
          break
        case 'mega':
          next.xp = prev.xp + 100
          next.weeklyXp = prev.weeklyXp + 100
          next.coins = prev.coins + 100
          break
      }

      return next
    })
  }, [])

  // ─── Магазин ───

  const buyItem = useCallback(
    (itemId: ShopItemType): boolean => {
      const item = SHOP_ITEMS.find((i) => i.id === itemId)
      if (!item) return false

      let success = false
      setState((prev) => {
        if (prev.coins < item.price) {
          success = false
          return prev
        }

        const inventory = prev.inventory
        const current =
          itemId === 'streak_freeze'
            ? inventory.streakFreezes
            : itemId === 'second_chance'
              ? inventory.secondChances
              : inventory.premiumCards

        if (current >= item.maxStack) {
          success = false
          return prev
        }

        success = true
        const nextInventory: Inventory = { ...inventory }
        if (itemId === 'streak_freeze') nextInventory.streakFreezes += 1
        else if (itemId === 'second_chance') nextInventory.secondChances += 1
        else nextInventory.premiumCards += 1

        return {
          ...prev,
          coins: prev.coins - item.price,
          inventory: nextInventory,
        }
      })
      return success
    },
    [],
  )

  const consumeItem = useCallback((itemId: ShopItemType): boolean => {
    let success = false
    setState((prev) => {
      const inventory = prev.inventory
      const current =
        itemId === 'streak_freeze'
          ? inventory.streakFreezes
          : itemId === 'second_chance'
            ? inventory.secondChances
            : inventory.premiumCards

      if (current <= 0) {
        success = false
        return prev
      }

      success = true
      const nextInventory: Inventory = { ...inventory }
      if (itemId === 'streak_freeze') nextInventory.streakFreezes -= 1
      else if (itemId === 'second_chance') nextInventory.secondChances -= 1
      else nextInventory.premiumCards -= 1

      return { ...prev, inventory: nextInventory }
    })
    return success
  }, [])

  const hasItem = useCallback(
    (itemId: ShopItemType): boolean => {
      const inventory = state.inventory
      if (itemId === 'streak_freeze') return inventory.streakFreezes > 0
      if (itemId === 'second_chance') return inventory.secondChances > 0
      return inventory.premiumCards > 0
    },
    [state.inventory],
  )

  const resetProgress = useCallback(() => {
    const fresh: ProgressState = {
      ...DEFAULT_STATE,
      lastVisitDate: todayStr(),
      weekStart: getWeekStart(),
      heartsLastRefill: Date.now(),
    }
    setState(fresh)
  }, [])

  const nextRewardDay: number | null =
    state.claimedRewards.length >= DAILY_REWARDS.length
      ? null
      : state.claimedRewards.length + 1

  const canClaimToday =
    nextRewardDay !== null && state.lastRewardClaimDate !== todayStr()

  const value: ProgressContextValue = {
    state,
    addXp,
    addCoins,
    spendCoins,
    loseHeart,
    refillHearts,
    claimReward,
    resetProgress,
    canClaimToday,
    nextRewardDay,
    buyItem,
    consumeItem,
    hasItem,
  }

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider')
  return ctx
}