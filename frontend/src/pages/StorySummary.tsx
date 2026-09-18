import { RotateCcw, Share2, Loader2, Check, Download } from "lucide-react";
import { useState } from "react";
import type { Story } from "../types";
import { loadStoryProgress } from "../utils/storyEngine";
import { generateStoryShareCard } from "../utils/shareStoryCard";
import { shareImage } from "../utils/shareImage";
import { StoryPathCard } from "../components/story/StoryPathCard";
import { useProgress } from "../contexts/ProgressContext";

interface StorySummaryProps {
  story: Story;
  onClose: () => void;
  onReset: () => void;
}

type ShareState = "idle" | "generating" | "sharing" | "done" | "failed";

export function StorySummary({ story, onClose, onReset }: StorySummaryProps) {
  const [shareState, setShareState] = useState<ShareState>("idle");
  const [shareMethod, setShareMethod] = useState<
    "telegram" | "download" | "preview" | null
  >(null);
  const { hasItem, consumeItem } = useProgress();

  const progress = loadStoryProgress(story);
  const finale = progress.finaleId
    ? story.finales.find((f) => f.id === progress.finaleId)
    : null;

  const choicesByChapter = story.chapters
    .map((ch) => {
      const chapterChoices = progress.choices.filter(
        (c) => c.chapterId === ch.id,
      );
      return {
        chapter: ch,
        choices: chapterChoices,
      };
    })
    .filter((item) => item.choices.length > 0);

  const totalChoices = progress.choices.length;

  async function handleShare() {
    if (shareState === "generating" || shareState === "sharing") return;

    try {
      setShareState("generating");
      // "Премиум-карточка" списывается за каждый шеринг — расходник.
      // Проверяем, что Telegram WebApp инициализирован (для мобильных устройств)
      const isTelegramWebView = Boolean(window.Telegram?.WebApp?.initData);
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isTelegramWebView && isMobile) {
        // Убеждаемся, что WebApp готов
        const webApp = window.Telegram?.WebApp;
        if (webApp && typeof webApp.ready === 'function') {
          try {
            webApp.ready();
          } catch (e) {
            console.warn('WebApp.ready() call failed:', e);
          }
        }
      }

      const premium = hasItem("premium_card") && consumeItem("premium_card");
      const blob = await generateStoryShareCard({
        story,
        progress,
        finale: finale ?? null,
        premium,
      });
      setShareState("sharing");
      const outcome = await shareImage(
        blob,
        `story-${story.slug}-${Date.now()}.png`,
      );

      if (outcome.method === "failed") {
        console.error("Story share failed:", outcome.error);
        setShareState("failed");
        setTimeout(() => setShareState("idle"), 2500);
        return;
      }

      setShareMethod(outcome.method);
      setShareState("done");
      setTimeout(
        () => {
          setShareState("idle");
          setShareMethod(null);
        },
        outcome.method === "preview" ? 5000 : 2500,
      );
    } catch (err) {
      console.error("Story share error:", err);
      setShareState("failed");
      setTimeout(() => setShareState("idle"), 2500);
    }
  }

  const shareLabel =
    shareState === "generating"
      ? "Создаём карточку…"
      : shareState === "sharing"
        ? "Открываем…"
        : shareState === "done" && shareMethod === "download"
          ? "Карточка сохранена"
          : shareState === "done" && shareMethod === "preview"
            ? "Зажми картинку, чтобы сохранить"
            : shareState === "done"
              ? "Готово"
              : shareState === "failed"
                ? "Не получилось"
                : "Поделиться историей";

  const ShareIcon =
    shareState === "generating" || shareState === "sharing"
      ? Loader2
      : shareState === "done"
        ? shareMethod === "download"
          ? Download
          : Check
        : Share2;

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={onClose}
        className="self-start text-xs font-medium opacity-70"
      >
        ← Назад
      </button>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Моя история</h1>
        <p className="text-sm opacity-60">
          {story.title} · {totalChoices} ключевых выборов
        </p>
      </div>

      {finale && (
        <div
          className="flex flex-col gap-3 rounded-2xl p-5"
          style={{
            backgroundColor: `${finale.color}15`,
            border: `1px solid ${finale.color}40`,
          }}
        >
          <span
            className="text-[10px] font-bold uppercase tracking-wide"
            style={{ color: finale.color }}
          >
            Твоя концовка
          </span>
          <p className="text-lg font-bold" style={{ color: finale.color }}>
            {finale.title}
          </p>
          <p className="text-xs leading-relaxed opacity-80">
            {finale.description}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-wide opacity-50">
          Твой путь
        </h2>
        <div className="flex flex-col gap-2">
          {choicesByChapter.map(({ chapter, choices }) => (
            <div key={chapter.id} className="flex flex-col gap-2">
              {choices.map((choice, i) => (
                <StoryPathCard
                  key={`${chapter.id}-${i}`}
                  chapterTitle={chapter.title}
                  chapterIndex={chapter.index}
                  choiceLabel={choice.label}
                  chapterColor={story.coverColor}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleShare}
          disabled={shareState === "generating" || shareState === "sharing"}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-white transition-opacity active:opacity-80 disabled:opacity-60"
          style={{ backgroundColor: story.coverColor }}
        >
          <ShareIcon
            size={16}
            className={
              shareState === "generating" || shareState === "sharing"
                ? "calm-pulse"
                : ""
            }
          />
          {shareLabel}
        </button>

        <button
          type="button"
          onClick={onReset}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold transition-opacity active:opacity-80"
          style={{
            backgroundColor: "var(--app-secondary)",
            color: "var(--app-text)",
          }}
        >
          <RotateCcw size={14} />
          Пройти иначе
        </button>
      </div>
    </div>
  );
}
