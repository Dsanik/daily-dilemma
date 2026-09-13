import { Snowflake, Hourglass, Crown, Check, Lock } from 'lucide-react'
import type { ShopItem, ShopItemType } from '../../types'

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  snowflake: Snowflake,
  hourglass: Hourglass,
  crown: Crown,
}

interface ShopItemCardProps {
  item: ShopItem
  owned: number
  coins: number
  onBuy: (id: ShopItemType) => void
}

export function ShopItemCard({ item, owned, coins, onBuy }: ShopItemCardProps) {
  const Icon = ICON_MAP[item.icon] ?? Snowflake
  const canAfford = coins >= item.price
  const maxed = owned >= item.maxStack
  const disabled = !canAfford || maxed

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl p-4"
      style={{ backgroundColor: 'var(--app-secondary)' }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: item.color }}
        >
          <Icon size={22} color="#ffffff" />
        </div>
        <div className="flex flex-1 flex-col gap-0.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold">{item.title}</span>
            {owned > 0 && (
              <span
                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                style={{ backgroundColor: '#16a34a' }}
              >
                <Check size={10} />
                {owned}
              </span>
            )}
          </div>
          <p className="text-[11px] leading-relaxed opacity-70">
            {item.description}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold tabular-nums">{item.price}</span>
          <span className="text-[10px] opacity-50">монет</span>
        </div>
        <span className="text-[10px] opacity-40">
          {owned}/{item.maxStack} в наличии
        </span>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onBuy(item.id)}
        className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold text-white transition-opacity active:opacity-80 disabled:opacity-40"
        style={{ backgroundColor: maxed ? '#6b7280' : item.color }}
      >
        {maxed ? (
          <>
            <Lock size={12} />
            Максимум
          </>
        ) : canAfford ? (
          'Купить'
        ) : (
          `Не хватает ${item.price - coins} монет`
        )}
      </button>

      <p className="text-center text-[10px] opacity-40">{item.hint}</p>
    </div>
  )
}