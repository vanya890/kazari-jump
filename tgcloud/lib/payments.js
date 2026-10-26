import { db } from 'sdk';
import { and, eq, sql } from 'sdk/db';
import { profiles, purchases } from '../schema.js';
import { productById } from './catalog.js';

/**
 * Invoice payloads are created by createInvoice only:
 *   kz:<productId>:<profileId>:<tgId>
 * Keep this under Telegram's 128-byte payload limit.
 */
export function parsePayload(payload) {
  if (typeof payload !== 'string') return null;
  const parts = payload.split(':');
  if (parts.length !== 4 || parts[0] !== 'kz') return null;
  const product = productById(parts[1]);
  const profileId = Number(parts[2]);
  const tgId = Number(parts[3]);
  if (!product || !Number.isInteger(profileId) || profileId <= 0) return null;
  if (!Number.isInteger(tgId) || tgId <= 0) return null;
  return { product, profileId, tgId };
}

export function payloadFor(productId, profileId, tgId) {
  return `kz:${productId}:${profileId}:${tgId}`;
}

/**
 * Grant a paid product exactly once. The unique charge id makes replays from
 * Telegram harmless: a duplicate call returns `duplicate: true` and changes nothing.
 */
export async function grantPurchase(data, chargeId) {
  const profile = await db
    .select()
    .from(profiles)
    .where(and(eq(profiles.id, data.profileId), eq(profiles.tgId, data.tgId)))
    .get();
  if (!profile) return { ok: false, duplicate: false, profile: null, product: data.product };

  const inserted = await db
    .insert(purchases)
    .values({
      profileId: profile.id,
      productId: data.product.id,
      chargeId: String(chargeId).slice(0, 128),
      stars: data.product.priceStars ?? 0,
      payload: payloadFor(data.product.id, data.profileId, data.tgId),
    })
    .onConflictDoNothing({ target: purchases.chargeId })
    .returning({ id: purchases.id });

  if (!inserted.length) {
    return { ok: true, duplicate: true, profile, product: data.product };
  }

  const owned = Array.isArray(profile.ownedSkins) ? profile.ownedSkins : ['classic'];
  const set = { updatedAt: sql`(unixepoch())` };

  if (data.product.kind === 'coins') {
    set.coins = sql`${profiles.coins} + ${data.product.amount ?? 0}`;
  } else if (data.product.kind === 'supporter') {
    set.supporter = true;
    set.activeSkin = 'supporter';
    set.ownedSkins = owned.includes('supporter') ? owned : [...owned, 'supporter'];
  } else if (data.product.skinId) {
    set.activeSkin = data.product.skinId;
    set.ownedSkins = owned.includes(data.product.skinId) ? owned : [...owned, data.product.skinId];
  }

  const updated = await db.update(profiles).set(set).where(eq(profiles.id, profile.id)).returning();

  return {
    ok: true,
    duplicate: false,
    profile: updated[0] ?? profile,
    product: data.product,
  };
}
