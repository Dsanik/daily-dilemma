import type {
  DialogueNode,
  ScenarioNode,
  StoryVariables,
  VariableValue,
} from '../types'
import { interpolateText } from './storyEngine'

/**
 * Интерполирует текст во всех текстовых полях узла.
 * НЕ трогает логику условий — это делает движок.
 */
export function interpolateNode(
  node: ScenarioNode,
  variables: StoryVariables,
): ScenarioNode {
  const interp = (text: string): string => interpolateText(text, variables)

  switch (node.type) {
    case 'text':
      return { ...node, text: interp(node.text) }

    case 'choice':
      return {
        ...node,
        text: interp(node.text),
        options: node.options.map((o) => ({
          ...o,
          text: interp(o.text),
        })),
      }

    case 'slider':
      return {
        ...node,
        text: interp(node.text),
        steps: node.steps.map((s) => ({
          ...s,
          label: interp(s.label),
        })),
      }

    case 'ending':
      return { ...node, text: interp(node.text) }

    case 'dialogue': {
      const next: DialogueNode = { ...node }
      if (next.text) next.text = interp(next.text)
      if (next.defaultText) next.defaultText = interp(next.defaultText)
      return next
    }

    case 'funnel':
      return {
        ...node,
        defaultText: interp(node.defaultText),
      }

    case 'route':
      return node

    default:
      return node
  }
}

export function formatVariable(value: VariableValue): string {
  if (typeof value === 'boolean') return value ? 'да' : 'нет'
  if (typeof value === 'number') return String(value)
  return value
}

export function asNumber(value: VariableValue | undefined): number | null {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

/**
 * Возвращает цвет реплики для персонажа, если задана условная карта.
 */
export function resolveColorByVariable(
  node: DialogueNode,
  variables: StoryVariables,
): string | undefined {
  if (!node.colorByVariable) return node.speakerColor
  const value = variables[node.colorByVariable.variable]
  if (value === undefined) return node.speakerColor
  return node.colorByVariable.map[String(value)] ?? node.speakerColor
}