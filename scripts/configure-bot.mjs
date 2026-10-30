#!/usr/bin/env node
// Configure the bot's name, descriptions, commands and menu button.
// Usage: node scripts/configure-bot.mjs https://app<id>.tgcloud.ai/
// Token: BOT_TOKEN env var, or a local `bot token.txt` (never commit it).

import { readFileSync } from 'node:fs';

function readToken() {
  if (process.env.BOT_TOKEN?.trim()) return process.env.BOT_TOKEN.trim();
  try {
    return readFileSync(new URL('../bot token.txt', import.meta.url), 'utf8').trim();
  } catch {
    console.error('Set BOT_TOKEN or create bot token.txt next to package.json.');
    process.exit(1);
  }
}

const appUrl = process.argv[2] ?? process.env.APP_URL;
if (!appUrl || !/^https:\/\//.test(appUrl)) {
  console.error('Usage: node scripts/configure-bot.mjs https://app<id>.tgcloud.ai/');
  process.exit(1);
}

const token = readToken();

async function call(method, params = {}) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const body = await response.json().catch(() => ({}));
  if (!body.ok) {
    throw new Error(`${method}: ${body.description ?? `HTTP ${response.status}`}`);
  }
  return body.result;
}

const commands = [
  { command: 'start', description: 'Открыть Kazari Jump' },
  { command: 'play', description: 'Играть' },
  { command: 'terms', description: 'Правила и оплата' },
  { command: 'support', description: 'Поддержка' },
  { command: 'paysupport', description: 'Помощь с платежами' },
  { command: 'help', description: 'Как играть' },
];

const commandsEn = [
  { command: 'start', description: 'Open Kazari Jump' },
  { command: 'play', description: 'Play' },
  { command: 'terms', description: 'Terms & payments' },
  { command: 'support', description: 'Support' },
  { command: 'paysupport', description: 'Payment help' },
  { command: 'help', description: 'How to play' },
];

try {
  const me = await call('getMe');
  await call('setMyName', { name: 'Kazari Games' });
  await call('setMyShortDescription', {
    short_description: 'Один тап. Бесконечный забег. Прыгай, собирай монеты, бей рекорды.',
  });
  await call('setMyShortDescription', {
    short_description: 'One tap. Endless run. Jump, collect coins, beat records.',
    language_code: 'en',
  });
  await call('setMyDescription', {
    description:
      'Kazari Jump — гиперказуальный раннер в Telegram. Тапай, чтобы прыгать, собирай монеты и открывай скины. Играй с друзьями и бей рекорды.',
  });
  await call('setMyDescription', {
    description:
      'Kazari Jump is a one-tap runner in Telegram. Tap to jump, collect coins and unlock skins. Challenge friends and beat their records.',
    language_code: 'en',
  });
  await call('setMyCommands', { commands });
  await call('setMyCommands', { commands: commandsEn, language_code: 'en' });
  await call('setChatMenuButton', {
    menu_button: { type: 'web_app', text: 'Pulse Drift', web_app: { url: appUrl } },
  });
  console.log(`Configured @${me.username} → ${appUrl}`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
