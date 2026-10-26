import type {
  BootstrapData,
  LeaderboardData,
  LeaderboardRow,
  Lang,
  Profile,
  RunResult,
  Scope,
  SubmitResult,
} from './types';
import { FALLBACK_PRODUCTS, skinVisual } from './data/catalog';
import { translate } from './i18n';
import { telegramUser } from './tg';

const KEY = 'kazari.local.v1';

interface LocalState {
  profile: Profile;
  runs: Array<{ id: number; score: number; coins: number; durationMs: number; at: number; doubled: boolean }>;
  nextRunId: number;
}

const BOTS: Array<{ id: number; name: string; score: number; username: string }> = [
  { id: 90001, name: 'Мира', username: 'mira_runs', score: 1842 },
  { id: 90002, name: 'Nox', username: 'nox', score: 1510 },
  { id: 90003, name: 'Тоша', username: 'tosha', score: 1287 },
  { id: 90004, name: 'Luma', username: 'luma', score: 1104 },
  { id: 90005, name: 'Кира', username: 'kira', score: 956 },
  { id: 90006, name: 'Pixel', username: 'pixel', score: 844 },
  { id: 90007, name: 'Соня', username: 'sonya', score: 731 },
  { id: 90008, name: 'Juno', username: 'juno', score: 622 },
  { id: 90009, name: 'Тим', username: 'tim', score: 518 },
  { id: 90010, name: 'Echo', username: 'echo', score: 407 },
];

const SQUAD_BOTS = [BOTS[2], BOTS[5]];

function emptyProfile(lang: Lang): Profile {
  const user = telegramUser();
  const fallback = translate(lang, 'guest');
  return {
    id: user?.id ?? 0,
    name: [user?.first_name, user?.last_name].filter(Boolean).join(' ') || fallback,
    username: user?.username ?? null,
    photoUrl: user?.photo_url ?? null,
    bestScore: 0,
    coins: 250,
    games: 0,
    totalDistance: 0,
    activeSkin: 'classic',
    ownedSkins: ['classic'],
    supporter: false,
    freeRevive: false,
    referrals: 0,
    rank: 0,
  };
}

function load(lang: Lang): LocalState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LocalState;
      if (parsed?.profile && Array.isArray(parsed.runs)) {
        const user = telegramUser();
        if (user) {
          parsed.profile.id = user.id;
          parsed.profile.name =
            [user.first_name, user.last_name].filter(Boolean).join(' ') || parsed.profile.name;
          parsed.profile.username = user.username ?? parsed.profile.username;
          parsed.profile.photoUrl = user.photo_url ?? parsed.profile.photoUrl;
        } else if (!parsed.profile.id) {
          parsed.profile.name = translate(lang, 'guest');
        }
        return parsed;
      }
    }
  } catch {
    // corrupted local state is replaced
  }
  return { profile: emptyProfile(lang), runs: [], nextRunId: 1 };
}

function save(state: LocalState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage can be unavailable; local mode still works for the session
  }
}

function rankOf(score: number): number {
  let rank = 1;
  for (const bot of BOTS) if (bot.score > score) rank += 1;
  return rank;
}

function rowFor(profile: Profile, rank: number): LeaderboardData['rows'][number] {
  return {
    id: profile.id,
    name: profile.name,
    username: profile.username,
    photoUrl: profile.photoUrl,
    bestScore: profile.bestScore,
    rank,
    isMe: true,
  };
}

export class LocalBackend {
  private lang: Lang;

  constructor(lang: Lang) {
    this.lang = lang;
  }

  private withRank(state: LocalState): Profile {
    state.profile.rank = rankOf(state.profile.bestScore);
    return state.profile;
  }

  async bootstrap(_input: { lang?: string; startParam?: string | null }): Promise<BootstrapData> {
    const state = load(this.lang);
    this.withRank(state);
    save(state);
    return {
      profile: state.profile,
      products: FALLBACK_PRODUCTS,
      top: this.globalRows(state).slice(0, 10),
      totalPlayers: BOTS.length + 1,
      botUsername: null,
      startParam: null,
      challengeScore: null,
      offline: true,
    };
  }

