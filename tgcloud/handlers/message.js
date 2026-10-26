import { api } from 'sdk';
import { botLang, botText } from '../lib/i18n.js';
import { productTitle } from '../lib/catalog.js';
import { grantPurchase, parsePayload } from '../lib/payments.js';
import { botUsername, miniAppLink } from '../lib/bot.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function playKeyboard(url, label) {
  if (!url) return undefined;
  return { inline_keyboard: [[{ text: label, url }]] };
}

async function reply(chatId, text, markup) {
  try {
    await api.sendMessage({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...(markup ? { reply_markup: markup } : {}),
    });
  } catch (error) {
    console.error('sendMessage failed', { chatId, error: error?.description ?? error?.message });
  }
}

async function handlePayment(message) {
  const payment = message.successful_payment;
  const lang = botLang(message.from?.language_code);
  const data = parsePayload(payment?.invoice_payload);
  if (
    !data ||
    payment?.currency !== 'XTR' ||
    payment?.total_amount !== data.product.priceStars
  ) {
    console.error('Unrecognised successful_payment', {
      payload: payment?.invoice_payload,
      amount: payment?.total_amount,
      currency: payment?.currency,
    });
    return;
  }

  const result = await grantPurchase(data, payment.telegram_payment_charge_id);
  if (!result.ok) {
    console.error('Paid profile not found', { profileId: data.profileId, tgId: data.tgId });
    return;
  }
  if (result.duplicate) return;

  if (data.product.kind === 'coins') {
    await reply(
      message.chat.id,
      botText(lang, 'grantedCoins', { amount: data.product.amount ?? 0 }),
      playKeyboard(miniAppLink(await botUsername(), 'shop'), botText(lang, 'play')),
    );
    return;
  }
  if (data.product.kind === 'supporter') {
    await reply(
      message.chat.id,
      botText(lang, 'grantedSupporter'),
      playKeyboard(miniAppLink(await botUsername(), 'shop'), botText(lang, 'play')),
    );
    return;
  }
  await reply(
    message.chat.id,
    botText(lang, 'thanks', { title: escapeHtml(productTitle(data.product, lang)) }),
    playKeyboard(miniAppLink(await botUsername(), 'shop'), botText(lang, 'play')),
  );
}

export default async function (message) {
  if (!message) return;
  if (message.successful_payment) {
    await handlePayment(message);
    return;
  }

  const chatId = message.chat?.id;
  if (!chatId) return;
  const text = typeof message.text === 'string' ? message.text.trim() : '';
  if (!text.startsWith('/')) return;

  const parts = text.split(/\s+/);
  const command = parts[0].split('@')[0].toLowerCase();
  const payload = parts[1] ?? '';
  const lang = botLang(message.from?.language_code);
  const username = await botUsername();
  const startParam = /^(ref|ch)-\d{1,15}$/.test(payload) ? payload : '';
  const playUrl = miniAppLink(username, startParam);
  const markup = playKeyboard(playUrl, botText(lang, 'play'));

  switch (command) {
    case '/start':
      await reply(
        chatId,
        botText(lang, 'welcome', { name: escapeHtml(message.from?.first_name ?? '') }),
        markup,
      );
      break;
    case '/play':
      await reply(chatId, botText(lang, 'welcome', { name: escapeHtml(message.from?.first_name ?? '') }), markup);
      break;
    case '/terms':
      await reply(chatId, botText(lang, 'terms'), markup);
      break;
    case '/support':
      await reply(chatId, botText(lang, 'support'), markup);
      break;
    case '/paysupport':
      await reply(chatId, botText(lang, 'paysupport'), markup);
      break;
    case '/help':
      await reply(chatId, botText(lang, 'help'), markup);
      break;
    default:
      await reply(chatId, botText(lang, 'help'), markup);
  }
}
