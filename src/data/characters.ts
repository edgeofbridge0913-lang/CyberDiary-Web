export const CHARACTER_OPTIONS = ['AI秘書', 'ジジ（猫）', 'あちゅ（猫）'] as const;

export type CharacterLabel = (typeof CHARACTER_OPTIONS)[number];
export type CharacterPersona = 'ai-secretary' | 'jiji' | 'achu';

export const DEFAULT_CHARACTER_PERSONA: CharacterPersona = 'ai-secretary';

const PERSONA_TO_LABEL: Record<CharacterPersona, CharacterLabel> = {
  'ai-secretary': 'AI秘書',
  jiji: 'ジジ（猫）',
  achu: 'あちゅ（猫）',
};

export const DEFAULT_CHARACTER_LABEL: CharacterLabel = PERSONA_TO_LABEL[DEFAULT_CHARACTER_PERSONA];

const normalizeAlias = (value: string) => value.trim().toLowerCase();

const ALIAS_TO_PERSONA: Record<string, CharacterPersona> = {
  'ai-secretary': 'ai-secretary',
  'ai秘書': 'ai-secretary',
  'aiオペレーター': 'ai-secretary',
  'ai operator': 'ai-secretary',
  'ai': 'ai-secretary',
  'ユーザー': 'ai-secretary',
  jiji: 'jiji',
  'ジジ': 'jiji',
  'ジジ（猫）': 'jiji',
  achu: 'achu',
  'あちゅ': 'achu',
  'あちゅ（猫）': 'achu',
};

export const toCharacterPersona = (raw: unknown): CharacterPersona => {
  if (typeof raw !== 'string') return DEFAULT_CHARACTER_PERSONA;
  const normalized = normalizeAlias(raw);
  return ALIAS_TO_PERSONA[normalized] ?? DEFAULT_CHARACTER_PERSONA;
};

export const toCharacterLabel = (raw: unknown): CharacterLabel => {
  const persona = toCharacterPersona(raw);
  return PERSONA_TO_LABEL[persona];
};

export const normalizeCharacterLabels = (rawList: string[] | undefined): CharacterLabel[] => {
  if (!rawList || rawList.length === 0) {
    return [];
  }

  const labels = rawList.map((value) => toCharacterLabel(value));
  return [...new Set(labels)];
};
