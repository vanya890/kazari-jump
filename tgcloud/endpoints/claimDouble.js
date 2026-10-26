import { db, EndpointError } from 'sdk';
import { and, eq, sql } from 'sdk/db';
import { profiles, runs } from '../schema.js';
import { ensureProfile, findProfile, publicProfile, rankFor } from '../lib/profiles.js';

const DOUBLE_WINDOW_MS = 10 * 60 * 1000;

export default async function (input, ctx) {
  const user = ctx.initData?.user;
  if (!user?.id) throw new EndpointError('Missing Telegram user', { code: 'UNAUTHORIZED' });

  const runId = Number(input?.runId);
  if (!Number.isInteger(runId) || runId <= 0) {
    throw new EndpointError('Invalid run', { code: 'INVALID_RUN' });
  }

  const row = (await findProfile(user.id)) ?? (await ensureProfile(user, null));
  if (!row) throw new EndpointError('Could not load profile', { code: 'PROFILE_ERROR' });

  const run = await db
    .select()
    .from(runs)
    .where(and(eq(runs.id, runId), eq(runs.profileId, row.id)))
    .get();
  if (!run) throw new EndpointError('Run not found', { code: 'NOT_FOUND' });

  const rank = await rankFor(row.bestScore ?? 0);
  if (run.doubled) return { profile: publicProfile(row, rank), bonus: 0 };

  const createdAt = run.createdAt instanceof Date ? run.createdAt.getTime() : Date.now();
  if (Date.now() - createdAt > DOUBLE_WINDOW_MS) {
    throw new EndpointError('Run is too old', { code: 'EXPIRED' });
  }

  const claimed = await db
    .update(runs)
    .set({ doubled: true })
    .where(and(eq(runs.id, runId), eq(runs.profileId, row.id), eq(runs.doubled, false)))
    .returning({ id: runs.id, coins: runs.coins });
  if (!claimed.length) return { profile: publicProfile(row, rank), bonus: 0 };

  const bonus = Math.max(0, claimed[0].coins ?? 0);
  if (!bonus) return { profile: publicProfile(row, rank), bonus: 0 };

  await db
    .update(profiles)
    .set({ coins: sql`${profiles.coins} + ${bonus}`, updatedAt: sql`(unixepoch())` })
    .where(eq(profiles.id, row.id))
    .run();

  const fresh = (await findProfile(user.id)) ?? row;
  return {
    profile: publicProfile(fresh, await rankFor(fresh.bestScore ?? 0)),
    bonus,
  };
}
