import { useCallback, useEffect, useState } from "react";
import { useTelegram } from "./hooks/useTelegram";
import { useStreak } from "./hooks/useStreak";
import { useServerSync } from "./hooks/useServerSync";
import { ProgressProvider } from "./contexts/ProgressContext";
import { GameFlow } from "./components/game/GameFlow";
import { ResultDisplay } from "./components/game/ResultDisplay";
import { NavigationWrapper } from "./components/navigation/NavigationWrapper";
import { Button, Card, Typography, Spacing } from "./components/ui";
import { MentalLandscape, EnergyIndicator } from "./components/contemplative";
import { DailyCheckIn } from "./components/DailyCheckIn";
import { ArchivePage } from "./pages/ArchivePage";
import { ProfilePage } from "./pages/ProfilePage";
import { AboutPage } from "./pages/AboutPage";
import { StoriesPage } from "./pages/StoriesPage";
import { StoryPlayer } from "./pages/StoryPlayer";
import { StorySummary } from "./pages/StorySummary";
import { getTodayDilemma } from "./data/dilemmas";
import {
  getMockResult,
  recordLocalSession,
  getPastSession,
} from "./utils/mockStats";
import { recordDecision } from "./utils/decisionProfile";
import {
  markDilemmaCompleted,
  isDilemmaCompletedToday,
} from "./utils/dailyProgress";
import { saveResult, loadResult } from "./utils/savedResult";
import { getMinorityMirror } from "./data/minorityMirrors";
import { getOpponentArguments } from "./data/anonymousArguments";
import { hasSubmittedArgument, submitArgument } from "./utils/anonymousArchive";
import { confirmDialog } from "./utils/confirmDialog";
import type { Dilemma, DilemmaResult, PlayMode, Story, TabId } from "./types";
import { useProgress } from "./contexts/ProgressContext";
import { ErrorBoundary } from "./components/ErrorBoundary";

type Screen = "tab" | "playing" | "result" | "story" | "story-summary";

