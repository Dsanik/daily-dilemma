import { useProgress } from '../contexts/ProgressContext'
import { SHOP_ITEMS } from '../data/shopItems'
import { ShopItemCard } from '../components/shop/ShopItemCard'
import type { ShopItemType } from '../types'

interface ShopPageProps {
  onClose: () => void
}

export function ShopPage({ onClose }: ShopPageProps) {
  const { state, buyItem } = useProgress()

  function ownedCount(id: ShopItemType): number {
    if (id === 'streak_freeze') return state.inventory.streakFreezes
    if (id === 'second_chance') return state.inventory.secondChances
    return state.inventory.premiumCards
  }

  function handleBuy(id: ShopItemType) {
    const success = buyItem(id)
    if (!success) {
      // тихо игнорируем — кнопка уже disabled при недостатке монет
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={onClose}
        className="self-start text-xs font-medium opacity-70"
      >
        ← Назад
      </button>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Магазин</h1>
          <p className="mt-1 text-sm opacity-60">
            Трать монеты за прохождения
          </p>
        </div>
        <div
          className="flex items-center gap-2 rounded-2xl px-3.5 py-2"
          style={{ backgroundColor: 'rgba(251, 191, 36, 0.15)' }}
        >
          <span className="text-lg font-bold tabular-nums">{state.coins}</span>
          <span className="text-[10px] font-semibold opacity-60">монет</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {SHOP_ITEMS.map((item) => (
          <ShopItemCard
            key={item.id}
            item={item}
            owned={ownedCount(item.id)}
            coins={state.coins}
            onBuy={handleBuy}
          />
        ))}
      </div>

      <div
        className="rounded-2xl p-4 text-[11px] leading-relaxed opacity-60"
        style={{ backgroundColor: 'var(--app-secondary)' }}
      >
        <p className="font-semibold mb-1">Как копить монеты:</p>
        <p>· Сегодняшняя дилемма — +25 (по одному разу в день)</p>
        <p>· Архивная дилемма — +15 (только за первое прохождение)</p>
        <p>· Импульс-режим — +20 (только за первое прохождение дилеммы)</p>
        <p>· Глава истории — +30 монет (за главу — один раз)</p>
        <p>· Завершение истории — +100 монет (один раз)</p>
        <p>· Ежедневные награды — +20/+50/+100 монет</p>
      </div>
    </div>
  )
}