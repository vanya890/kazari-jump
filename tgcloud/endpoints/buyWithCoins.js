import { db, EndpointError } from 'sdk';
import { and, eq, gte, sql } from 'sdk/db';
import { profiles } from '../schema.js';
import { productById } from '../lib/catalog.js';
import { ensureProfile, publicProfile, rankFor } from '../lib/profiles.js';

export default async function (input, ctx) {
  const user = ctx.initData?.user;
  if (!user?.id) throw new EndpointError('Missing Telegram user', { code: 'UNAUTHORIZED' });

  const product = productById(input?.productId);
  if (!product || product.kind !== 'skin' || !product.priceCoins) {
    throw new EndpointError('Not for sale', { code: 'NOT_FOR_SALE' });
  }

  const row = (await ensureProfile(user, null)) ?? null;
  if (!row) throw new EndpointError('Could not load profile', { code: 'PROFILE_ERROR' });

  const owned = Array.isArray(row.ownedSkins) ? row.ownedSkins : ['classic'];
  const skinId = product.skinId;
  if (!skinId) throw new EndpointError('Not for sale', { code: 'NOT_FOR_SALE' });
  if (owned.includes(skinId)) throw new EndpointError('Already owned', { code: 'ALREADY_OWNED' });
  if ((row.coins ?? 0) < product.priceCoins) {
    throw new EndpointError('Not enough coins', { code: 'NOT_ENOUGH_COINS' });
  }

  const updated = await db
    .update(profiles)
    .set({
      coins: sql`${profiles.coins} - ${product.priceCoins}`,
      ownedSkins: [...owned, skinId],
      updatedAt: sql`(unixepoch())`,
    })
    .where(and(eq(profiles.id, row.id), gte(profiles.coins, product.priceCoins)))
    .returning();

  if (!updated.length) throw new EndpointError('Not enough coins', { code: 'NOT_ENOUGH_COINS' });

  return {
    profile: publicProfile(updated[0], await rankFor(updated[0].bestScore ?? 0)),
  };
}
