import type { Lang } from '../types';

export const WORLD_LENGTH = 720;

export interface World {
  index: number;
  name: string;
  subtitle: string;
  glyph: string;
  progress: number;
  distanceToNext: number;
}

const WORLDS: Array<{ name: Record<Lang, string>; subtitle: Record<Lang, string>; glyph: string }> = [
  {
    name: { ru: 'Долина фонарей', en: 'Lantern Valley' },
    subtitle: { ru: 'Тёплый свет над тихими крышами', en: 'Warm lights over quiet rooftops' },
    glyph: '◉',
  },
  {
    name: { ru: 'Берег сакуры', en: 'Sakura Shore' },
    subtitle: { ru: 'Ветер несёт лепестки к морю', en: 'Petals drift on the sea breeze' },
    glyph: '✿',
  },
  {
    name: { ru: 'Нефритовые высоты', en: 'Jade Highlands' },
    subtitle: { ru: 'Тропы теряются в облаках', en: 'Trails disappear into the clouds' },
    glyph: '⌁',
  },
  {
    name: { ru: 'Янтарный перевал', en: 'Amber Pass' },
    subtitle: { ru: 'Последний свет за горным хребтом', en: 'Last light beyond the ridge' },
    glyph: '◆',
  },
];

export function worldAt(distanceM: number, lang: Lang = 'ru'): World {
  const safeDistance = Math.max(0, distanceM);
  const chapter = Math.floor(safeDistance / WORLD_LENGTH);
  const source = WORLDS[chapter % WORLDS.length];
  if (!source) throw new Error('Kazari Jump: world atlas is empty');
  const progress = (safeDistance % WORLD_LENGTH) / WORLD_LENGTH;
  return {
    index: chapter % WORLDS.length,
    name: source.name[lang],
    subtitle: source.subtitle[lang],
    glyph: source.glyph,
    progress,
    distanceToNext: Math.ceil(WORLD_LENGTH - (safeDistance % WORLD_LENGTH)),
  };
}

export function worldChapterAt(distanceM: number): number {
  return Math.floor(Math.max(0, distanceM) / WORLD_LENGTH);
}
