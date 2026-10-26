import { EndpointError } from 'sdk';
import { PRODUCTS } from '../lib/catalog.js';
import { ensureProfile, profileWithRank, sanitizeLang, topPlayers, totalPlayers } from '../lib/profiles.js';
import { botUsername } from '../lib/bot.js';
import { botLang } from '../lib/i18n.js';

function parseChallenge(startParam) {
  if (typeof startParam !== 'string') return null;
  const match = /^ch-(\d{1,9})$/.exec(startParam);
  if (!match) return null;
  const score = Number(match[1]);
  return score > 0 && score <= 200000 ? score : null;
}

export default async function (input, ctx) {
  const user = ctx.initData?.user;
  if (!user?.id) throw new EndpointError('Missing Telegram user', { code: 'UNAUTHORIZED' });

  const lang = sanitizeLang(input?.lang) ?? botLang(user.language_code);
  const startParam = typeof input?.startParam === 'string' ? input.startParam.slice(0, 64) : null;
  const row = await ensureProfile(user, lang, startParam);
  if (!row) throw new EndpointError('Could not load profile', { code: 'PROFILE_ERROR' });

  const [profile, top, total, username] = await Promise.all([
    profileWithRank(row),
    topPlayers(10, row.tgId),
    totalPlayers(),
    botUsername(),
  ]);

  return {
    profile,
    products: PRODUCTS,
    top,
    totalPlayers: total,
    botUsername: username,
    startParam,
    challengeScore: parseChallenge(startParam),
  };
}
