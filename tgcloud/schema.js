import { table, integer, text, boolean, json, index, sql } from 'sdk/db';

// Kazari Jump — persistent player data. Foreign keys are not supported by the
// runtime, so links between tables are enforced in application code.

export const profiles = table(
  'profiles',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    tgId: integer('tg_id').notNull().unique(),
    name: text('name').notNull(),
    username: text('username'),
    photoUrl: text('photo_url'),
    lang: text('lang').default('ru'),
    bestScore: integer('best_score').default(0),
    coins: integer('coins').default(250),
    games: integer('games').default(0),
    totalDistance: integer('total_distance').default(0),
    activeSkin: text('active_skin').default('classic'),
    ownedSkins: json('owned_skins').default(['classic']),
    supporter: boolean('supporter').default(false),
    referrals: integer('referrals').default(0),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  },
  (t) => ({
    bestIdx: index('idx_profiles_best').on(t.bestScore),
  }),
);

export const runs = table(
  'runs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    profileId: integer('profile_id').notNull(),
    score: integer('score').notNull().default(0),
    distance: integer('distance').notNull().default(0),
    coins: integer('coins').notNull().default(0),
    durationMs: integer('duration_ms').notNull().default(0),
    revived: boolean('revived').default(false),
    doubled: boolean('doubled').default(false),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  },
  (t) => ({
    profileIdx: index('idx_runs_profile_created').on(t.profileId, t.createdAt),
    createdIdx: index('idx_runs_created').on(t.createdAt),
  }),
);

export const purchases = table(
  'purchases',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    profileId: integer('profile_id').notNull(),
    productId: text('product_id').notNull(),
    chargeId: text('charge_id').notNull().unique(),
    stars: integer('stars').notNull().default(0),
    payload: text('payload'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  },
  (t) => ({
    profileIdx: index('idx_purchases_profile').on(t.profileId),
  }),
);

export const referrals = table(
  'referrals',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    referrerId: integer('referrer_id').notNull(),
    referredId: integer('referred_id').notNull().unique(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  },
  (t) => ({
    referrerIdx: index('idx_referrals_referrer').on(t.referrerId),
  }),
);
