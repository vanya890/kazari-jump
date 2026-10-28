import type { Lang } from '../types';

export const WORLD_LENGTH = 720;
export const WORLD_TRANSITION = 160;

export interface World {
  index: number;
  name: string;
  subtitle: string;
  glyph: string;
  landmark: 'lanterns' | 'torii' | 'peaks' | 'arch';
  progress: number;
  distanceToNext: number;
}

export interface WorldDefinition {
  name: Record<Lang, string>;
  subtitle: Record<Lang, string>;
  glyph: string;
  landmark: World['landmark'];
}

export const WORLD_ATLAS: WorldDefinition[] = [
  {
    name: { ru: 'Долина фонарей', en: 'Lantern Valley' },
    subtitle: { ru: 'Тёплый свет над тихими крышами', en: 'Warm lights over quiet rooftops' },
    glyph: '◉',
    landmark: 'lanterns',
  },
  {
    name: { ru: 'Берег сакуры', en: 'Sakura Shore' },
    subtitle: { ru: 'Ветер несёт лепестки к морю', en: 'Petals drift on the sea breeze' },
    glyph: '✿',
    landmark: 'torii',
  },
  {
    name: { ru: 'Нефритовые высоты', en: 'Jade Highlands' },
    subtitle: { ru: 'Тропы теряются в облаках', en: 'Trails disappear into the clouds' },
    glyph: '⌁',
    landmark: 'peaks',
  },
  {
    name: { ru: 'Янтарный перевал', en: 'Amber Pass' },
    subtitle: { ru: 'Последний свет за горным хребтом', en: 'Last light beyond the ridge' },
    glyph: '◆',
    landmark: 'arch',
  },
];

export function worldAt(distanceM: number, lang: Lang = 'ru'): World {
  const safeDistance = Math.max(0, distanceM);
  const chapter = Math.floor(safeDistance / WORLD_LENGTH);
  const source = WORLD_ATLAS[chapter % WORLD_ATLAS.length];
  if (!source) throw new Error('Kazari Jump: world atlas is empty');
  const progress = (safeDistance % WORLD_LENGTH) / WORLD_LENGTH;
  return {
    index: chapter % WORLD_ATLAS.length,
    name: source.name[lang],
    subtitle: source.subtitle[lang],
    glyph: source.glyph,
    landmark: source.landmark,
    progress,
    distanceToNext: Math.ceil(WORLD_LENGTH - (safeDistance % WORLD_LENGTH)),
  };
}

export function worldChapterAt(distanceM: number): number {
  return Math.floor(Math.max(0, distanceM) / WORLD_LENGTH);
}

export interface WorldTransition {
  currentChapter: number;
  currentIndex: number;
  nextChapter: number;
  nextIndex: number;
  progress: number;
}

export function worldTransitionAt(distanceM: number): WorldTransition {
  const safeDistance = Math.max(0, distanceM);
  const currentChapter = worldChapterAt(safeDistance);
  const chapterProgress = safeDistance % WORLD_LENGTH;
  const transitionStart = WORLD_LENGTH - WORLD_TRANSITION;
  const progress = chapterProgress < transitionStart ? 0 : (chapterProgress - transitionStart) / WORLD_TRANSITION;
  return {
    currentChapter,
    currentIndex: currentChapter % WORLD_ATLAS.length,
    nextChapter: currentChapter + 1,
    nextIndex: (currentChapter + 1) % WORLD_ATLAS.length,
    progress: Math.min(1, Math.max(0, progress)),
  };
}