function AppContent() {
  const { user, ready, isTelegram, showBackButton, hideBackButton } =
    useTelegram();
  const { addCoins, hasItem, consumeItem, state, restoreEnergy } = useProgress();
  // "Заморозка стрика" из инвентаря магазина защищает именно этот, видимый
  // пользователю стрик (а не отдельный счётчик визитов внутри ProgressContext).
  const hasStreakFreeze = useCallback(
    () => hasItem("streak_freeze"),
    [hasItem],
  );
  const consumeStreakFreeze = useCallback(
    () => consumeItem("streak_freeze"),
    [consumeItem],
  );
  const { progress, setProgress } = useStreak(
    hasStreakFreeze,
    consumeStreakFreeze,
  );
  const { markCompleted } = useServerSync(
    user?.first_name,
    user?.username,
  );

  const [activeTab, setActiveTab] = useState<TabId>("today");
  const [screen, setScreen] = useState<Screen>("tab");
  const [activeDilemma, setActiveDilemma] = useState<Dilemma>(() =>
    getTodayDilemma(),
  );
  const [playMode, setPlayMode] = useState<PlayMode>("normal");
  const [result, setResult] = useState<DilemmaResult | null>(null);
  const [resultMode, setResultMode] = useState<PlayMode>("normal");
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [echo, setEcho] = useState<{
    pastLabel: string;
    currentLabel: string;
    daysAgo: number;
    sameChoice: boolean;
  } | null>(null);
  const [argSubmitted, setArgSubmitted] = useState(false);
  const [activeStory, setActiveStory] = useState<Story | null>(null);

  const todayDilemma = getTodayDilemma();
  const completedToday = isDilemmaCompletedToday(todayDilemma.slug);

  useEffect(() => {
    if (completedToday && !result) {
      const saved = loadResult(todayDilemma.slug);
      if (saved) setResult(saved);
    }
  }, [completedToday, result, todayDilemma.slug]);

  useEffect(() => {
    if (result) {
      setArgSubmitted(hasSubmittedArgument(activeDilemma.slug));
    }
  }, [result, activeDilemma.slug]);

  // Нативная кнопка "Назад" Telegram — показываем на любом экране, где мы
  // не в основных вкладках. У экрана "playing" (прохождение дилеммы) до
  // этого вообще не было способа выйти, кроме как пройти её до конца.
  // ВАЖНО: этот эффект обязан идти до раннего `if (!ready) return` ниже —
  // хуки нельзя вызывать условно, иначе React теряет счёт хуков между
  // рендерами ("Rendered more hooks than during the previous render").
  useEffect(() => {
    if (screen === "tab") {
      hideBackButton();
      return;
    }

    if (screen === "story-summary") {
      showBackButton(() => setScreen("story"));
    } else if (screen === "story") {
      showBackButton(handleCloseStory);
    } else {
      // 'playing' и 'result'
      showBackButton(() => setScreen("tab"));
    }

    return () => hideBackButton();
  }, [screen, showBackButton, hideBackButton]);

  if (!ready) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center">
        <Typography variant="body" color="muted">
          Загрузка…
        </Typography>
      </div>
    );
  }

  function handleStartToday(mode: PlayMode = "normal") {
    setActiveDilemma(todayDilemma);
    setPlayMode(mode);
    setScreen("playing");
  }

  function handleStartContemplative() {
    setPlayMode("contemplative");
    setScreen("playing");
  }

  function handleOpenFromArchive(dilemma: Dilemma) {
    setActiveDilemma(dilemma);
    setPlayMode("normal");
    setScreen("playing");
  }

  function handleOpenStory(story: Story) {
    setActiveStory(story);
    setScreen("story");
  }

  function handleCloseStory() {
    setActiveStory(null);
    setScreen("tab");
  }

  async function handleComplete(finalOption: string, mode: PlayMode) {
    // Снимаем "было ли это уже пройдено" ДО записи — и для стрика,
    // и отдельно для начисления монет (чтобы нельзя было накрутить их,
    // повторно проходя уже пройденную дилемму).
    const wasCompletedToday = isDilemmaCompletedToday(activeDilemma.slug);
    const hadCompletedSlugBefore = Boolean(
      progress.completedDilemmas[activeDilemma.slug],
    );
    const hadContemplatedBefore = progress.contemplativeDilemmas.includes(
      activeDilemma.slug,
    );
    const isToday = activeDilemma.slug === todayDilemma.slug;

    // "Эхо" — сравнение с собственным прошлым выбором. Снимаем ДО записи
    // новой сессии, иначе getPastSession() вернёт то, что мы только что
    // сами записали, вместо настоящей истории.
    const pastSession = getPastSession(activeDilemma.slug);
    const daysAgo = pastSession
      ? Math.round((Date.now() - pastSession.finishedAt) / 86400000)
      : 0;
    // Не показываем "эхо", если это буквально тот же цикл ротации дилемм —
    // иначе "ты уже отвечал на это" будет всплывать каждые 4 дня и потеряет
    // смысл. Порог в неделю — минимально осмысленный разрыв во времени.
    if (pastSession && daysAgo >= 7) {
      const map = activeDilemma.scenario.final_stats_map;
      setEcho({
        pastLabel: map[pastSession.finalOption] ?? pastSession.finalOption,
        currentLabel: map[finalOption] ?? finalOption,
        daysAgo,
        sameChoice: pastSession.finalOption === finalOption,
      });
    } else {
      setEcho(null);
    }

    recordLocalSession(activeDilemma.slug, finalOption);
    recordDecision(activeDilemma.slug, finalOption);
    const updated = markDilemmaCompleted(activeDilemma.slug, mode, isToday);
    setProgress(updated);

    // ─── Начисление монет ───
    // Монеты начисляются только за НОВЫЙ прогресс: за сегодняшнюю дилемму
    // (по одному разу в день) или за дилемму, пройденную впервые.
    // Повторное прохождение уже пройденной дилеммы монет не даёт —
    // иначе их можно копить бесконечно, просто листая архив по кругу.
    let earned = 0;
    if (mode === "contemplative") {
      earned = hadContemplatedBefore ? 0 : 30; // Higher reward for contemplative mode
    } else if (isToday && !wasCompletedToday) {
      earned = 25;
    } else if (!hadCompletedSlugBefore) {
      earned = 15;
    }

    if (earned > 0) addCoins(earned);
    setCoinsEarned(earned);

    const r = getMockResult(activeDilemma, finalOption);
    if (isToday && mode === "normal") {
      saveResult(todayDilemma.slug, r);
    }

    if (isToday && mode === "normal") {
      markCompleted(activeDilemma.slug).catch((err) => {
        console.warn("Не удалось синхронизировать с сервером:", err);
      });
    }

    setResult(r);
    setResultMode(mode);
    setScreen("result");
  }

  function handleBackToTabs() {
    setScreen("tab");
  }

  // Единая точка смены вкладки — используется и мобильным BottomNav, и
  // десктопным SidebarNav. SidebarNav виден на любом экране (result,
  // playing, story...), и без явного сброса screen в 'tab' клик по
  // вкладке в сайдбаре менял бы только activeTab, а видимый контент
  // оставался бы залипшим на прежнем экране.
  function handleTabChange(tab: TabId) {
    setActiveTab(tab);
    setScreen("tab");
  }

  async function handleReset() {
    const confirmed = await confirmDialog(
      "Сбросить прогресс дилеммы? Стрик тоже обнулится.",
    );
    if (!confirmed) return;
    localStorage.removeItem("daily-dilemma-progress-v1");
    localStorage.removeItem("daily-dilemma-last-result-v1");
    localStorage.removeItem("daily-dilemma-mock-stats-v1");
    localStorage.removeItem("daily-dilemma-anonymous-args-v1");
    localStorage.removeItem("daily-dilemma-story-wrong-error");
    window.location.reload();
  }

  function handleSubmitArgument(text: string) {
    submitArgument(activeDilemma.slug, text);
    setArgSubmitted(true);
  }

  const mirror = result
    ? getMinorityMirror(activeDilemma.slug, result.your_choice)
    : null;

  const showMirror =
    mirror !== null &&
    result !== null &&
    result.match_percent <= mirror.maxPercent;

  const opponentArguments = result
    ? getOpponentArguments(activeDilemma.slug, result.your_choice)
    : [];


  return (
    <NavigationWrapper
      activeTab={activeTab}
      onTabChange={handleTabChange}
      showBottomNav={screen === "tab"}
    >
      {screen === "tab" && activeTab === "today" && (
        <div className="content-spacing-lg">
          <header className="text-center md:hidden">
            <Typography variant="h1">Дилемма дня</Typography>
            <Spacing size="sm" />
            <Typography variant="body" color="muted">
              Пространство для осознанных решений
            </Typography>
          </header>
          
          <DailyCheckIn />

          <EnergyIndicator 
            energy={state.contemplativeEnergy} 
            maxEnergy={100}
            onRestore={() => restoreEnergy()}
          />

          {!completedToday ? (
            <div className="content-spacing">
              <Card>
                <Typography variant="caption" color="muted" className="uppercase tracking-wide">
                  {user
                    ? `Привет, ${user.first_name ?? "гость"}`
                    : "Отладка в браузере"}
                </Typography>
                <Spacing size="md" />
                <Typography variant="h2">{todayDilemma.title}</Typography>
                <Spacing size="sm" />
                <Typography variant="body" color="muted">
                  {todayDilemma.intro}
                </Typography>
              </Card>

              <Button 
                size="lg" 
                onClick={() => handleStartToday("normal")}
                className="w-full"
              >
                Пройти дилемму
              </Button>

              <Button 
                variant="secondary" 
                size="lg" 
                onClick={() => handleStartToday("contemplative")}
                className="w-full"
              >
                🧘 Пройти в режиме созерцания
              </Button>

              <Typography variant="small" color="muted" className="text-center">
                {isTelegram ? "Telegram Mini App" : "Веб-режим (отладка)"}
              </Typography>
            </div>
          ) : (

            <div className="content-spacing">
              <MentalLandscape 
                decisions={[]} // Will be populated from progress data
              />

              {result && (
                <>
                  <Card>
                    <Typography variant="caption" color="muted" className="uppercase tracking-wide text-center">
                      Твой выбор
                    </Typography>
                    <Spacing size="sm" />
                    <Typography variant="h2" className="text-center">
                      {result.your_outcome}
                    </Typography>
                    {echo && (
                      <>
                        <Spacing size="md" />
                        <Typography variant="body" color="muted" className="text-center">
                          {result.match_label}
                        </Typography>
                      </>
                    )}
                  </Card>

                  <Button variant="secondary" size="lg" onClick={handleStartContemplative} className="w-full">
                    🧘 Пройти в режиме созерцания
                  </Button>
                </>
              )}

              <Button variant="ghost" size="sm" onClick={handleReset} className="w-full opacity-60">
                Сбросить прогресс (для теста)  
              </Button>
            </div>
          )}
        </div>
      )}

      {screen === "tab" && activeTab === "archive" && (
        <ArchivePage onOpenDilemma={handleOpenFromArchive} />
      )}

      {screen === "tab" && activeTab === "stories" && (
        <StoriesPage onOpenStory={handleOpenStory} />
      )}

      {screen === "tab" && activeTab === "profile" && <ProfilePage />}

      {screen === "tab" && activeTab === "about" && <AboutPage />}

      {screen === "playing" && (
        <GameFlow
          dilemma={activeDilemma}
          mode={playMode}
          onComplete={handleComplete}
          onClose={handleBackToTabs}
        />
      )}

      {screen === "story" && activeStory && (
        <StoryPlayer
          story={activeStory}
          onClose={handleCloseStory}
          onShowSummary={() => setScreen("story-summary")}
        />
      )}

      {screen === "story-summary" && activeStory && (
        <StorySummary
          story={activeStory}
          onClose={() => setScreen("story")}
          onReset={async () => {
            const confirmed = await confirmDialog(
              "Сбросить прогресс этой истории?",
            );
            if (!confirmed) return;
            localStorage.removeItem(
              `daily-dilemma-story-${activeStory.slug}`,
            );
            setScreen("story");
            window.location.reload();
          }}
        />
      )}

      {screen === "result" && result && (
        <ResultDisplay
          dilemma={activeDilemma}
          result={result}
          mode={resultMode}
          coinsEarned={coinsEarned}
          echo={echo}
          minorityMirror={showMirror && mirror ? mirror : undefined}
          opponentArguments={opponentArguments}
          argSubmitted={argSubmitted}
          onSubmitArgument={handleSubmitArgument}
          onBackToTabs={handleBackToTabs}
        />
      )}

    </NavigationWrapper>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ProgressProvider>
        <AppContent />
      </ProgressProvider>
    </ErrorBoundary>
  );
}
