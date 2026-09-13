import { useCallback, useEffect, useState } from 'react'
import { useTelegram } from './hooks/useTelegram'
import { useStreak } from './hooks/useStreak'
import { useServerSync } from './hooks/useServerSync'
import { ProgressProvider } from './contexts/ProgressContext'
import { DilemmaPlayer } from './components/DilemmaPlayer'
import { ShareButton } from './components/ShareButton'
import { StreakBadge } from './components/StreakBadge'
import { CompletedToday } from './components/CompletedToday'
import { DailyCheckIn } from './components/DailyCheckIn'
import { MinorityMirror } from './components/MinorityMirror'
import { AnonymousTribunal } from './components/AnonymousTribunal'
import { BottomNav, type TabId } from './components/BottomNav'
import { SidebarNav } from './components/SidebarNav'
import { ArchivePage } from './pages/ArchivePage'
import { ProfilePage } from './pages/ProfilePage'
import { AboutPage } from './pages/AboutPage'
import { StoriesPage } from './pages/StoriesPage'
import { StoryPlayer } from './pages/StoryPlayer'
import { StorySummary } from './pages/StorySummary'
import { getTodayDilemma } from './data/dilemmas'
import { getMockResult, recordLocalSession } from './utils/mockStats'
import {
  markDilemmaCompleted,
  isDilemmaCompletedToday,
} from './utils/dailyProgress'
import { saveResult, loadResult } from './utils/savedResult'
import { getMinorityMirror } from './data/minorityMirrors'
import { getOpponentArguments } from './data/anonymousArguments'
import {
  hasSubmittedArgument,
  submitArgument,
} from './utils/anonymousArchive'
import { confirmDialog } from './utils/confirmDialog'
import type { Dilemma, DilemmaResult, PlayMode, Story } from './types'
import { useProgress } from './contexts/ProgressContext'
import { ErrorBoundary } from './components/ErrorBoundary'

type Screen = 'tab' | 'playing' | 'result' | 'story' | 'story-summary'

