import type { CategoryInfo, DilemmaCategory } from '../types'

export const categories: CategoryInfo[] = [
  { id: 'work', label: 'Работа', color: '#4a9eff' },
  { id: 'relations', label: 'Отношения', color: '#ec4899' },
  { id: 'ethics', label: 'Этика', color: '#8b5cf6' },
  { id: 'everyday', label: 'Бытовое', color: '#16a34a' },
]

export function getCategoryInfo(id: DilemmaCategory): CategoryInfo {
  return categories.find((c) => c.id === id) ?? categories[0]
}