import { db, EndpointError } from 'sdk';
import { eq, sql } from 'sdk/db';
import { profiles, runs } from '../schema.js';
import { ensureProfile, findProfile, publicProfile, rankFor } from '../lib/profiles.js';
import { validateRun } from '../lib/score.js';

export default async function (input, ctx) {
  const user = ctx.initData?.user;
  if (!user?.id) throw new EndpointError('Missing Telegram user', { code: 'UNAUTHORIZED' });

  const run = validateRun(input);
  const row = (await findProfile(user.id)) ?? (await ensureProfile(user, null));
  if (!row) throw new EndpointError('Could not load profile', { code: 'PROFILE_ERROR' });

  const recent = await db.get(
    sql`SELECT COUNT(*) AS c FROM runs WHERE profile_id = ${row.id} AND created_at > unixepoch() - 10`,
  );
  if ((recent?.c ?? 0) >= 3) {
    throw new EndpointError('Too many runs', { code: 'RATE_LIMIT' });
  }
  const daily = await db.get(
    sql`SELECT COUNT(*) AS c FROM runs WHERE profile_id = ${row.id} AND created_at > unixepoch() - 86400`,
  );
  if ((daily?.c ?? 0) >= 300) {
    throw new EndpointError('Daily run limit reached', { code: 'RATE_LIMIT' });
  }

  const newBest = run.score > (row.bestScore ?? 0);
  const inserted = await db
    .insert(runs)
    .values({
      profileId: row.id,
      score: run.score,
      distance: run.distance,
      coins: run.coins,
      durationMs: run.durationMs,
      revived: run.revived,
    })
    .returning({ id: runs.id });

  await db
    .update(profiles)
    .set({
      coins: sql`${profiles.coins} + ${run.coins}`,
      games: sql`${profiles.games} + 1`,
      totalDistance: sql`${profiles.totalDistance} + ${run.distance}`,
      bestScore: sql`max(${profiles.bestScore}, ${run.score})`,
      updatedAt: sql`(unixepoch())`,
    })
    .where(eq(profiles.id, row.id))
    .run();

  const fresh = (await findProfile(user.id)) ?? row;
  const rank = await rankFor(fresh.bestScore ?? 0);

  return {
    profile: publicProfile(fresh, rank),
    coinsBanked: run.coins,
    newBest,
    rank,
    runId: inserted[0]?.id ?? null,
  };
}
