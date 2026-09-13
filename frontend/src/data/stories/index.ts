import type { Story } from '../../types'
import { wrongErrorStory } from './wrongError'

export const allStories: Story[] = [wrongErrorStory]

export function getStoryBySlug(slug: string): Story | undefined {
  return allStories.find((s) => s.slug === slug)
}