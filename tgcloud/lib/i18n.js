const TEXT = {
  ru: {
    welcome:
      'Привет, {name}!\n\n<b>Kazari Jump</b> — один тап, бесконечный забег. Прыгай через камни, собирай монеты и бей рекорды друзей.\n\nНажми кнопку ниже, чтобы играть.',
    play: 'Запустить Kazari Jump',
    help:
      '<b>Как играть</b>\n\nТапай по экрану, чтобы прыгать. Чем дольше держишь палец, тем выше прыжок. Собирай монеты и открывай скины в гардеробе.\n\nКоманды:\n/play — открыть игру\n/terms — правила и оплата\n/support — поддержка\n/paysupport — вопросы по платежам',
    terms:
      '<b>Правила и оплата</b>\n\nИгра бесплатна. Внутриигровые покупки совершаются за Telegram Stars и не подлежат возврату, кроме случаев, предусмотренных законом. Виртуальные монеты и скины не имеют денежной стоимости. Покупки привязаны к аккаунту Telegram.',
    support:
      '<b>Поддержка</b>\n\nЧто-то сломалось или не пришла покупка? Напиши сюда и опиши проблему — мы поможем.\n\nПо платежам также доступна команда /paysupport.',
    paysupport:
      '<b>Платежи</b>\n\nПокупки проходят через Telegram Stars. Если покупка не зачислилась, напиши сюда: укажи дату, товар и сумму. Мы проверим платёж и вернёмся с ответом.\n\nВиртуальные товары не подлежат возврату, кроме случаев, предусмотренных законом.',
    thanks: 'Спасибо за покупку! {title} уже в игре.',
    grantedCoins: 'Спасибо! На счёт зачислено {amount} монет.',
    grantedSupporter: 'Kazari+ активен. Корона, бейдж и бесплатное продолжение — твои!',
    paymentError: 'Не удалось проверить платёж. Попробуй ещё раз.',
  },
  en: {
    welcome:
      'Hey, {name}!\n\n<b>Kazari Jump</b> — one tap, endless run. Jump the rocks, grab coins and beat your friends.\n\nTap the button below to play.',
    play: 'Play Kazari Jump',
    help:
      '<b>How to play</b>\n\nTap the screen to jump. Hold longer to jump higher. Collect coins and unlock skins in the wardrobe.\n\nCommands:\n/play — open the game\n/terms — terms & payments\n/support — support\n/paysupport — payment help',
    terms:
      '<b>Terms & payments</b>\n\nThe game is free to play. In-game purchases are made with Telegram Stars and are non-refundable except where required by law. Virtual coins and skins have no monetary value. Purchases are tied to your Telegram account.',
    support:
      '<b>Support</b>\n\nSomething broke or a purchase did not arrive? Write here and describe the problem — we will help.\n\nFor payments you can also use /paysupport.',
    paysupport:
      '<b>Payments</b>\n\nPurchases are processed with Telegram Stars. If a purchase did not arrive, write here with the date, item and amount. We will check the payment and get back to you.\n\nVirtual goods are non-refundable except where required by law.',
    thanks: 'Thank you! {title} is now in your game.',
    grantedCoins: 'Thank you! {amount} coins were added to your balance.',
    grantedSupporter: 'Kazari+ is active. Crown, badge and a free revive are yours!',
    paymentError: 'Could not verify the payment. Please try again.',
  },
};

export function botLang(code) {
  const base = String(code ?? '').toLowerCase().split('-')[0];
  return ['ru', 'uk', 'be', 'kk', 'ky'].includes(base) ? 'ru' : 'en';
}

export function botText(lang, key, vars) {
  const dict = TEXT[lang] ?? TEXT.en;
  const template = dict[key] ?? TEXT.en[key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? `{${name}}`));
}
