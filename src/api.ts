import type {
  BootstrapData,
  Lang,
  LeaderboardData,
  Profile,
  RunResult,
  Scope,
  SubmitResult,
} from './types';
import { callEndpoint, serverlessAvailable, startParam } from './tg';
import { LocalBackend } from './local';

export class AppError extends Error {
  code: string;
  constructor(message: string, code = 'UNKNOWN') {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}

function wrapError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  const anyErr = err as { message?: string; parameters?: { code?: string }; type?: string } | null;
  const code = anyErr?.parameters?.code ?? anyErr?.type ?? 'UNKNOWN';
  const message = typeof anyErr?.message === 'string' ? anyErr.message : 'Request failed';
  return new AppError(message, code);
}

class Backend {
  mode: 'server' | 'local' = serverlessAvailable() ? 'server' : 'local';
  private local: LocalBackend;
  readonly bootStartParam: string | null;

  constructor(lang: Lang) {
    this.local = new LocalBackend(lang);
    this.bootStartParam = startParam();
  }

  setLang(lang: Lang): void {
    this.local = new LocalBackend(lang);
  }

  get isLocal(): boolean {
    return this.mode === 'local';
  }

  private async served<T>(endpoint: string, input: Record<string, unknown>): Promise<T> {
    if (this.mode === 'local') throw new AppError('Local mode', 'LOCAL');
    try {
      return await callEndpoint<T>(endpoint, input);
    } catch (err) {
      throw wrapError(err);
    }
  }

  async bootstrap(lang: Lang): Promise<BootstrapData> {
    if (this.mode === 'server') {
      try {
        return await this.served<BootstrapData>('bootstrap', {
          lang,
          startParam: this.bootStartParam,
        });
      } catch (err) {
        const code = err instanceof AppError ? err.code : 'UNKNOWN';
        if (code === 'UNAUTHORIZED' || code === 'SERVERLESS_UNAVAILABLE' || code === 'ENDPOINT_TIMEOUT') {
          this.mode = 'local';
        } else {
          throw err;
        }
      }
    }
    return this.local.bootstrap({ lang, startParam: this.bootStartParam });
  }

  async submitScore(run: RunResult, checkpoint = false): Promise<SubmitResult> {
    const input = {
      score: run.score,
      distance: run.distance,
      coins: run.coins,
      durationMs: run.durationMs,
      revived: run.revived,
      checkpoint,
    };
    if (this.mode === 'server') {
      try {
        return await this.served<SubmitResult>('submitScore', input);
      } catch (err) {
        if (err instanceof AppError && (err.code === 'UNAUTHORIZED' || err.code === 'SERVERLESS_UNAVAILABLE')) {
          this.mode = 'local';
        } else {
          throw err;
        }
      }
    }
    return this.local.submitScore(run, run.revived);
  }

  async leaderboard(scope: Scope): Promise<LeaderboardData> {
    if (this.mode === 'server') {
      return this.served<LeaderboardData>('leaderboard', { scope });
    }
    return this.local.leaderboard(scope);
  }

  async buyWithCoins(productId: string): Promise<Profile> {
    if (this.mode === 'server') {
      const result = await this.served<{ profile: Profile }>('buyWithCoins', { productId });
      return result.profile;
    }
    return this.local.buyWithCoins(productId);
  }

  async equip(skinId: string): Promise<Profile> {
    if (this.mode === 'server') {
      const result = await this.served<{ profile: Profile }>('equipSkin', { skinId });
      return result.profile;
    }
    return this.local.equip(skinId);
  }

  async createInvoice(productId: string): Promise<string> {
    if (this.mode === 'server') {
      const result = await this.served<{ url: string }>('createInvoice', { productId });
      return result.url;
    }
    throw new AppError('Stars are available in Telegram only', 'STARS_ONLY_TELEGRAM');
  }

  async claimDouble(runId: number): Promise<{ profile: Profile; bonus: number }> {
    if (this.mode === 'server') {
      return this.served<{ profile: Profile; bonus: number }>('claimDouble', { runId });
    }
    return this.local.claimDouble(runId);
  }
}

let instance: Backend | null = null;

export function backend(lang: Lang): Backend {
  if (!instance) instance = new Backend(lang);
  else instance.setLang(lang);
  return instance;
}
