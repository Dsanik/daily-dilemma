import { useCallback, useState, useRef, useEffect } from "react";
import type { Dilemma, PlayMode } from "../types";
import { useDilemma } from "../hooks/useDilemma";
import { SliderChoice } from "./SliderChoice";
import { ImpulseTimer } from "./ImpulseTimer";

interface DilemmaPlayerProps {
  dilemma: Dilemma;
  mode?: PlayMode;
  onComplete: (finalOption: string, mode: PlayMode) => void;
  onClose?: () => void;
  hasSecondChance?: () => boolean;
  consumeSecondChance?: () => void;
}

export function DilemmaPlayer({
  dilemma,
  mode = "normal",
  onComplete,
  onClose,
  hasSecondChance,
  consumeSecondChance,
}: DilemmaPlayerProps) {
  const { session, currentNode, chooseOption, advanceText } = useDilemma(
    dilemma,
    mode,
  );
  const [transitioning, setTransitioning] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Финальный optionId, который ждёт подтверждения игроком — чтобы текст
  // концовки не пролетал мимо за 50мс, а действительно читался.
  const [pendingFinalOption, setPendingFinalOption] = useState<string | null>(
    null,
  );

  // Refs for preventing double-tap and managing cleanup
  const processingTimeoutRef = useRef<number | null>(null);
  const lastActionTimeRef = useRef<number>(0);
  const DOUBLE_TAP_THRESHOLD = 300; // ms

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  if (!currentNode) {
    return (
      <div className="rounded-2xl p-4 text-center opacity-60">
        <p className="text-sm">Ошибка: узел не найден</p>
        <p className="mt-2 text-xs opacity-70">
          Попробуйте перезагрузить страницу
        </p>
      </div>
    );
  }

  // Double-tap protection
  const isDoubleTab = useCallback(() => {
    const now = Date.now();
    const timeSinceLastAction = now - lastActionTimeRef.current;

    if (timeSinceLastAction < DOUBLE_TAP_THRESHOLD) {
      return true;
    }

    lastActionTimeRef.current = now;
    return false;
  }, []);

  function finishWithNext(
    optionId: string,
    nextNodeId: string,
    wasTimeout: boolean,
  ) {
    // Никаких проверок isProcessing/isDoubleTab здесь — эта функция всегда
    // вызывается изнутри уже проверенных handleOption/handleSliderConfirm/
    // handleTimeout (через setTimeout), не напрямую по клику. Повторная
    // проверка isDoubleTab() здесь ошибочно принимала САМА СЕБЯ за двойное
    // нажатие: окно защиты — 300мс, а задержка перед вызовом — всего 120мс,
    // так что вызов всегда попадал в это окно и просто ничего не делал.
    try {
      chooseOption(optionId, nextNodeId, wasTimeout);
      const nextNode = dilemma.scenario.nodes[nextNodeId];
      if (nextNode?.type === "ending") {
        // Для слайдера optionId — синтетическая строка "slider_67" (сырое
        // положение ползунка), которая не совпадает ни с одним ключом в
        // final_stats_map/трейтах (там ключи — id концовки, "ending_demote"
        // и т.п.). Без этой замены результат показывал бы буквально
        // "slider_67" вместо человекочитаемого исхода, а статистика "X%
        // поступили как ты" почти всегда была бы 0%, потому что два разных
        // прохождения почти никогда не попадают на одно и то же значение
        // ползунка. Используем id самой концовки — он уже совпадает с тем,
        // что ждут final_stats_map и OPTION_TRAITS.
        const finalId = optionId.startsWith("slider_") ? nextNodeId : optionId;
        setPendingFinalOption(finalId);
      }
    } catch (error) {
      console.error("Error in finishWithNext:", error);
      // Could show error message to user here
    }
  }

  function handleOption(optionId: string, nextNodeId: string) {
    if (transitioning || isProcessing || isDoubleTab()) return;

    setTransitioning(true);
    setTimedOut(false);
    setIsProcessing(true);

    // Add haptic feedback if available
    try {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.selectionChanged();
      }
    } catch (error) {
      // Ignore haptic feedback errors
    }

    processingTimeoutRef.current = setTimeout(() => {
      try {
        finishWithNext(optionId, nextNodeId, false);
      } finally {
        setTransitioning(false);
        setIsProcessing(false);
      }
    }, 120);
  }

  function handleSliderConfirm(value: number, nextNodeId: string) {
    if (transitioning || isProcessing || isDoubleTab()) return;

    setTransitioning(true);
    setTimedOut(false);
    setIsProcessing(true);

    // Add haptic feedback
    try {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred("medium");
      }
    } catch (error) {
      // Ignore haptic feedback errors
    }

    processingTimeoutRef.current = setTimeout(() => {
      try {
        finishWithNext(`slider_${value}`, nextNodeId, false);
      } finally {
        setTransitioning(false);
        setIsProcessing(false);
      }
    }, 120);
  }

  function handleAdvance() {
    if (transitioning || isProcessing || isDoubleTab()) return;

    setTransitioning(true);
    setIsProcessing(true);

    processingTimeoutRef.current = setTimeout(() => {
      try {
        advanceText();
      } finally {
        setTransitioning(false);
        setIsProcessing(false);
      }
    }, 120);
  }

  function handleComplete() {
    if (isProcessing || !pendingFinalOption || isDoubleTab()) return;

    setIsProcessing(true);

    // Add success haptic feedback
    try {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
      }
    } catch (error) {
      // Ignore haptic feedback errors
    }

    try {
      onComplete(pendingFinalOption, mode);
    } catch (error) {
      console.error("Error in handleComplete:", error);
      setIsProcessing(false);
    }
  }

  const handleTimeout = useCallback(() => {
    if (transitioning || isProcessing) return;

    setTimedOut(true);
    setTransitioning(true);
    setIsProcessing(true);

    const node = currentNode;

    processingTimeoutRef.current = setTimeout(() => {
      try {
        if (node.type === "choice" && node.options && node.options.length > 0) {
          const randomIndex = Math.floor(Math.random() * node.options.length);
          const randomOption = node.options[randomIndex];
          finishWithNext(randomOption.id, randomOption.next, true);
        } else if (node.type === "slider") {
          const randomValue = Math.floor(Math.random() * 101);
          const sorted = [...node.steps].sort(
            (a, b) => b.threshold - a.threshold,
          );
          const step =
            sorted.find((s) => randomValue >= s.threshold) ?? node.steps[0];
          const outcomeNode =
            node.outcomes[step.threshold] ?? Object.values(node.outcomes)[0];
          finishWithNext(`slider_${randomValue}`, outcomeNode, true);
        }
      } finally {
        setTransitioning(false);
        setIsProcessing(false);
      }
    }, 300);
  }, [currentNode, transitioning, isProcessing]);

  const isIntro = currentNode.type === "text";
  const isChoice = currentNode.type === "choice";
  const isSlider = currentNode.type === "slider";
  const isEnding = currentNode.type === "ending";

  // Безопасно достаём текст с учётом union-типа ScenarioNode
  let bodyText = "";
  if (isIntro && session.choices.length === 0) {
    bodyText = dilemma.intro;
  } else if (
    currentNode.type === "text" ||
    currentNode.type === "choice" ||
    currentNode.type === "slider" ||
    currentNode.type === "ending" ||
    currentNode.type === "dialogue"
  ) {
    bodyText = currentNode.text ?? "";
  } else if (currentNode.type === "funnel") {
    bodyText = currentNode.defaultText;
  }

  const showTimer =
    mode === "impulse" &&
    !transitioning &&
    !isProcessing &&
    (currentNode.type === "choice" || currentNode.type === "slider") &&
    "tension" in currentNode &&
    Boolean(currentNode.tension);

  const tension =
    mode === "impulse" && "tension" in currentNode && currentNode.tension
      ? currentNode.tension
      : null;

  return (
    <div
      className="flex flex-col gap-4"
      style={{
        opacity: transitioning ? 0.4 : 1,
        transition: "opacity 120ms ease-out",
        pointerEvents: isProcessing ? "none" : "auto",
      }}
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          disabled={isProcessing}
          className="self-start text-xs opacity-50 transition-opacity active:opacity-80 disabled:opacity-20"
        >
          ← Выйти
        </button>
      )}

      {mode === "impulse" && (
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wide opacity-60">
            ⚡ Импульсный режим
          </span>
          {showTimer && tension && (
            <ImpulseTimer
              tension={tension}
              onExpire={handleTimeout}
              resetKey={session.currentNodeId}
              hasSecondChance={hasSecondChance}
              consumeSecondChance={consumeSecondChance}
            />
          )}
        </div>
      )}

      <div
        className="rounded-2xl p-5"
        style={{ backgroundColor: "var(--app-secondary)" }}
      >
        <p className="text-base leading-relaxed whitespace-pre-line">
          {bodyText}
        </p>
      </div>

      {timedOut && (
        <div
          className="flex items-center gap-2 rounded-2xl p-3"
          style={{ backgroundColor: "rgba(220, 38, 38, 0.12)" }}
        >
          <span
            className="text-[11px] font-semibold"
            style={{ color: "#dc2626" }}
          >
            ⏱ Время истекло. Сработал случай.
          </span>
        </div>
      )}

      {isProcessing && (
        <div
          className="flex items-center justify-center gap-2 rounded-2xl p-3"
          style={{ backgroundColor: "rgba(74, 158, 255, 0.12)" }}
        >
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          <span
            className="text-[11px] font-semibold"
            style={{ color: "#4a9eff" }}
          >
            Обработка...
          </span>
        </div>
      )}

      {isIntro && !isProcessing && (
        <button
          type="button"
          onClick={handleAdvance}
          disabled={transitioning || isProcessing}
          className="w-full rounded-2xl py-3.5 text-sm font-semibold transition-opacity active:opacity-80 disabled:opacity-40"
          style={{
            backgroundColor: "var(--app-accent)",
            color: "var(--app-accent-text)",
          }}
        >
          Дальше
        </button>
      )}

      {isChoice &&
        "options" in currentNode &&
        currentNode.options &&
        !isProcessing && (
          <div className="flex flex-col gap-2">
            {currentNode.options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleOption(option.id, option.next)}
                disabled={transitioning || isProcessing}
                className="rounded-2xl p-4 text-left text-sm leading-snug transition-opacity active:opacity-70 disabled:opacity-40"
                style={{
                  backgroundColor: "var(--app-secondary)",
                  color: "var(--app-text)",
                }}
              >
                {option.text}
              </button>
            ))}
          </div>
        )}

      {isSlider && currentNode.type === "slider" && !isProcessing && (
        <SliderChoice node={currentNode} onConfirm={handleSliderConfirm} />
      )}

      {isEnding && pendingFinalOption && !isProcessing && (
        <button
          type="button"
          onClick={handleComplete}
          disabled={isProcessing}
          className="w-full rounded-2xl py-3.5 text-sm font-semibold transition-opacity active:opacity-80 disabled:opacity-40"
          style={{
            backgroundColor: "var(--app-accent)",
            color: "var(--app-accent-text)",
          }}
        >
          Понятно
        </button>
      )}
    </div>
  );
}