function AppContent() {
  const { user, ready, isTelegram, showBackButton, hideBackButton } =
    useTelegram()
  const { addCoins, hasItem, consumeItem } = useProgress()
  // "Заморозка стрика" из инвентаря магазина защищает именно этот, видимый
  // пользователю стрик (а не отдельный счётчик визитов внутри ProgressContext).
  const hasStreakFreeze = useCallback(
    () => hasItem('streak_freeze'),
    [hasItem],
  )
  const consumeStreakFreeze = useCallback(
    () => consumeItem('streak_freeze'),
    [consumeItem],
  )
  const { progress, setProgress, countdown } = useStreak(
    hasStreakFreeze,
    consumeStreakFreeze,
  )
  const { serverStreak, markCompleted } = useServerSync(
    user?.first_name,
    user?.username,
  )

  const [activeTab, setActiveTab] = useState<TabId>('today')
  const [screen, setScreen] = useState<Screen>('tab')
  const [activeDilemma, setActiveDilemma] = useState<Dilemma>(() =>
    getTodayDilemma(),
  )
  const [playMode, setPlayMode] = useState<PlayMode>('normal')
  const [result, setResult] = useState<DilemmaResult | null>(null)
  const [resultMode, setResultMode] = useState<PlayMode>('normal')
  const [coinsEarned, setCoinsEarned] = useState(0)
  const [argSubmitted, setArgSubmitted] = useState(false)
  const [activeStory, setActiveStory] = useState<Story | null>(null)

  const todayDilemma = getTodayDilemma()
  const completedToday = isDilemmaCompletedToday(todayDilemma.slug)

  useEffect(() => {
    if (completedToday && !result) {
      const saved = loadResult(todayDilemma.slug)
      if (saved) setResult(saved)
    }
  }, [completedToday, result, todayDilemma.slug])

  useEffect(() => {
    if (result) {
      setArgSubmitted(hasSubmittedArgument(activeDilemma.slug))
    }
  }, [result, activeDilemma.slug])

  // Нативная кнопка "Назад" Telegram — показываем на любом экране, где мы
  // не в основных вкладках. У экрана "playing" (прохождение дилеммы) до
  // этого вообще не было способа выйти, кроме как пройти её до конца.
  // ВАЖНО: этот эффект обязан идти до раннего `if (!ready) return` ниже —
  // хуки нельзя вызывать условно, иначе React теряет счёт хуков между
  // рендерами ("Rendered more hooks than during the previous render").
  useEffect(() => {
    if (screen === 'tab') {
      hideBackButton()
      return
    }

    if (screen === 'story-summary') {
      showBackButton(() => setScreen('story'))
    } else if (screen === 'story') {
      showBackButton(handleCloseStory)
    } else {
      // 'playing' и 'result'
      showBackButton(() => setScreen('tab'))
    }

    return () => hideBackButton()
  }, [screen, showBackButton, hideBackButton])

  if (!ready) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center">
        <div className="text-sm opacity-50">Загрузка…</div>
      </div>
    )
  }

  function handleStartToday(mode: PlayMode = 'normal') {
    setActiveDilemma(todayDilemma)
    setPlayMode(mode)
    setScreen('playing')
  }

  function handleStartImpulse() {
    setPlayMode('impulse')
    setScreen('playing')
  }

  function handleOpenFromArchive(dilemma: Dilemma) {
    setActiveDilemma(dilemma)
    setPlayMode('normal')
    setScreen('playing')
  }

  function handleOpenStory(story: Story) {
    setActiveStory(story)
    setScreen('story')
  }

  function handleCloseStory() {
    setActiveStory(null)
    setScreen('tab')
  }

  async function handleComplete(finalOption: string, mode: PlayMode) {
    // Снимаем "было ли это уже пройдено" ДО записи — и для стрика,
    // и отдельно для начисления монет (чтобы нельзя было накрутить их,
    // повторно проходя уже пройденную дилемму).
    const wasCompletedToday = isDilemmaCompletedToday(activeDilemma.slug)
    const hadCompletedSlugBefore = Boolean(
      progress.completedDilemmas[activeDilemma.slug],
    )
    const hadImpulsedSlugBefore = progress.impulseDilemmas.includes(
      activeDilemma.slug,
    )
    const isToday = activeDilemma.slug === todayDilemma.slug

    recordLocalSession(activeDilemma.slug, finalOption)
    const updated = markDilemmaCompleted(activeDilemma.slug, mode, isToday)
    setProgress(updated)

    // ─── Начисление монет ───
    // Монеты начисляются только за НОВЫЙ прогресс: за сегодняшнюю дилемму
    // (по одному разу в день) или за дилемму, пройденную впервые.
    // Повторное прохождение уже пройденной дилеммы монет не даёт —
    // иначе их можно копить бесконечно, просто листая архив по кругу.
    let earned = 0
    if (mode === 'impulse') {
      earned = hadImpulsedSlugBefore ? 0 : 20
    } else if (isToday && !wasCompletedToday) {
      earned = 25
    } else if (!hadCompletedSlugBefore) {
      earned = 15
    }

    if (earned > 0) addCoins(earned)
    setCoinsEarned(earned)

    const r = getMockResult(activeDilemma, finalOption)
    if (isToday && mode === 'normal') {
      saveResult(todayDilemma.slug, r)
    }

    if (isToday && mode === 'normal') {
      markCompleted(activeDilemma.slug).catch((err) => {
        console.warn('Не удалось синхронизировать с сервером:', err)
      })
    }

    setResult(r)
    setResultMode(mode)
    setScreen('result')
  }

  function handleBackToTabs() {
    setScreen('tab')
  }

  // Единая точка смены вкладки — используется и мобильным BottomNav, и
  // десктопным SidebarNav. SidebarNav виден на любом экране (result,
  // playing, story...), и без явного сброса screen в 'tab' клик по
  // вкладке в сайдбаре менял бы только activeTab, а видимый контент
  // оставался бы залипшим на прежнем экране.
  function handleTabChange(tab: TabId) {
    setActiveTab(tab)
    setScreen('tab')
  }

  async function handleReset() {
    const confirmed = await confirmDialog(
      'Сбросить прогресс дилеммы? Стрик тоже обнулится.',
    )
    if (!confirmed) return
    localStorage.removeItem('daily-dilemma-progress-v1')
    localStorage.removeItem('daily-dilemma-last-result-v1')
    localStorage.removeItem('daily-dilemma-mock-stats-v1')
    localStorage.removeItem('daily-dilemma-anonymous-args-v1')
    localStorage.removeItem('daily-dilemma-story-wrong-error')
    window.location.reload()
  }

  function handleSubmitArgument(text: string) {
    submitArgument(activeDilemma.slug, text)
    setArgSubmitted(true)
  }

  const mirror = result
    ? getMinorityMirror(activeDilemma.slug, result.your_choice)
    : null

  const showMirror =
    mirror !== null &&
    result !== null &&
    result.match_percent <= mirror.maxPercent

  const opponentArguments = result
    ? getOpponentArguments(activeDilemma.slug, result.your_choice)
    : []

  const displayStreak = Math.max(
    progress.currentStreak,
    serverStreak?.streak ?? 0,
  )
  const displayLongest = Math.max(progress.longestStreak, displayStreak)

  return (
    <div className="app-shell">
      <div className="mx-auto flex w-full max-w-6xl md:gap-6">
        <SidebarNav activeTab={activeTab} onTabChange={handleTabChange} />

        <main className="flex min-h-screen w-full flex-1 flex-col">
          <div className="safe-top mx-auto flex w-full max-w-md flex-col px-4 pb-28 pt-4 md:max-w-2xl md:pb-10">
            {screen === 'tab' && activeTab === 'today' && (
              <header className="mb-6 flex items-start justify-between gap-3 md:hidden">
                <div className="flex flex-col">
                  <h1 className="text-2xl font-bold">Дилемма дня</h1>
                  <p className="mt-1 text-sm opacity-60">
                    Один выбор в день. Живая статистика.
                  </p>
                </div>
                <StreakBadge
                  streak={displayStreak}
                  longestStreak={displayLongest}
                />
              </header>
            )}

            {screen === 'tab' && activeTab === 'today' && (
              <div className="mb-4">
                <DailyCheckIn />
              </div>
            )}

            {screen === 'tab' && activeTab === 'today' && !completedToday && (
              <div className="flex flex-col gap-4">
                <div
                  className="rounded-2xl p-5"
                  style={{ backgroundColor: 'var(--app-secondary)' }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide opacity-50">
                    {user
                      ? `Привет, ${user.first_name ?? 'гость'}`
                      : 'Отладка в браузере'}
                  </p>
                  <p className="mt-3 text-base font-semibold leading-snug">
                    {todayDilemma.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed opacity-70">
                    {todayDilemma.intro}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartToday('normal')}
                  className="w-full rounded-2xl py-3.5 text-sm font-semibold transition-opacity active:opacity-80"
                  style={{
                    backgroundColor: 'var(--app-accent)',
                    color: 'var(--app-accent-text)',
                  }}
                >
                  Пройти дилемму
                </button>

                <button
                  type="button"
                  onClick={() => handleStartToday('impulse')}
                  className="w-full rounded-2xl py-3 text-sm font-semibold transition-opacity active:opacity-80"
                  style={{
                    backgroundColor: 'var(--app-secondary)',
                    color: 'var(--app-text)',
                  }}
                >
                  ⚡ Пройти в режиме импульса
                </button>

                <p className="text-center text-[11px] opacity-40">
                  {isTelegram ? 'Telegram Mini App' : 'Веб-режим (отладка)'}
                </p>
              </div>
            )}

            {screen === 'tab' && activeTab === 'today' && completedToday && (
              <div className="flex flex-col gap-4">
                <CompletedToday countdown={countdown} />

                {result && (
                  <>
                    <div
                      className="rounded-2xl p-5 text-center"
                      style={{ backgroundColor: 'var(--app-secondary)' }}
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-50">
                        Твой выбор
                      </p>
                      <p className="mt-2 text-lg font-bold">
                        {result.your_outcome}
                      </p>
                      <p className="mt-3 text-sm opacity-70">
                        {result.match_label}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleStartImpulse}
                      className="w-full rounded-2xl py-3 text-sm font-semibold transition-opacity active:opacity-80"
                      style={{
                        backgroundColor: 'var(--app-secondary)',
                        color: 'var(--app-text)',
                      }}
                    >
                      ⚡ Пройти в режиме импульса
                    </button>

                    {showMirror && mirror && <MinorityMirror mirror={mirror} percent={result.match_percent} />}

                    <div
                      className="rounded-2xl p-4"
                      style={{ backgroundColor: 'var(--app-secondary)' }}
                    >
                      <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide opacity-50">
                        Как поступили другие
                      </p>
                      <div className="flex flex-col gap-2.5">
                        {Object.entries(result.stats)
                          .sort((a, b) => b[1] - a[1])
                          .map(([optionId, count]) => {
                            const label =
                              todayDilemma.scenario.final_stats_map[optionId] ??
                              optionId
                            const percent = Math.round(
                              (count / result.total_players) * 100,
                            )
                            const isYours = optionId === result.your_choice
                            return (
                              <div
                                key={optionId}
                                className="flex flex-col gap-1"
                              >
                                <div className="flex items-baseline justify-between">
                                  <span
                                    className={`text-xs ${
                                      isYours ? 'font-semibold' : 'opacity-70'
                                    }`}
                                  >
                                    {label}
                                    {isYours ? ' · ты' : ''}
                                  </span>
                                  <span
                                    className="text-xs font-bold tabular-nums"
                                    style={{
                                      color: isYours
                                        ? 'var(--app-accent)'
                                        : undefined,
                                    }}
                                  >
                                    {percent}%
                                  </span>
                                </div>
                                <div
                                  className="h-1.5 w-full overflow-hidden rounded-full"
                                  style={{
                                    backgroundColor: 'rgba(128,128,128,0.15)',
                                  }}
                                >
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      width: `${percent}%`,
                                      backgroundColor: isYours
                                        ? 'var(--app-accent)'
                                        : 'rgba(128,128,128,0.6)',
                                    }}
                                  />
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    </div>

                    <AnonymousTribunal
                      opponentArguments={opponentArguments}
                      onSubmitArgument={handleSubmitArgument}
                      alreadySubmitted={argSubmitted}
                    />

                    <ShareButton
                      result={result}
                      dilemmaTitle={todayDilemma.title}
                    />
                  </>
                )}

                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-2 w-full rounded-2xl py-3 text-xs font-semibold opacity-40 transition-opacity active:opacity-60"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--app-text)',
                  }}
                >
                  Сбросить прогресс (для теста)
                </button>
              </div>
            )}

            {screen === 'tab' && activeTab === 'archive' && (
              <ArchivePage onOpenDilemma={handleOpenFromArchive} />
            )}

            {screen === 'tab' && activeTab === 'stories' && (
              <StoriesPage onOpenStory={handleOpenStory} />
            )}

            {screen === 'tab' && activeTab === 'profile' && <ProfilePage />}

            {screen === 'tab' && activeTab === 'about' && <AboutPage />}

            {screen === 'playing' && (
              <DilemmaPlayer
                dilemma={activeDilemma}
                mode={playMode}
                onComplete={handleComplete}
                onClose={handleBackToTabs}
                hasSecondChance={() => hasItem('second_chance')}
                consumeSecondChance={() => consumeItem('second_chance')}
              />
            )}

            {screen === 'story' && activeStory && (
              <StoryPlayer
                story={activeStory}
                onClose={handleCloseStory}
                onShowSummary={() => setScreen('story-summary')}
              />
            )}

            {screen === 'story-summary' && activeStory && (
              <StorySummary
                story={activeStory}
                onClose={() => setScreen('story')}
                onReset={async () => {
                  const confirmed = await confirmDialog(
                    'Сбросить прогресс этой истории?',
                  )
                  if (!confirmed) return
                  localStorage.removeItem(
                    `daily-dilemma-story-${activeStory.slug}`,
                  )
                  setScreen('story')
                  window.location.reload()
                }}
              />
            )}

            {screen === 'result' && result && (
              <div className="flex flex-col gap-4">
                {coinsEarned > 0 && (
                  <div
                    className="flex items-center justify-center gap-1.5 rounded-2xl p-3 text-sm font-semibold"
                    style={{
                      backgroundColor: 'rgba(250, 204, 21, 0.15)',
                      color: '#b45309',
                    }}
                  >
                    🪙 +{coinsEarned} монет
                  </div>
                )}

                {resultMode === 'impulse' && (
                  <div
                    className="flex items-center gap-2 rounded-2xl p-3"
                    style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)' }}
                  >
                    <span
                      className="text-[11px] font-semibold uppercase tracking-wide"
                      style={{ color: '#f59e0b' }}
                    >
                      ⚡ Импульсный режим
                    </span>
                  </div>
                )}

                <div
                  className="rounded-2xl p-5 text-center"
                  style={{ backgroundColor: 'var(--app-secondary)' }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide opacity-50">
                    Твой выбор
                  </p>
                  <p className="mt-2 text-lg font-bold">
                    {result.your_outcome}
                  </p>
                  <p className="mt-3 text-sm opacity-70">
                    {result.match_label}
                  </p>
                </div>

                {showMirror && mirror && <MinorityMirror mirror={mirror} percent={result.match_percent} />}

                <div
                  className="rounded-2xl p-4"
                  style={{ backgroundColor: 'var(--app-secondary)' }}
                >
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide opacity-50">
                    Как поступили другие
                  </p>
                  <div className="flex flex-col gap-2.5">
                    {Object.entries(result.stats)
                      .sort((a, b) => b[1] - a[1])
                      .map(([optionId, count]) => {
                        const label =
                          activeDilemma.scenario.final_stats_map[optionId] ??
                          optionId
                        const percent = Math.round(
                          (count / result.total_players) * 100,
                        )
                        const isYours = optionId === result.your_choice
                        return (
                          <div key={optionId} className="flex flex-col gap-1">
                            <div className="flex items-baseline justify-between">
                              <span
                                className={`text-xs ${
                                  isYours ? 'font-semibold' : 'opacity-70'
                                }`}
                              >
                                {label}
                                {isYours ? ' · ты' : ''}
                              </span>
                              <span
                                className="text-xs font-bold tabular-nums"
                                style={{
                                  color: isYours
                                    ? 'var(--app-accent)'
                                    : undefined,
                                }}
                              >
                                {percent}%
                              </span>
                            </div>
                            <div
                              className="h-1.5 w-full overflow-hidden rounded-full"
                              style={{
                                backgroundColor: 'rgba(128,128,128,0.15)',
                              }}
                            >
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${percent}%`,
                                  backgroundColor: isYours
                                    ? 'var(--app-accent)'
                                    : 'rgba(128,128,128,0.6)',
                                }}
                              />
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>

                <AnonymousTribunal
                  opponentArguments={opponentArguments}
                  onSubmitArgument={handleSubmitArgument}
                  alreadySubmitted={argSubmitted}
                />

                <ShareButton
                  result={result}
                  dilemmaTitle={activeDilemma.title}
                />

                <button
                  type="button"
                  onClick={handleBackToTabs}
                  className="w-full rounded-2xl py-3 text-sm font-semibold transition-opacity active:opacity-80"
                  style={{
                    backgroundColor: 'var(--app-secondary)',
                    color: 'var(--app-text)',
                  }}
                >
                  На главную
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {screen === 'tab' && (
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      )}
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <ProgressProvider>
        <AppContent />
      </ProgressProvider>
    </ErrorBoundary>
  )
}