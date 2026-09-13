import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChoiceRecord, Dilemma, DilemmaSession, PlayMode } from '../types'

export function useDilemma(dilemma: Dilemma, mode: PlayMode = 'normal') {
  const [session, setSession] = useState<DilemmaSession>(() => ({
    dilemmaSlug: dilemma.slug,
    mode,
    currentNodeId: dilemma.scenario.start,
    startedAt: Date.now(),
    choiceStartedAt: Date.now(),
    choices: [],
    finished: false,
    finalOption: null,
    finalOutcome: null,
  }))

  const nodeShownAt = useRef<number>(Date.now())

  const currentNode = dilemma.scenario.nodes[session.currentNodeId]

  const chooseOption = useCallback(
    (optionId: string, nextNodeId: string, timedOut = false) => {
      const now = Date.now()
      const ms = now - nodeShownAt.current

      setSession((prev) => {
        const newNode = dilemma.scenario.nodes[nextNodeId]
        const isEnding = newNode?.type === 'ending'

        const newChoice: ChoiceRecord = {
          node_id: prev.currentNodeId,
          option_id: optionId,
          ms,
          timedOut,
        }

        const newSession: DilemmaSession = {
          ...prev,
          currentNodeId: nextNodeId,
          choices: [...prev.choices, newChoice],
          choiceStartedAt: now,
          finished: isEnding,
          finalOption: isEnding ? optionId : null,
          finalOutcome:
            isEnding && newNode && 'outcome' in newNode
              ? newNode.outcome
              : null,
        }

        return newSession
      })

      nodeShownAt.current = now
    },
    [dilemma.scenario.nodes],
  )

  const advanceText = useCallback(() => {
    const node = dilemma.scenario.nodes[session.currentNodeId]
    if (node?.type === 'text') {
      setSession((prev) => ({ ...prev, currentNodeId: node.next }))
      nodeShownAt.current = Date.now()
    }
  }, [dilemma.scenario.nodes, session.currentNodeId])

  useEffect(() => {
    // при смене узла сбрасываем точку отсчёта
    nodeShownAt.current = Date.now()
  }, [session.currentNodeId])

  return {
    session,
    currentNode,
    chooseOption,
    advanceText,
  }
}