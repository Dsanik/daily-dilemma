import { useCallback, useMemo, useState } from "react";
import type {
  ScenarioNode,
  Story,
  StoryChapter,
  StoryProgress,
  VariableValue,
} from "../types";
import {
  loadStoryProgress,
  saveStoryProgress,
  resolveConditionalRoute,
  interpolateText,
  findRoute,
  checkCondition,
  hasChapterBeenRewarded,
  markChapterRewarded,
  hasFinaleBeenRewarded,
  markFinaleRewarded,
} from "../utils/storyEngine";
import {
  interpolateNode,
  resolveColorByVariable,
} from "../utils/storyVariables";

interface UseStoryResult {
  progress: StoryProgress;
  currentChapter: StoryChapter | null;
  currentNode: ScenarioNode | null;
  chapterIntro: string;
  currentNodeId: string;
  chapterFinished: boolean;
  storyFinished: boolean;
  startChapter: (chapterId: string) => void;
  chooseOption: (
    optionId: string,
    nextNodeId: string,
    timedOut?: boolean,
  ) => void;
  advance: () => void;
  completeChapter: () => void;
  resetStory: () => void;
}

export function useStory(
  story: Story,
  addCoins: (amount: number) => void,
): UseStoryResult {
  const [progress, setProgress] = useState<StoryProgress>(() =>
    loadStoryProgress(story),
  );
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [chapterFinished, setChapterFinished] = useState(false);

  const currentChapter = useMemo(() => {
    if (!activeChapterId) return null;
    return story.chapters.find((c) => c.id === activeChapterId) ?? null;
  }, [activeChapterId, story.chapters]);

  const resolveDisplayNode = useCallback(
    (
      chapter: StoryChapter,
      startId: string,
      variables: Record<string, VariableValue>,
    ): { node: ScenarioNode | null; nodeId: string } => {
      let nodeId = startId;
      let safety = 0;

      while (safety < 50) {
        safety++;
        const node = chapter.nodes[nodeId];
        if (!node) return { node: null, nodeId };

        if (node.type === "route") {
          nodeId = findRoute(node.branches, variables, node.fallback);
          continue;
        }

        if (node.type === "funnel") {
          return { node, nodeId };
        }

        return { node, nodeId };
      }

      return { node: null, nodeId };
    },
    [],
  );

  const resolvedStart = useMemo(() => {
    if (!currentChapter || !currentNodeId) {
      return { node: null, nodeId: "" };
    }
    return resolveDisplayNode(
      currentChapter,
      currentNodeId,
      progress.variables,
    );
  }, [currentChapter, currentNodeId, progress.variables, resolveDisplayNode]);

  const rawNode = resolvedStart.node;
  const resolvedNodeId = resolvedStart.nodeId;

  const currentNode = useMemo(() => {
    if (!rawNode) return null;
    const interpolated = interpolateNode(rawNode, progress.variables);

    if (interpolated.type === "dialogue") {
      const color = interpolated.colorByVariable
        ? resolveColorByVariable(interpolated, progress.variables)
        : interpolated.speakerColor;

      if (interpolated.textByCondition) {
        const resolved = resolveConditionalRoute(
          interpolated.textByCondition,
          progress.variables,
          interpolated.defaultText ?? interpolated.text ?? "",
        );
        return {
          ...interpolated,
          text: interpolateText(resolved, progress.variables),
          speakerColor: color,
        };
      }

      return { ...interpolated, speakerColor: color };
    }

    if (interpolated.type === "funnel" && interpolated.textByCondition) {
      const resolved = resolveConditionalRoute(
        interpolated.textByCondition,
        progress.variables,
        interpolated.defaultText,
      );
      return {
        ...interpolated,
        defaultText: interpolateText(resolved, progress.variables),
      };
    }

    return interpolated;
  }, [rawNode, progress.variables]);

  const chapterIntro = useMemo(() => {
    if (!currentChapter) return "";

    const interpolate = (text: string): string =>
      interpolateText(text, progress.variables);

    if (currentChapter.introByCondition) {
      for (const route of currentChapter.introByCondition) {
        if (checkCondition(route.if, progress.variables)) {
          return interpolate(route.then);
        }
      }
    }

    return interpolate(currentChapter.defaultIntro);
  }, [currentChapter, progress.variables]);

  const storyFinished = progress.finaleId !== null;

  const startChapter = useCallback(
    (chapterId: string) => {
      const chapter = story.chapters.find((c) => c.id === chapterId);
      if (!chapter) return;
      setActiveChapterId(chapterId);
      setCurrentNodeId(chapter.start);
      setChapterFinished(false);
    },
    [story.chapters],
  );

  const advance = useCallback(() => {
    if (!currentChapter || !currentNode) return;

    const node = currentChapter.nodes[resolvedNodeId];
    if (!node) return;

    if ("next" in node && node.next) {
      const next = resolveDisplayNode(
        currentChapter,
        node.next,
        progress.variables,
      );
      setCurrentNodeId(next.nodeId);

      const nextNode = next.node;
      if (nextNode?.type === "ending") {
        setChapterFinished(true);
      }
    }
  }, [
    currentChapter,
    currentNode,
    resolvedNodeId,
    progress.variables,
    resolveDisplayNode,
  ]);

  const chooseOption = useCallback(
    (optionId: string, nextNodeId: string, _timedOut = false) => {
      if (!currentChapter) return;

      const node = currentChapter.nodes[resolvedNodeId];
      if (!node) return;

      let effects: Record<string, VariableValue> | undefined;

      if (node.type === "choice") {
        const option = node.options.find((o) => o.id === optionId);
        effects = option?.sets;
      } else if (node.type === "slider") {
        if (node.setsVariable) {
          const numericValue = parseInt(optionId.replace("slider_", ""), 10);
          if (Number.isFinite(numericValue)) {
            effects = { [node.setsVariable]: numericValue };
          }
        }
      } else if (node.type === "ending") {
        effects = node.sets;
      }

      const nextVariables = effects
        ? { ...progress.variables, ...effects }
        : progress.variables;

      const choiceLabel =
        node.type === "choice"
          ? (node.options.find((o) => o.id === optionId)?.text ?? optionId)
          : node.type === "ending"
            ? node.outcome
            : node.type === "slider"
              ? // Не показываем сырое "slider_67" в истории выборов — берём
                // подпись ближайшего шага шкалы, как это уже делает сам
                // SliderChoice для превью во время игры.
                (() => {
                  const numericValue = parseInt(
                    optionId.replace("slider_", ""),
                    10,
                  );
                  const sorted = [...node.steps].sort(
                    (a, b) => b.threshold - a.threshold,
                  );
                  const step =
                    sorted.find((s) => numericValue >= s.threshold) ??
                    node.steps[0];
                  return step?.label ?? optionId;
                })()
              : optionId;

      const nextProgress: StoryProgress = {
        ...progress,
        variables: nextVariables,
        choices: [
          ...progress.choices,
          {
            chapterId: currentChapter.id,
            nodeId: resolvedNodeId,
            optionId,
            label: choiceLabel,
            at: Date.now(),
          },
        ],
      };

      setProgress(nextProgress);
      saveStoryProgress(nextProgress);

      const next = resolveDisplayNode(
        currentChapter,
        nextNodeId,
        nextVariables,
      );
      setCurrentNodeId(next.nodeId);

      if (next.node?.type === "ending") {
        setChapterFinished(true);
      }
    },
    [currentChapter, resolvedNodeId, progress, resolveDisplayNode],
  );

  const completeChapter = useCallback(() => {
    if (!currentChapter) return;

    const wasAlreadyCompleted = progress.completedChapters.includes(
      currentChapter.id,
    );

    const nextProgress: StoryProgress = {
      ...progress,
      completedChapters: wasAlreadyCompleted
        ? progress.completedChapters
        : [...progress.completedChapters, currentChapter.id],
    };

    const isStoryFinished =
      nextProgress.completedChapters.length >= story.chapters.length;

    if (isStoryFinished) {
      for (const finale of story.finales) {
        const allMatch = finale.conditions.every((cond) =>
          checkCondition(cond, nextProgress.variables),
        );
        if (allMatch) {
          nextProgress.finaleId = finale.id;
          nextProgress.completedAt = Date.now();
          break;
        }
      }
    }

    // Начисление монет — по реестру наград, который переживает сброс
    // прогресса истории (иначе сброс + повторное прохождение = бесконечный
    // фарм монет).
    if (!hasChapterBeenRewarded(story.slug, currentChapter.id)) {
      addCoins(30);
      markChapterRewarded(story.slug, currentChapter.id);
    }
    if (isStoryFinished && !hasFinaleBeenRewarded(story.slug)) {
      addCoins(100);
      markFinaleRewarded(story.slug);
    }

    setProgress(nextProgress);
    saveStoryProgress(nextProgress);
    setActiveChapterId(null);
    setCurrentNodeId(null);
    setChapterFinished(false);
  }, [
    currentChapter,
    progress,
    story.chapters.length,
    story.finales,
    story.slug,
    addCoins,
  ]);

  const resetStory = useCallback(() => {
    const fresh: StoryProgress = {
      storySlug: story.slug,
      completedChapters: [],
      variables: { ...story.initialVariables },
      choices: [],
      finaleId: null,
      startedAt: Date.now(),
      completedAt: null,
    };
    setProgress(fresh);
    saveStoryProgress(fresh);
    setActiveChapterId(null);
    setCurrentNodeId(null);
    setChapterFinished(false);
  }, [story.initialVariables, story.slug]);

  return {
    progress,
    currentChapter,
    currentNode,
    chapterIntro,
    currentNodeId: resolvedNodeId,
    chapterFinished,
    storyFinished,
    startChapter,
    chooseOption,
    advance,
    completeChapter,
    resetStory,
  };
}
