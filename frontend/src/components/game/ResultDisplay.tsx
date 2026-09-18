import { ShareButton } from '../ShareButton'
import { MinorityMirror } from '../MinorityMirror'
import { AnonymousTribunal } from '../AnonymousTribunal'
import { Button, Card, Typography, Spacing } from '../ui'
import type { Dilemma, DilemmaResult, PlayMode } from '../../types'

interface ResultDisplayProps {
  dilemma: Dilemma
  result: DilemmaResult & {
    stats_map?: Record<string, number>
    options_map?: Record<string, string>
  }
  mode: PlayMode
  coinsEarned: number
  echo?: {
    pastLabel: string
    currentLabel: string
    daysAgo: number
    sameChoice: boolean
  } | null
  minorityMirror?: any
  opponentArguments?: string[]
  argSubmitted: boolean
  onSubmitArgument: (argument: string) => void
  onBackToTabs: () => void
}

export function ResultDisplay({
  dilemma,
  result,
  coinsEarned,
  echo,
  minorityMirror,
  opponentArguments,
  argSubmitted,
  onSubmitArgument,
  onBackToTabs
}: ResultDisplayProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Основной результат */}
      <Card>
        <Typography variant="caption" color="muted" className="uppercase tracking-wide">
          Твой выбор
        </Typography>
        <Spacing size="sm" />
        <Typography variant="h2">
          {result.your_outcome}
        </Typography>
        {echo && (
          <>
            <Spacing size="md" />
            <Typography variant="body" color="muted">
              {result.match_label}
            </Typography>
          </>
        )}
      </Card>

      {/* Заработанные монеты */}
      {coinsEarned > 0 && (
        <Card variant="subtle">
          <Typography variant="caption" color="accent">
            +{coinsEarned} монет за прохождение!
          </Typography>
        </Card>
      )}

      {/* Статистика */}
      <Card>
        <Typography variant="caption" color="muted" className="uppercase tracking-wide">
          Как поступили другие
        </Typography>
        <Spacing size="md" />
        <div className="flex flex-col gap-4">
          {Object.entries(result.stats_map || result.stats || {}).map(([optionId, count]) => {
            const label = (result.options_map && result.options_map[optionId]) || 
                         (dilemma.scenario.final_stats_map && dilemma.scenario.final_stats_map[optionId]) || 
                         optionId
            const percent = Math.round((count / result.total_players) * 100)
            const isYours = optionId === result.your_choice

            return (
              <div key={optionId} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between">
                  <Typography 
                    variant="caption" 
                    color={isYours ? "primary" : "muted"}
                    className={isYours ? "font-semibold" : ""}
                  >
                    {label}{isYours ? " · ты" : ""}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color={isYours ? "accent" : "muted"}
                    className="font-bold tabular-nums"
                  >
                    {percent}%
                  </Typography>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'var(--calm-border)' }}>
                  <div
                    className="h-full rounded-full calm-transition"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: isYours
                        ? 'var(--tg-theme-button-color, #667eea)'
                        : 'rgba(128,128,128,0.6)',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Зеркало меньшинства */}
      {minorityMirror && typeof minorityMirror === 'object' && 'reflections' in minorityMirror && (
        <MinorityMirror mirror={minorityMirror} percent={result.match_percent} />
      )}

      {/* Анонимный трибунал */}
      {opponentArguments && (
        <AnonymousTribunal
          opponentArguments={opponentArguments}
          onSubmitArgument={onSubmitArgument}
          alreadySubmitted={argSubmitted}
        />
      )}

      {/* Поделиться */}
      <ShareButton
        result={result}
        dilemmaTitle={dilemma.title}
      />

      {/* Назад */}
      <Button variant="secondary" onClick={onBackToTabs} size="lg">
        На главную
      </Button>
    </div>
  )
}