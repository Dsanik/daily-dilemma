import type { DailyReward } from '../types'

export const DAILY_REWARDS: DailyReward[] = [
  { day: 1, type: 'xp', amount: 10, label: '+10 XP' },
  { day: 2, type: 'coins', amount: 20, label: '+20 монет' },
  { day: 3, type: 'heart', amount: 1, label: '+1 жизнь' },
  { day: 4, type: 'xp', amount: 30, label: '+30 XP' },
  { day: 5, type: 'coins', amount: 50, label: '+50 монет' },
  { day: 6, type: 'heart', amount: 1, label: '+1 жизнь' },
  { day: 7, type: 'mega', amount: 100, label: '+100 XP и монет' },
]