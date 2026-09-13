import { useState } from 'react'
import { Check, Gift } from 'lucide-react'
import { useProgress } from '../contexts/ProgressContext'
import { DAILY_REWARDS } from '../data/dailyRewards'

/**
 * Полоса ежедневных наград за чек-ин (7-дневный цикл, сбрасывается раз
 * в неделю — см. weekStart в ProgressContext). Показывается инлайн на
 * главном экране, без модалок и попапов при каждом открытии — так
 * приложение не превращается в навязчивую игру, но награда всё равно
 * заметна и легко забирается за один тап.
 */
export function DailyCheckIn() {
  const { state, claimReward, canClaimToday, nextRewardDay } = useProgress()
  const [justClaimedDay, setJustClaimedDay] = useState<number | null>(null)

  const cycleComplete = state.claimedRewards.length >= DAILY_REWARDS.length

  function handleClaim(day: number) {
    claimReward(day)
    setJustClaimedDay(day)
    setTimeout(() => setJustClaimedDay(null), 1500)
  }

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl p-4"
      style={{ backgroundColor: 'var(--app-secondary)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift size={15} color="#fbbf24" />
          <span className="text-[10px] font-semibold uppercase tracking-wide opacity-50">
            Ежедневный чек-ин
          </span>
        </div>
        {cycleComplete && (
          <span className="text-[10px] opacity-50">Неделя пройдена 🎉</span>
        )}
      </div>

      <div className="flex items-stretch justify-between gap-1">
        {DAILY_REWARDS.map((reward) => {
          const isClaimed = state.claimedRewards.includes(reward.day)
          const isNext = reward.day === nextRewardDay
          const isClaimableNow = isNext && canClaimToday
          const justClaimed = justClaimedDay === reward.day

          return (
            <button
              key={reward.day}
              type="button"
              disabled={!isClaimableNow}
              onClick={() => handleClaim(reward.day)}
              className="flex flex-1 flex-col items-center gap-1 rounded-xl py-2 transition-opacity active:opacity-70 disabled:cursor-default"
              style={{
                backgroundColor:
                  isClaimed || justClaimed
                    ? 'rgba(22, 163, 74, 0.12)'
                    : isClaimableNow
                      ? 'rgba(251, 191, 36, 0.18)'
                      : 'rgba(128,128,128,0.08)',
                border: isClaimableNow
                  ? '1px solid rgba(251, 191, 36, 0.5)'
                  : '1px solid transparent',
              }}
            >
              {isClaimed || justClaimed ? (
                <Check size={13} color="#16a34a" />
              ) : (
                <span className="text-[9px] font-bold opacity-50">
                  {reward.day}
                </span>
              )}
              <span
                className="text-[8px] font-medium leading-tight text-center"
                style={{
                  color: isClaimableNow ? '#fbbf24' : undefined,
                  opacity: isClaimed || isClaimableNow || justClaimed ? 1 : 0.4,
                }}
              >
                {reward.label}
              </span>
            </button>
          )
        })}
      </div>

      {canClaimToday && nextRewardDay && (
        <button
          type="button"
          onClick={() => handleClaim(nextRewardDay)}
          className="w-full rounded-xl py-2.5 text-xs font-semibold transition-opacity active:opacity-80"
          style={{ backgroundColor: '#fbbf24', color: '#1a1a1a' }}
        >
          Забрать награду за день {nextRewardDay}
        </button>
      )}
    </div>
  )
}