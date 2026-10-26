import type { Lang, Product } from '../types';

export interface SkinVisual {
  id: string;
  body: string;
  bodyDark: string;
  belly: string;
  accent: string;
  eye: string;
  accessory: 'none' | 'cap' | 'crown' | 'halo' | 'band' | 'headphones' | 'sprout';
  aura?: string;
}

export const SKINS: Record<string, SkinVisual> = {
  classic: {
    id: 'classic',
    body: '#fff6e8',
    bodyDark: '#e8d5c0',
    belly: '#ffffff',
    accent: '#2ee6a8',
    eye: '#241f33',
    accessory: 'none',
  },
  midnight: {
    id: 'midnight',
    body: '#3b3a5c',
    bodyDark: '#2b2a45',
    belly: '#55537a',
    accent: '#7c6cff',
    eye: '#f7f2ff',
    accessory: 'halo',
    aura: '#7c6cff',
  },
  sakura: {
    id: 'sakura',
    body: '#ffd9e4',
    bodyDark: '#efb6c8',
    belly: '#fff1f5',
    accent: '#ff7aa2',
    eye: '#3c2330',
    accessory: 'sprout',
  },
  mint: {
    id: 'mint',
    body: '#c8f7e3',
    bodyDark: '#9fdfc8',
    belly: '#effff9',
    accent: '#1fbf8f',
    eye: '#183a31',
    accessory: 'cap',
  },
  ninja: {
    id: 'ninja',
    body: '#2b2f3a',
    bodyDark: '#1c1f27',
    belly: '#3b4150',
    accent: '#ff5a5f',
    eye: '#ffffff',
    accessory: 'band',
  },
  gold: {
    id: 'gold',
    body: '#ffd76a',
    bodyDark: '#e0ad35',
    belly: '#fff3c4',
    accent: '#ff8a3d',
    eye: '#3a2a12',
    accessory: 'crown',
    aura: '#ffcf4d',
  },
  supporter: {
    id: 'supporter',
    body: '#e9e5ff',
    bodyDark: '#c3baff',
    belly: '#ffffff',
    accent: '#ffcc4d',
    eye: '#2a2350',
    accessory: 'crown',
    aura: '#ffcc4d',
  },
};

export function skinVisual(id: string): SkinVisual {
  return SKINS[id] ?? SKINS.classic;
}

/** Mirrors tgcloud/lib/catalog.js — server data wins once bootstrap succeeds. */
export const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'skin_midnight',
    kind: 'skin',
    skinId: 'midnight',
    title: { ru: 'Полночь', en: 'Midnight' },
    description: { ru: 'Лунный кот с нимбом.', en: 'A moonlit cat with a halo.' },
    priceCoins: 350,
    priceStars: 35,
  },
  {
    id: 'skin_sakura',
    kind: 'skin',
    skinId: 'sakura',
    title: { ru: 'Сакура', en: 'Sakura' },
    description: { ru: 'Мягкий розовый и росточек.', en: 'Soft pink, with a little sprout.' },
    priceCoins: 600,
    priceStars: 55,
  },
  {
    id: 'skin_mint',
    kind: 'skin',
    skinId: 'mint',
    title: { ru: 'Мята', en: 'Mint' },
    description: { ru: 'Свежий, как первый забег.', en: 'Fresh as a first run.' },
    priceCoins: 900,
    priceStars: 75,
  },
  {
    id: 'skin_ninja',
    kind: 'skin',
    skinId: 'ninja',
    title: { ru: 'Ниндзя', en: 'Ninja' },
    description: { ru: 'Бесшумный и очень быстрый.', en: 'Silent and very fast.' },
    priceCoins: 1400,
    priceStars: 99,
  },
  {
    id: 'skin_gold',
    kind: 'skin',
    skinId: 'gold',
    title: { ru: 'Золотой', en: 'Golden' },
    description: { ru: 'Для тех, кто уже легенда.', en: 'For those already legendary.' },
    priceCoins: 2200,
    priceStars: 149,
  },
  {
    id: 'supporter',
    kind: 'supporter',
    skinId: 'supporter',
    title: { ru: 'Kazari+', en: 'Kazari+' },
    description: {
      ru: 'Золотая корона, бейдж и бесплатное продолжение в каждом забеге.',
      en: 'Golden crown, a badge and a free revive every run.',
    },
    priceStars: 249,
    unique: true,
  },
  {
    id: 'coins_500',
    kind: 'coins',
    title: { ru: 'Горсть монет', en: 'A handful of coins' },
    description: { ru: '500 монет на скины.', en: '500 coins for skins.' },
    priceStars: 39,
    amount: 500,
  },
  {
    id: 'coins_1500',
    kind: 'coins',
    title: { ru: 'Мешок монет', en: 'A bag of coins' },
    description: { ru: '1500 монет — выгоднее.', en: '1500 coins — better value.' },
    priceStars: 99,
    amount: 1500,
  },
  {
    id: 'coins_4000',
    kind: 'coins',
    title: { ru: 'Сундук монет', en: 'A chest of coins' },
    description: { ru: '4000 монет и максимум стиля.', en: '4000 coins and maximum style.' },
    priceStars: 229,
    amount: 4000,
  },
];

export function productTitle(product: Product, lang: Lang): string {
  return product.title[lang] ?? product.title.en;
}

export function productDescription(product: Product, lang: Lang): string {
  return product.description[lang] ?? product.description.en;
}
