import { EndpointError } from 'sdk';
import {
  ensureProfile,
  profileWithRank,
  squadRows,
  topPlayers,
  totalPlayers,
} from '../lib/profiles.js';

export default async function (input, ctx) {
  const user = ctx.initData?.user;
  if (!user?.id) throw new EndpointError('Missing Telegram user', { code: 'UNAUTHORIZED' });

  const me = (await ensureProfile(user, null)) ?? null;
  if (!me) throw new EndpointError('Could not load profile', { code: 'PROFILE_ERROR' });
  const meProfile = await profileWithRank(me);
  const scope = input?.scope === 'squad' ? 'squad' : 'global';

  if (scope === 'squad') {
    const rows = await squadRows(me);
    return { scope, rows, me: meProfile, total: rows.length };
  }

  const [rows, total] = await Promise.all([topPlayers(100, me.tgId), totalPlayers()]);
  return { scope, rows, me: meProfile, total };
}
