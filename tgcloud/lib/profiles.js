import { db } from 'sdk';
import { asc, desc, eq, gt, inArray, sql } from 'sdk/db';
import { profiles, referrals } from '../schema.js';
import { isSkinId } from './catalog.js';

const STARTING_COINS = 250;

export function sanitizeLang(value) {
  return value === 'ru' || value === 'en' ? value : null;
}

export function displayName(user) {
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();
  const fallback = user?.username ? `@${user.username}` : 'Player';
  return (name || fallback).slice(0, 64);
}

function cleanText(value, max) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

export function publicProfile(row, rank) {
  const owned = Array.isArray(row.ownedSkins) ? row.ownedSkins.filter(isSkinId) : ['classic'];
  if (!owned.includes('classic')) owned.unshift('classic');
  if (row.supporter && !owned.includes('supporter')) owned.push('supporter');
  return {
    id: row.tgId,
    name: row.name,
    username: row.username ?? null,
    photoUrl: row.photoUrl ?? null,
    bestScore: row.bestScore ?? 0,
    coins: row.coins ?? 0,
    games: row.games ?? 0,
    totalDistance: row.totalDistance ?? 0,
    activeSkin: isSkinId(row.activeSkin) ? row.activeSkin : 'classic',
    ownedSkins: owned,
    supporter: Boolean(row.supporter),
    freeRevive: Boolean(row.supporter),
    referrals: row.referrals ?? 0,
    rank: rank ?? 0,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
  };
}

export function leaderboardRow(row, rank, meTgId) {
  return {
    id: row.tgId,
    name: row.name,
    username: row.username ?? null,
    photoUrl: row.photoUrl ?? null,
    bestScore: row.bestScore ?? 0,
    rank,
    isMe: row.tgId === meTgId,
  };
}

export async function rankFor(score) {
  const better = await db.$count(profiles, gt(profiles.bestScore, score ?? 0));
  return better + 1;
}

export async function totalPlayers() {
  return db.$count(profiles, gt(profiles.bestScore, 0));
}

export async function findProfile(tgId) {
  return db.select().from(profiles).where(eq(profiles.tgId, tgId)).get();
}

export async function topPlayers(limit = 10, meTgId = 0) {
  const rows = await db
    .select()
    .from(profiles)
    .where(gt(profiles.bestScore, 0))
    .orderBy(desc(profiles.bestScore), asc(profiles.id))
    .limit(limit)
    .all();
  return rows.map((row, index) => leaderboardRow(row, index + 1, meTgId));
}

async function applyReferral(profileRow, startParam) {
  if (typeof startParam !== 'string') return;
  const match = /^ref-(\d{1,15})$/.exec(startParam);
  if (!match) return;
  const referrerTgId = Number(match[1]);
  if (!referrerTgId || referrerTgId === profileRow.tgId) return;

  const referrer = await findProfile(referrerTgId);
  if (!referrer) return;

  const inserted = await db
    .insert(referrals)
    .values({ referrerId: referrer.id, referredId: profileRow.id })
    .onConflictDoNothing({ target: referrals.referredId })
    .returning({ id: referrals.id });
  if (!inserted.length) return;

  await db
    .update(profiles)
    .set({ referrals: sql`${profiles.referrals} + 1`, updatedAt: sql`(unixepoch())` })
    .where(eq(profiles.id, referrer.id))
    .run();
}

/**
 * Find or create the caller's profile. `startParam` is only used when the
 * profile is first created, so a later challenge link cannot rewrite referrals.
 */
export async function ensureProfile(user, lang, startParam = null) {
  const tgId = Number(user?.id);
  if (!Number.isInteger(tgId) || tgId <= 0) return null;

  const name = displayName(user);
  const username = cleanText(user?.username, 32);
  const photoUrl = cleanText(user?.photo_url, 512);
  let row = await findProfile(tgId);

  if (!row) {
    const inserted = await db
      .insert(profiles)
      .values({
        tgId,
        name,
        username,
        photoUrl,
        lang: lang ?? 'ru',
        bestScore: 0,
        coins: STARTING_COINS,
        games: 0,
        totalDistance: 0,
        activeSkin: 'classic',
        ownedSkins: ['classic'],
        supporter: false,
        referrals: 0,
      })
      .onConflictDoNothing({ target: profiles.tgId })
      .returning();
    row = inserted[0] ?? (await findProfile(tgId));
    if (!row) return null;
    if (inserted.length) await applyReferral(row, startParam);
    return row;
  }

  const next = {
    name,
    username,
    photoUrl,
    lang: lang ?? row.lang ?? 'ru',
  };
  if (
    row.name !== next.name ||
    (row.username ?? null) !== next.username ||
    (row.photoUrl ?? null) !== next.photoUrl ||
    (row.lang ?? null) !== next.lang
  ) {
    await db
      .update(profiles)
      .set({ ...next, updatedAt: sql`(unixepoch())` })
      .where(eq(profiles.id, row.id))
      .run();
    row = { ...row, ...next };
  }
  return row;
}

export async function profileWithRank(row) {
  const rank = await rankFor(row.bestScore ?? 0);
  return publicProfile(row, rank);
}

/** The player plus everyone who joined through their referral link. */
export async function squadRows(me) {
  const links = await db
    .select({ referredId: referrals.referredId })
    .from(referrals)
    .where(eq(referrals.referrerId, me.id))
    .all();
  const ids = links.map((link) => link.referredId).filter(Boolean);
  const friends = ids.length
    ? await db.select().from(profiles).where(inArray(profiles.id, ids)).all()
    : [];
  const rows = [me, ...friends.filter((friend) => friend.id !== me.id)]
    .sort((a, b) => (b.bestScore ?? 0) - (a.bestScore ?? 0) || a.id - b.id)
    .map((row, index) => leaderboardRow(row, index + 1, me.tgId));
  return rows;
}
