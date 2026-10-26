export interface TgWebApp {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      photo_url?: string;
      is_premium?: boolean;
    };
    start_param?: string;
    auth_date?: number;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  isExpanded: boolean;
  isFullscreen?: boolean;
  viewportStableHeight?: number;
  safeAreaInset?: { top: number; bottom: number; left: number; right: number };
  contentSafeAreaInset?: { top: number; bottom: number; left: number; right: number };
  Serverless?: {
    call(
      name: string,
      input?: Record<string, unknown> | ((err: unknown, result: unknown) => void),
      callback?: (err: unknown, result: unknown) => void,
    ): void;
  };
  ready(): void;
  expand(): void;
  requestFullscreen?(): void;
  disableVerticalSwipes?(): void;
  enableVerticalSwipes?(): void;
  lockOrientation?(): void;
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
  setBottomBarColor?(color: string): void;
  showPopup?(params: unknown, cb?: (id: string) => void): void;
  showAlert?(message: string, cb?: () => void): void;
  showConfirm?(message: string, cb?: (ok: boolean) => void): void;
  openInvoice?(url: string, cb?: (status: string) => void): void;
  openTelegramLink?(url: string): void;
  openLink?(url: string): void;
  onEvent?(event: string, cb: () => void): void;
  offEvent?(event: string, cb: () => void): void;
  isVersionAtLeast?(v: string): boolean;
  HapticFeedback?: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
    selectionChanged(): void;
  };
  close?(): void;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TgWebApp };
  }
}

export const tg: TgWebApp | undefined = window.Telegram?.WebApp;

let hapticsEnabled = true;

export function setHapticsEnabled(value: boolean): void {
  hapticsEnabled = value;
}

export const isTelegram = Boolean(tg && tg.initData);

// Static demo builds (GitHub Pages, plain file hosts) have no Telegram
// Serverless backend. Skip the doomed endpoint call so boot stays instant.
const LOCAL_ONLY = import.meta.env.VITE_LOCAL_ONLY === '1';

export function initTelegram(): void {
  if (!tg) return;
  try {
    tg.ready();
    tg.expand();
    if (tg.isVersionAtLeast?.('8.0') && !tg.isFullscreen) {
      tg.requestFullscreen?.();
    }
    // The game uses vertical taps; stop Telegram from minimizing on a swipe.
    tg.disableVerticalSwipes?.();
    tg.setHeaderColor('#100f2b');
    tg.setBackgroundColor('#100f2b');
    tg.setBottomBarColor?.('#100f2b');
  } catch {
    // Older clients may not implement every method.
  }
  applySafeArea();
}

export function applySafeArea(): void {
  if (!tg) return;
  const content = tg.contentSafeAreaInset;
  const safe = tg.safeAreaInset;
  const top = Math.max(content?.top ?? 0, safe?.top ?? 0);
  const bottom = Math.max(content?.bottom ?? 0, safe?.bottom ?? 0);
  const root = document.documentElement;
  root.style.setProperty('--safe-top', `${Math.max(0, top)}px`);
  root.style.setProperty('--safe-bottom', `${Math.max(0, bottom)}px`);
}

export function haptic(kind: 'tap' | 'coin' | 'success' | 'error' | 'warning' | 'select'): void {
  if (!hapticsEnabled) return;
  const h = tg?.HapticFeedback;
  if (!h) return;
  try {
    if (kind === 'tap') h.impactOccurred('light');
    else if (kind === 'coin') h.impactOccurred('soft');
    else if (kind === 'select') h.selectionChanged();
    else h.notificationOccurred(kind);
  } catch {
    // ignore
  }
}

export function startParam(): string | null {
  const fromTg = tg?.initDataUnsafe?.start_param;
  if (fromTg) return fromTg;
  try {
    return new URLSearchParams(window.location.search).get('tgWebAppStartParam');
  } catch {
    return null;
  }
}

export function telegramUser() {
  return tg?.initDataUnsafe?.user;
}

export function serverlessAvailable(): boolean {
  return !LOCAL_ONLY && Boolean(isTelegram && tg?.Serverless?.call);
}

export function callEndpoint<T>(name: string, input: Record<string, unknown> = {}): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const serverless = tg?.Serverless;
    if (!serverless) {
      reject(new Error('SERVERLESS_UNAVAILABLE'));
      return;
    }
    let settled = false;
    const finish = (err: unknown, result: unknown) => {
      if (settled) return;
      settled = true;
      if (err) reject(err);
      else resolve(result as T);
    };
    try {
      serverless.call(name, input, finish);
    } catch (err) {
      reject(err);
    }
    window.setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error('ENDPOINT_TIMEOUT'));
      }
    }, 12000);
  });
}

export function openInvoice(url: string): Promise<string> {
  return new Promise((resolve) => {
    if (!tg?.openInvoice) {
      resolve('unsupported');
      return;
    }
    let settled = false;
    const done = (status: string) => {
      if (settled) return;
      settled = true;
      resolve(status);
    };
    try {
      tg.openInvoice(url, done);
    } catch {
      done('failed');
    }
    window.setTimeout(() => done('pending'), 180000);
  });
}

export function openTelegramLink(url: string): void {
  if (tg?.openTelegramLink) tg.openTelegramLink(url);
  else window.open(url, '_blank', 'noopener');
}

export function botLink(username: string | null, param?: string): string {
  if (!username) return '';
  const base = `https://t.me/${username.replace(/^@/, '')}`;
  return param ? `${base}?startapp=${encodeURIComponent(param)}` : base;
}

export async function shareUrl(url: string, text: string): Promise<void> {
  const share = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  openTelegramLink(share);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function showAlert(message: string): void {
  if (tg?.showAlert) tg.showAlert(message);
  else window.alert(message);
}
