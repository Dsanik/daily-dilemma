import {
  getTraitForOption,
  getTraitInfo,
  type TraitInfo,
} from "../data/traits";

const STORAGE_KEY = "daily-dilemma-decision-log-v1";
// Кап на размер лога — профиль строится по последним записям, старые нам
// не нужны бесконечно (и чтобы localStorage не пух).
const MAX_ENTRIES = 200;
// Минимум решений, прежде чем вообще показывать профиль — иначе после
// первой же дилеммы будет "ты склонен к X" по одному выбору, что не
// заслуживает доверия.
const MIN_ENTRIES_FOR_PROFILE = 3;

interface DecisionEntry {
  slug: string;
  optionId: string;
  traitId: string;
  timestamp: number;
}

function load(): DecisionEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DecisionEntry[];
  } catch {
    return [];
  }
}

function save(entries: DecisionEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* ignore */
  }
}

// Записывает решение в лог. Если для этого варианта нет трейта в справочнике
// (например, добавили новую дилемму и забыли завести теги) — тихо
// пропускаем, не засоряя профиль пустыми записями.
export function recordDecision(slug: string, optionId: string): void {
  const traitId = getTraitForOption(slug, optionId);
  if (!traitId) return;

  const entries = load();
  entries.push({ slug, optionId, traitId, timestamp: Date.now() });

  if (entries.length > MAX_ENTRIES) {
    entries.splice(0, entries.length - MAX_ENTRIES);
  }

  save(entries);
}

export interface DominantTrait {
  trait: TraitInfo;
  count: number;
  totalDecisions: number;
}

// Возвращает трейт, который встречается чаще всего среди записанных решений,
// либо null, если решений пока недостаточно для честного вывода.
export function getDominantTrait(): DominantTrait | null {
  const entries = load();
  if (entries.length < MIN_ENTRIES_FOR_PROFILE) return null;

  const counts: Record<string, number> = {};
  for (const e of entries) {
    counts[e.traitId] = (counts[e.traitId] ?? 0) + 1;
  }

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const [topId, topCount] = sorted[0];
  const trait = getTraitInfo(topId);
  if (!trait) return null;

  return { trait, count: topCount, totalDecisions: entries.length };
}
