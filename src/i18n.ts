import type { Lang } from './types';

type Dict = Record<string, string>;

const ru: Dict = {
  'app.name': 'KAZARI JUMP',
  'app.tagline': 'Один тап. Бесконечный забег.',
  'loading': 'Загружаем Kazari…',
  'play': 'Играть',
  'playAgain': 'Ещё раз',
  'best': 'Рекорд',
  'coins': 'Монеты',
  'shop': 'Скины',
  'leaders': 'Лидеры',
  'settings': 'Настройки',
  'menu': 'В меню',
  'pause': 'Пауза',
  'resume': 'Продолжить',
  'restart': 'Заново',
  'sound': 'Звук',
  'haptics': 'Вибрация',
  'language': 'Язык',
  'on': 'Вкл',
  'off': 'Выкл',
  'close': 'Закрыть',

  'hint.start': 'Тапни, чтобы прыгнуть',
  'hint.tap': 'Тап — прыжок',
  'hint.hold': 'Держи дольше — прыжок выше',
  'world.journey': 'Следующая глава пути',
  'world.progress': 'Прогресс до следующего мира',
  'world.next': 'До нового мира: {n} м',
  'world.route': 'Маршрут путешествия',

  'hud.m': 'м',
  'rotateHint': 'Лучше играть в вертикальном режиме',

  'over.title': 'Забег окончен',
  'over.score': 'Счёт',
  'over.distance': 'Дистанция',
  'over.runCoins': 'Собрано',
  'over.newBest': 'Новый рекорд!',
  'over.best': 'Лучший результат',
  'over.rank': 'Место в мире',
  'over.banked': '+{n} монет сохранено',
  'over.noCoins': 'В этот раз без монет',
  'over.continueAd': 'Продолжить за рекламу',
  'over.continueFree': 'Продолжить бесплатно',
  'over.endRun': 'Завершить забег',
  'over.double': 'Удвоить монеты',
  'over.doubleDone': 'Монеты удвоены',
  'over.challenge': 'Бросить вызов',
  'over.shop': 'Потратить монеты',
  'over.reviveOnce': 'Продолжение доступно один раз за забег',
  'over.saved': 'Монеты уже на счету',
  'over.noAd': 'Реклама недоступна',

  'shop.title': 'Гардероб',
  'shop.skins': 'Скины',
  'shop.coins': 'Монеты',
  'shop.support': 'Поддержка',
  'shop.owned': 'Куплено',
  'shop.equip': 'Надеть',
  'shop.equipped': 'Надето',
  'shop.buyWithCoins': 'Купить за {n} монет',
  'shop.buyWithStars': 'Купить за {n} звёзд',
  'shop.free': 'Бесплатно',
  'shop.notEnough': 'Не хватает монет',
  'shop.starsOnlyTelegram': 'Покупки за звёзды доступны в Telegram',
  'shop.processing': 'Открываем оплату…',
  'shop.thanks': 'Спасибо! Покупка зачислена',
  'shop.cancelled': 'Оплата отменена',
  'shop.failed': 'Не удалось завершить покупку',
  'shop.supporterActive': 'Kazari+ активен',
  'shop.balance': 'Баланс: {n}',

  'board.title': 'Лидеры',
  'board.global': 'Мир',
  'board.squad': 'Моя банда',
  'board.empty': 'Пока пусто. Стань первым!',
  'board.emptySquad': 'Пригласи друзей — их рекорды появятся здесь.',
  'board.you': 'ты',
  'board.rank': '#{n}',
  'board.invite': 'Позвать друзей',
  'board.squadHint': 'В банду попадают друзья, пришедшие по твоей ссылке.',
  'board.players': '{n} игроков',
  'board.loading': 'Считаем рекорды…',

  'settings.title': 'Настройки',
  'settings.howto': 'Как играть',
  'settings.howtoText':
    'Тапай по экрану, чтобы прыгать. Чем дольше держишь палец, тем выше прыжок. Перепрыгивай камни и собирай монеты. Скорость растёт с каждым метром.',
  'settings.terms': 'Правила',
  'settings.support': 'Поддержка',
  'settings.version': 'Версия {v}',
  'settings.offline': 'Локальный режим',

  'terms.title': 'Правила и оплата',
  'terms.text':
    'Игра бесплатна. Внутриигровые покупки совершаются за Telegram Stars и не подлежат возврату, кроме случаев, предусмотренных законом. Виртуальные монеты и скины не имеют денежной стоимости. Покупки привязаны к аккаунту Telegram. Поддержка: /paysupport в боте.',

  'challenge.banner': 'Друг набрал {n} м. Побей его рекорд!',
  'challenge.share': 'Слабо побить {n} м в Kazari Jump?',
  'challenge.shareScore': 'Мой рекорд: {n} м',

  'toast.offline': 'Сервер недоступен — играем локально',
  'toast.saved': 'Результат сохранён',
  'toast.error': 'Что-то пошло не так. Попробуй ещё раз',
  'toast.revived': 'Поехали дальше!',
  'toast.coinsDoubled': '+{n} монет за просмотр',
  'toast.invite': 'Ссылка скопирована',
  'toast.adUnavailable': 'Реклама пока недоступна',
  'toast.language': 'Язык изменён',
  'toast.rate': 'Слишком часто. Секунду…',
  'toast.newRecord': 'Новый рекорд!',
  'toast.updating': 'Обновляем…',

  'err.network': 'Нет связи с сервером',
  'err.unauthorized': 'Открой игру через Telegram',
  'err.limit': 'Слишком много забегов. Отдохни минутку',
  'err.invalid': 'Результат не принят',
  'err.coins': 'Недостаточно монет',
  'err.owned': 'Уже куплено',
  'err.unknown': 'Неизвестная ошибка',

  'rotate': 'Лучше играть в вертикальном режиме',
  'share.via': 'Поделиться',
  'copied': 'Скопировано',
  'guest': 'Гость',
  'min': 'мин',
  'sec': 'с',
};

