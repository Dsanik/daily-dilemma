export interface TraitInfo {
  id: string;
  // Именительный падеж — для бейджа
  label: string;
  // Родительный падеж — для фразы "склонность к ..."
  genitive: string;
  icon: string;
}

export const TRAITS: Record<string, TraitInfo> = {
  pragmatism: {
    id: "pragmatism",
    label: "Прагматизм",
    genitive: "прагматизму",
    icon: "⚖️",
  },
  principle: {
    id: "principle",
    label: "Принципиальность",
    genitive: "принципам",
    icon: "📏",
  },
  avoidance: {
    id: "avoidance",
    label: "Избегание конфликта",
    genitive: "избеганию конфликтов",
    icon: "🌫️",
  },
  directness: {
    id: "directness",
    label: "Прямота",
    genitive: "прямоте",
    icon: "🎯",
  },
  compassion: {
    id: "compassion",
    label: "Сочувствие",
    genitive: "сочувствию",
    icon: "💛",
  },
  authority: {
    id: "authority",
    label: "Жёсткость",
    genitive: "жёсткости",
    icon: "🛡️",
  },
};

export function getTraitInfo(id: string): TraitInfo | null {
  return TRAITS[id] ?? null;
}

// Какой трейт получает игрок за конкретный вариант в конкретной дилемме.
// Один вариант — один трейт; при добавлении новых дилемм сюда нужно
// добавлять новую запись, иначе выбор просто не попадёт в профиль.
export const OPTION_TRAITS: Record<string, Record<string, string>> = {
  wallet: {
    take_money: "pragmatism",
    give_police: "principle",
    leave: "avoidance",
    meet_public: "avoidance",
    meet_home: "compassion",
    mail: "avoidance",
  },
  "late-colleague": {
    wait: "avoidance",
    cancel: "avoidance",
    tell_truth: "directness",
    improvise: "pragmatism",
    admit: "directness",
    call: "compassion",
  },
  "noisy-neighbor": {
    police: "authority",
    endure: "avoidance",
    note: "avoidance",
    understand: "compassion",
    insist: "authority",
    join: "compassion",
  },
  firing: {
    ending_talk: "compassion",
    ending_chance: "compassion",
    ending_demote: "authority",
    ending_fire: "authority",
    ending_public: "authority",
  },
};

export function getTraitForOption(
  slug: string,
  optionId: string,
): string | null {
  return OPTION_TRAITS[slug]?.[optionId] ?? null;
}
