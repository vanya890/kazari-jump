// Server-side mirror of src/data/catalog.ts. Keep product ids, prices and
// grants in sync with the front-end fallback catalog.

export const SKIN_IDS = ['classic', 'midnight', 'sakura', 'mint', 'ninja', 'gold', 'supporter'];

export const PRODUCTS = [
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

export function productById(id) {
  return PRODUCTS.find((product) => product.id === id) ?? null;
}

export function isSkinId(id) {
  return SKIN_IDS.includes(id);
}

export function productTitle(product, lang) {
  return product.title[lang] ?? product.title.en;
}

export function productDescription(product, lang) {
  return product.description[lang] ?? product.description.en;
}