  private globalRows(state: LocalState): LeaderboardData['rows'] {
    const rows: LeaderboardRow[] = BOTS.map((bot, index) => ({
      id: bot.id,
      name: bot.name,
      username: bot.username,
      photoUrl: null,
      bestScore: bot.score,
      rank: index + 1,
    }));
    if (state.profile.bestScore > 0) {
      rows.push(rowFor(state.profile, rankOf(state.profile.bestScore)));
      rows.sort((a, b) => b.bestScore - a.bestScore);
      rows.forEach((row, index) => {
        row.rank = index + 1;
      });
    }
    return rows;
  }

  async leaderboard(scope: Scope): Promise<LeaderboardData> {
    const state = load(this.lang);
    this.withRank(state);
    if (scope === 'squad') {
      const rows: LeaderboardRow[] = SQUAD_BOTS.map((bot, index) => ({
        id: bot.id,
        name: bot.name,
        username: bot.username,
        photoUrl: null,
        bestScore: bot.score,
        rank: index + 1,
      }));
      rows.push(rowFor(state.profile, rows.length + 1));
      return { scope, rows, me: state.profile, total: rows.length };
    }
    const rows = this.globalRows(state);
    return { scope, rows: rows.slice(0, 100), me: state.profile, total: BOTS.length + 1 };
  }

  async submitScore(run: Omit<RunResult, 'revived'>, _revived = false): Promise<SubmitResult> {
    const state = load(this.lang);
    const coins = Math.max(0, Math.floor(run.coins));
    const score = Math.max(0, Math.floor(run.score));
    const distance = Math.max(0, Math.floor(run.distance));
    state.profile.coins += coins;
    state.profile.games += 1;
    state.profile.totalDistance += distance;
    const newBest = score > state.profile.bestScore;
    if (newBest) state.profile.bestScore = score;
    const id = state.nextRunId++;
    state.runs.push({ id, score, coins, durationMs: run.durationMs, at: Date.now(), doubled: false });
    state.runs = state.runs.slice(-50);
    this.withRank(state);
    save(state);
    return {
      profile: state.profile,
      coinsBanked: coins,
      newBest,
      rank: state.profile.rank,
      runId: id,
    };
  }

  async claimDouble(runId: number): Promise<{ profile: Profile; bonus: number }> {
    const state = load(this.lang);
    const run = state.runs.find((item) => item.id === runId && !item.doubled && Date.now() - item.at < 10 * 60_000);
    if (!run) return { profile: this.withRank(state), bonus: 0 };
    run.doubled = true;
    state.profile.coins += run.coins;
    save(state);
    return { profile: this.withRank(state), bonus: run.coins };
  }

  async buyWithCoins(productId: string): Promise<Profile> {
    const state = load(this.lang);
    const product = FALLBACK_PRODUCTS.find((item) => item.id === productId);
    if (!product || product.kind !== 'skin' || !product.priceCoins) throw new Error('NOT_FOR_SALE');
    if (state.profile.ownedSkins.includes(product.skinId ?? '')) throw new Error('ALREADY_OWNED');
    if (state.profile.coins < product.priceCoins) throw new Error('NOT_ENOUGH_COINS');
    state.profile.coins -= product.priceCoins;
    state.profile.ownedSkins.push(product.skinId ?? '');
    save(state);
    return state.profile;
  }

  async equip(skinId: string): Promise<Profile> {
    const state = load(this.lang);
    if (!state.profile.ownedSkins.includes(skinId)) throw new Error('NOT_OWNED');
    state.profile.activeSkin = skinVisual(skinId).id;
    save(state);
    return state.profile;
  }

  async createInvoice(_productId: string): Promise<{ url: string }> {
    throw new Error('STARS_ONLY_TELEGRAM');
  }

  reset(): void {
    localStorage.removeItem(KEY);
  }
}
