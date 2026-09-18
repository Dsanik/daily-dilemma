export interface TelegramUser {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  language_code?: string
}

// ─── Дилеммы дня ───

// Tension removed - no more stressful mechanics

export type NodeType =
  | 'text'
  | 'choice'
  | 'slider'
  | 'ending'
  | 'dialogue'
  | 'route'
  | 'funnel'

export type VariableValue = string | number | boolean

export interface StoryVariables {
  [key: string]: VariableValue
}

export interface VariableCondition {
  variable: string
  equals?: VariableValue
  notEquals?: VariableValue
  gt?: number
  lt?: number
}

export interface ConditionalRoute {
  if: VariableCondition
  then: string
  else?: string
}

// ─── Узлы сценария ───

export interface ChoiceOption {
  id: string
  text: string
  next: string
  sets?: Record<string, VariableValue>
}

export interface SliderStep {
  threshold: number
  label: string
}

export interface SliderNode {
  type: 'slider'
  text: string
  leftLabel: string
  rightLabel: string
  leftColor: string
  rightColor: string
  steps: SliderStep[]
  outcomes: Record<number, string>
  defaultValue: number
  setsVariable?: string
}

export interface EndingNode {
  type: 'ending'
  text: string
  outcome: string
  sets?: Record<string, VariableValue>
}

export interface TextNode {
  type: 'text'
  text: string
  next: string
}

export interface ChoiceNode {
  type: 'choice'
  text: string
  options: ChoiceOption[]
}

export interface DialogueNode {
  type: 'dialogue'
  speaker: string | null
  speakerColor?: string
  text?: string
  textByCondition?: ConditionalRoute[]
  defaultText?: string
  colorByVariable?: {
    variable: string
    map: Record<string, string>
  }
  next: string
}

export interface RouteNode {
  type: 'route'
  branches: {
    if: VariableCondition
    next: string
  }[]
  fallback: string
}

export interface FunnelNode {
  type: 'funnel'
  title: string
  textByCondition?: ConditionalRoute[]
  defaultText: string
  next: string
}

export type ScenarioNode =
  | TextNode
  | ChoiceNode
  | SliderNode
  | EndingNode
  | DialogueNode
  | RouteNode
  | FunnelNode

export type DilemmaCategory = 'work' | 'relations' | 'ethics' | 'everyday'

export interface DilemmaMeta {
  category: DilemmaCategory
  tags: string[]
  estimatedMinutes: number
}

export interface Dilemma {
  id: string
  slug: string
  publishDate: string
  title: string
  intro: string
  meta?: DilemmaMeta
  scenario: {
    start: string
    nodes: Record<string, ScenarioNode>
    final_stats_map: Record<string, string>
  }
}

export type PlayMode = 'normal' | 'contemplative'

export interface ChoiceRecord {
  node_id: string
  option_id: string
  ms: number
  timedOut?: boolean
}

export interface DilemmaResult {
  your_choice: string
  your_outcome: string
  stats: Record<string, number>
  stat_labels: Record<string, string>
  total_players: number
  match_percent: number
  match_label: string
}

export interface DilemmaSession {
  dilemmaSlug: string
  mode: PlayMode
  currentNodeId: string
  startedAt: number
  choiceStartedAt: number
  choices: ChoiceRecord[]
  finished: boolean
  finalOption: string | null
  finalOutcome: string | null
}

export interface CategoryInfo {
  id: DilemmaCategory
  label: string
  color: string
}

export interface Achievement {
  id: string
  title: string
  description: string
  unlockedAt: number
}

// ─── Магазин ───

export type ShopItemType = 'streak_freeze' | 'second_chance' | 'premium_card'

export interface ShopItem {
  id: ShopItemType
  title: string
  description: string
  price: number
  icon: string
  color: string
  maxStack: number
  hint: string
}

export interface Inventory {
  streakFreezes: number
  secondChances: number
  premiumCards: number
}

export interface ProgressState {
  xp: number
  coins: number
  streak: number
  longestStreak: number
  lastVisitDate: string
  contemplativeEnergy: number // Энергия размышлений - восполняется каждое размышление
  claimedRewards: number[]
  weeklyXp: number
  weekStart: string
  lastRewardClaimDate: string
  inventory: Inventory
}

export interface DailyProgress {
  completedDilemmas: Record<string, string>
  contemplativeDilemmas: string[]
  playedDates: string[]
  mentalLandscapeData: Array<{
    dilemmaId: string
    choice: string
    category: string
    values: string[]
  }>
  lastPlayedDate: string | null
  currentStreak: number
  longestStreak: number
  impulseDilemmas: string[]
}

export type RewardType = 'xp' | 'coins' | 'heart' | 'mega'

export interface DailyReward {
  day: number
  type: RewardType
  amount: number
  label: string
}

// ─── Истории ───

export interface StoryChapter {
  id: string
  index: number
  title: string
  subtitle?: string
  start: string
  nodes: Record<string, ScenarioNode>
  final_stats_map: Record<string, string>
  introByCondition?: ConditionalRoute[]
  defaultIntro: string
  recapText?: string
}

export interface Story {
  id: string
  slug: string
  title: string
  subtitle: string
  coverColor: string
  category: DilemmaCategory
  initialVariables: StoryVariables
  chapters: StoryChapter[]
  finales: StoryFinale[]
}

export interface StoryFinale {
  id: string
  title: string
  description: string
  conditions: VariableCondition[]
  color: string
}

export interface StoryProgress {
  storySlug: string
  completedChapters: string[]
  variables: StoryVariables
  choices: {
    chapterId: string
    nodeId: string
    optionId: string
    label: string
    at: number
  }[]
  finaleId: string | null
  startedAt: number
  completedAt: number | null
}

// ─── Лиги ───

export type LeagueId = 'bronze' | 'silver' | 'gold' | 'platinum'

export interface League {
  id: LeagueId
  name: string
  color: string
  minXp: number
  nextXp: number | null
}

export type TabId = 'today' | 'archive' | 'stories' | 'profile' | 'about'