const en: Dict = {
  'app.name': 'KAZARI JUMP',
  'app.tagline': 'One tap. Endless run.',
  'loading': 'Loading Kazari…',
  'play': 'Play',
  'playAgain': 'Run again',
  'best': 'Best',
  'coins': 'Coins',
  'shop': 'Skins',
  'leaders': 'Leaders',
  'settings': 'Settings',
  'menu': 'Menu',
  'pause': 'Pause',
  'resume': 'Resume',
  'restart': 'Restart',
  'sound': 'Sound',
  'haptics': 'Haptics',
  'language': 'Language',
  'on': 'On',
  'off': 'Off',
  'close': 'Close',

  'hint.start': 'Tap to jump',
  'hint.tap': 'Tap to jump',
  'hint.hold': 'Hold longer to jump higher',
  'world.journey': 'The next chapter',
  'world.progress': 'Progress to the next world',
  'world.next': 'Next world in {n} m',
  'world.route': 'Journey route',

  'hud.m': 'm',
  'rotateHint': 'Best played in portrait',

  'over.title': 'Run over',
  'over.score': 'Score',
  'over.distance': 'Distance',
  'over.runCoins': 'Collected',
  'over.newBest': 'New record!',
  'over.best': 'Personal best',
  'over.rank': 'World rank',
  'over.banked': '+{n} coins saved',
  'over.noCoins': 'No coins this run',
  'over.continueAd': 'Continue with an ad',
  'over.continueFree': 'Continue for free',
  'over.endRun': 'End run',
  'over.double': 'Double coins',
  'over.doubleDone': 'Coins doubled',
  'over.challenge': 'Challenge a friend',
  'over.shop': 'Spend coins',
  'over.reviveOnce': 'One continue per run',
  'over.saved': 'Coins are already banked',
  'over.noAd': 'No ad available',

  'shop.title': 'Wardrobe',
  'shop.skins': 'Skins',
  'shop.coins': 'Coins',
  'shop.support': 'Support',
  'shop.owned': 'Owned',
  'shop.equip': 'Wear',
  'shop.equipped': 'Wearing',
  'shop.buyWithCoins': 'Buy for {n} coins',
  'shop.buyWithStars': 'Buy for {n} stars',
  'shop.free': 'Free',
  'shop.notEnough': 'Not enough coins',
  'shop.starsOnlyTelegram': 'Star purchases work inside Telegram',
  'shop.processing': 'Opening checkout…',
  'shop.thanks': 'Thank you! Purchase delivered',
  'shop.cancelled': 'Payment cancelled',
  'shop.failed': 'Could not complete the purchase',
  'shop.supporterActive': 'Kazari+ active',
  'shop.balance': 'Balance: {n}',

  'board.title': 'Leaders',
  'board.global': 'World',
  'board.squad': 'My squad',
  'board.empty': 'Empty for now. Be the first!',
  'board.emptySquad': 'Invite friends — their records will show up here.',
  'board.you': 'you',
  'board.rank': '#{n}',
  'board.invite': 'Invite friends',
  'board.squadHint': 'Friends who join through your link land in your squad.',
  'board.players': '{n} players',
  'board.loading': 'Counting records…',

  'settings.title': 'Settings',
  'settings.howto': 'How to play',
  'settings.howtoText':
    'Tap the screen to jump. Hold longer for a higher jump. Clear the rocks and grab coins. The run gets faster with every metre.',
  'settings.terms': 'Terms',
  'settings.support': 'Support',
  'settings.version': 'Version {v}',
  'settings.offline': 'Local mode',

  'terms.title': 'Terms & payments',
  'terms.text':
    'The game is free to play. In-game purchases are made with Telegram Stars and are non-refundable except where required by law. Virtual coins and skins have no monetary value. Purchases are tied to your Telegram account. Support: /paysupport in the bot.',

  'challenge.banner': 'A friend scored {n} m. Beat it!',
  'challenge.share': 'Think you can beat {n} m in Kazari Jump?',
  'challenge.shareScore': 'My record: {n} m',

  'toast.offline': 'Server unavailable — playing locally',
  'toast.saved': 'Result saved',
  'toast.error': 'Something went wrong. Try again',
  'toast.revived': 'Here we go again!',
  'toast.coinsDoubled': '+{n} coins for watching',
  'toast.invite': 'Link copied',
  'toast.adUnavailable': 'No ad available right now',
  'toast.language': 'Language changed',
  'toast.rate': 'Too fast. One second…',
  'toast.newRecord': 'New record!',
  'toast.updating': 'Updating…',

  'err.network': 'No connection to the server',
  'err.unauthorized': 'Open the game through Telegram',
  'err.limit': 'Too many runs. Take a short break',
  'err.invalid': 'Score was rejected',
  'err.coins': 'Not enough coins',
  'err.owned': 'Already owned',
  'err.unknown': 'Unknown error',

  'rotate': 'Portrait mode plays better',
  'share.via': 'Share',
  'copied': 'Copied',
  'guest': 'Guest',
  'min': 'min',
  'sec': 's',
};

const DICTS: Record<Lang, Dict> = { ru, en };

export function detectLang(code?: string): Lang {
  if (!code) return 'ru';
  const base = code.toLowerCase().split('-')[0];
  return base === 'ru' || base === 'uk' || base === 'be' || base === 'kk' || base === 'ky' ? 'ru' : 'en';
}

export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  const raw = DICTS[lang][key] ?? DICTS.en[key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`));
}

export type Translator = (key: string, vars?: Record<string, string | number>) => string;

export function makeT(lang: Lang): Translator {
  return (key, vars) => translate(lang, key, vars);
}

export function plural(lang: Lang, n: number, one: string, few: string, many: string): string {
  if (lang === 'en') return n === 1 ? one : many;
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export function formatNumber(lang: Lang, value: number): string {
  return new Intl.NumberFormat(lang === 'ru' ? 'ru-RU' : 'en-US').format(Math.round(value));
}
