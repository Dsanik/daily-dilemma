import type { ShopItem } from '../types'

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'streak_freeze',
    title: 'Заморозка стрика',
    description:
      'Если пропустишь день — серия не сбросится. Активируется автоматически при пропуске.',
    price: 500,
    icon: 'snowflake',
    color: '#4a9eff',
    maxStack: 3,
    hint: 'Можно держать до 3 заморозок одновременно',
  },
  {
    id: 'second_chance',
    title: 'Второй шанс',
    description:
      'В импульсном режиме — +5 секунд на выбор, если таймер уже истёк.',
    price: 200,
    icon: 'hourglass',
    color: '#f59e0b',
    maxStack: 5,
    hint: 'Работает только в импульсном режиме',
  },
  {
    id: 'premium_card',
    title: 'Премиум-карточка',
    description:
      'Золотая рамка на PNG при шеринге результата. Списывается за каждый шеринг.',
    price: 300,
    icon: 'crown',
    color: '#fbbf24',
    maxStack: 10,
    hint: 'Улучшает дизайн карточки шеринга',
  },
]

export function getShopItem(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((item) => item.id === id)
}