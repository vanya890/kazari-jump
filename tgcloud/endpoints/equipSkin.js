import { db, EndpointError } from 'sdk';
import { eq, sql } from 'sdk/db';
import { profiles } from '../schema.js';
import { isSkinId } from '../lib/catalog.js';
import { ensureProfile, publicProfile, rankFor } from '../lib/profiles.js';

export default async function (input, ctx) {
  const user = ctx.initData?.user;
  if (!user?.id) throw new EndpointError('Missing Telegram user', { code: 'UNAUTHORIZED' });

  const skinId = typeof input?.skinId === 'string' ? input.skinId : '';
  if (!isSkinId(skinId)) throw new EndpointError('Unknown skin', { code: 'NOT_FOUND' });

  const row = (await ensureProfile(user, null)) ?? null;
  if (!row) throw new EndpointError('Could not load profile', { code: 'PROFILE_ERROR' });

  const owned = Array.isArray(row.ownedSkins) ? row.ownedSkins : ['classic'];
  const canWear = owned.includes(skinId) || (skinId === 'supporter' && row.supporter);
  if (!canWear) throw new EndpointError('Skin is not owned', { code: 'NOT_OWNED' });

  const updated = await db
    .update(profiles)
    .set({ activeSkin: skinId, updatedAt: sql`(unixepoch())` })
    .where(eq(profiles.id, row.id))
    .returning();

  const fresh = updated[0] ?? row;
  return { profile: publicProfile(fresh, await rankFor(fresh.bestScore ?? 0)) };
}
