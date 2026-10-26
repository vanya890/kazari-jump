import './style.css';
import { AppError, backend } from './api';
import { Game } from './game/engine';
import type { RunSnapshot } from './game/types';
import { ads } from './ads';
import { sfx } from './audio';
import { detectLang, makeT } from './i18n';
import {
  UI,
  createUiState,
  type Modal,
  type ShopTab,
  type UiState,
} from './ui';
import {
  applySafeArea,
  botLink,
  copyText,
  haptic,
  initTelegram,
  openInvoice,
  setHapticsEnabled,
  shareUrl,
  tg,
} from './tg';
import type { BootstrapData, Lang, Product, Scope } from './types';

const SETTINGS_KEY = 'kazari.settings.v1';
const ENV_BOT_USERNAME = String(import.meta.env.VITE_BOT_USERNAME ?? '').trim();

interface StoredSettings {
  lang?: Lang;
  sound?: boolean;
  haptics?: boolean;
}

function loadSettings(): StoredSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredSettings;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

const stored = loadSettings();
const deviceLang =
  tg?.initDataUnsafe?.user?.language_code ??
  (typeof navigator !== 'undefined' ? navigator.language : undefined);
let lang: Lang = stored.lang === 'ru' || stored.lang === 'en' ? stored.lang : detectLang(deviceLang);

const canvas = document.querySelector<HTMLCanvasElement>('#game');
const uiRoot = document.getElementById('ui');
if (!canvas || !uiRoot) throw new Error('Kazari Jump: game shell is missing');

const state: UiState = createUiState(lang);
state.sound = stored.sound !== false;
state.haptics = stored.haptics !== false;

let api = backend(lang);
let game: Game | null = null;
let publicBot: string | null = null;
let lastCoins = 0;
let deathTimer = 0;
let pendingDeath: RunSnapshot | null = null;
let offlineToastShown = false;

const t = (key: string, vars?: Record<string, string | number>): string => makeT(lang)(key, vars);

const ui = new UI(uiRoot, {
  onPlay: startRun,
  onPause: pauseGame,
  onResume: resumeGame,
  onRestart: startRun,
  onMenu: goMenu,
  onReviveAd: () => void revive('ad'),
  onReviveFree: () => void revive('free'),
  onEndRun: () => {
    const run = state.death?.run ?? state.result?.run;
    if (run) void finalizeRun(run);
  },
  onDouble: () => void doubleCoins(),
  onChallenge: () => void shareChallenge(),
  onOpenShop: () => openModal('shop'),
  onOpenLeaders: (scope) => void openLeaders(scope),
  onOpenSettings: () => openModal('settings'),
  onOpenTerms: () => openModal('terms'),
  onClose: closeModal,
  onBuy: (productId, currency) => void buyProduct(productId, currency),
  onEquip: (skinId) => void equipSkin(skinId),
  onShopTab: (tab: ShopTab) => {
    state.shopTab = tab;
    ui.render();
  },
  onBoardTab: (scope: Scope) => void openLeaders(scope),
  onInvite: () => void inviteFriends(),
  onToggleSound: toggleSound,
  onToggleHaptics: toggleHaptics,
  onSetLang: setLang,
  onRetry: () => {
    if (state.modal === 'leaders') void openLeaders(state.board.scope);
    else void boot();
  },
}, state);

function saveSettings(): void {
  try {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ lang, sound: state.sound, haptics: state.haptics } satisfies StoredSettings),
    );
  } catch {
    // Settings are best-effort.
  }
}

function applySettings(): void {
  sfx.setEnabled(state.sound);
  setHapticsEnabled(state.haptics);
}

function ensureGame(): Game {
  if (game) {
    game.setSkin(state.profile?.activeSkin ?? 'classic');
    return game;
  }
  game = new Game({
    canvas: canvas!,
    skinId: state.profile?.activeSkin ?? 'classic',
    callbacks: {
      onTick: (snapshot) => {
        if (state.screen !== 'game') return;
        const coins = snapshot.runCoins;
        const bump = coins > lastCoins;
        lastCoins = coins;
        ui.setHud(Math.floor(snapshot.distanceM), coins, bump);
      },
      onDeath: (run) => handleDeath(run),
    },
  });
  return game;
}

function applyBootstrap(data: BootstrapData): void {
  ui.applyBootstrap(data);
  state.adsAvailable = ads.available;
  publicBot = data.botUsername ?? (ENV_BOT_USERNAME || null);
  game?.setSkin(data.profile.activeSkin);
  applySettings();
}

async function boot(): Promise<void> {
  initTelegram();
  applySettings();
  tg?.onEvent?.('viewportChanged', applySafeArea);
  window.addEventListener('resize', applySafeArea);

  state.screen = 'loading';
  state.bootError = null;
  state.modal = null;
  state.overlay = null;
  ui.render();

  try {
    const data = await api.bootstrap(lang);
    applyBootstrap(data);
    ensureGame();
    state.screen = 'menu';
    ui.render();
    if (state.offline && !offlineToastShown) {
      offlineToastShown = true;
      window.setTimeout(() => ui.toast(t('toast.offline')), 500);
    }
  } catch (err) {
    state.bootError = errorText(err);
    state.screen = 'loading';
    ui.render();
  }
}

function startRun(): void {
  const profile = state.profile;
  if (!profile) return;
  window.clearTimeout(deathTimer);
  pendingDeath = null;
  lastCoins = 0;

  state.screen = 'game';
  state.overlay = null;
  state.modal = null;
  state.death = null;
  state.result = null;
  state.pauseRun = null;
  ui.setHud(0, 0);
  ui.render();

  const engine = ensureGame();
  engine.setSkin(profile.activeSkin);
  engine.start();
  haptic('tap');
}

function goMenu(): void {
  window.clearTimeout(deathTimer);
  pendingDeath = null;
  game?.toMenu();
  state.screen = 'menu';
  state.overlay = null;
  state.modal = null;
  state.death = null;
  state.result = null;
  state.pauseRun = null;
  ui.render();
}

function pauseGame(): void {
  if (!game || state.screen !== 'game' || state.overlay || state.modal) return;
  if (game.state.phase !== 'running') return;
  game.pause();
  state.pauseRun = game.snapshot();
  state.overlay = 'pause';
  ui.render();
  haptic('select');
}

function resumeGame(): void {
  if (!game || state.overlay !== 'pause') return;
  state.overlay = null;
  state.pauseRun = null;
  ui.render();
  game.resume();
  haptic('tap');
}

function handleDeath(run: RunSnapshot): void {
  pendingDeath = run;
  window.clearTimeout(deathTimer);
  deathTimer = window.setTimeout(() => {
    if (pendingDeath !== run) return;
    if (state.screen !== 'game' || state.overlay) return;
    const profile = state.profile;
    const freeRevive = Boolean(profile?.supporter || profile?.freeRevive) && !run.revived;
    const adAvailable = ads.available && !run.revived;
    if (run.revived || (!freeRevive && !adAvailable)) {
      void finalizeRun(run);
      return;
    }
    state.death = {
      run,
      best: profile?.bestScore ?? 0,
      freeRevive,
      adAvailable,
    };
    state.overlay = 'death';
    ui.render();
    haptic('warning');
  }, 720);
}

async function revive(mode: 'ad' | 'free'): Promise<void> {
  const death = state.death;
  if (!death || !game) return;
  if (mode === 'ad') {
    if (!ads.available) {
      ui.toast(t('toast.adUnavailable'), 'error');
      return;
    }
    const watched = await ads.showRewarded(lang);
    if (!watched) {
      ui.toast(t('toast.adUnavailable'), 'error');
      return;
    }
  }
  pendingDeath = null;
  state.death = null;
  state.overlay = null;
  ui.render();
  game.revive();
  ui.toast(t('toast.revived'), 'success');
}

async function finalizeRun(run: RunSnapshot): Promise<void> {
  pendingDeath = null;
  state.death = null;
  state.overlay = 'result';
  state.result = { run, submitted: null, saving: true, doubled: false, bonus: 0, error: null };
  ui.render();

  try {
    const submitted = await api.submitScore(run);
    state.profile = submitted.profile;
    const current = state.result;
    state.result = {
      run,
      submitted,
      saving: false,
      doubled: current?.doubled ?? false,
      bonus: current?.bonus ?? 0,
      error: null,
    };
    if (submitted.newBest) {
      sfx.record();
      haptic('success');
    } else {
      haptic('select');
    }
  } catch (err) {
    const current = state.result;
    state.result = {
      run,
      submitted: current?.submitted ?? null,
      saving: false,
      doubled: current?.doubled ?? false,
      bonus: current?.bonus ?? 0,
      error: errorText(err),
    };
    haptic('error');
  }
  ui.render();
}

async function doubleCoins(): Promise<void> {
  const result = state.result;
  const runId = result?.submitted?.runId;
  if (!result || !runId || result.doubled) return;
  if (!state.adsAvailable) {
    ui.toast(t('toast.adUnavailable'), 'error');
    return;
  }
  const watched = await ads.showRewarded(lang);
  if (!watched) {
    ui.toast(t('toast.adUnavailable'), 'error');
    return;
  }
  try {
    const claimed = await api.claimDouble(runId);
    if (claimed.profile) state.profile = claimed.profile;
    if (claimed.bonus > 0) {
      state.result = { ...result, doubled: true, bonus: claimed.bonus };
      sfx.purchase();
      haptic('success');
      ui.toast(t('toast.coinsDoubled', { n: claimed.bonus }), 'success');
    } else {
      state.result = { ...result, doubled: true, bonus: 0 };
    }
  } catch (err) {
    ui.toast(errorText(err), 'error');
    haptic('error');
  }
  ui.render();
}

function openModal(modal: Exclude<Modal, null>): void {
  state.modal = modal;
  ui.render();
  haptic('select');
}

function closeModal(): void {
  if (!state.modal) return;
  state.modal = state.modal === 'terms' ? 'settings' : null;
  ui.render();
}

async function openLeaders(scope: Scope): Promise<void> {
  state.modal = 'leaders';
  state.board = { scope, loading: true, data: null, error: null };
  ui.render();

  try {
    const data = await api.leaderboard(scope);
    if (state.modal !== 'leaders' || state.board.scope !== scope) return;
    state.board = { scope, loading: false, data, error: null };
    if (data.me) state.profile = data.me;
  } catch (err) {
    if (state.board.scope !== scope) return;
    state.board = { scope, loading: false, data: null, error: errorText(err) };
    haptic('error');
  }
  ui.render();
}

async function buyProduct(productId: string, currency: 'coins' | 'stars'): Promise<void> {
  if (state.pendingProduct) return;
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;
  if (currency === 'stars') await buyWithStars(product);
  else await buyWithCoins(product);
}

async function buyWithCoins(product: Product): Promise<void> {
  const profile = state.profile;
  if (!profile || !product.priceCoins) return;
  if (profile.coins < product.priceCoins) {
    ui.toast(t('shop.notEnough'), 'error');
    haptic('error');
    return;
  }
  state.pendingProduct = product.id;
  ui.render();
  try {
    let next = await api.buyWithCoins(product.id);
    state.profile = next;
    if (product.skinId) {
      next = await api.equip(product.skinId);
      state.profile = next;
      game?.setSkin(next.activeSkin);
    }
    sfx.purchase();
    haptic('success');
    ui.toast(t('shop.thanks'), 'success');
  } catch (err) {
    ui.toast(errorText(err), 'error');
    haptic('error');
  } finally {
    state.pendingProduct = null;
    ui.render();
  }
}

async function buyWithStars(product: Product): Promise<void> {
  if (!product.priceStars) return;
  if (api.isLocal || state.offline) {
    ui.toast(t('shop.starsOnlyTelegram'), 'error');
    return;
  }
  state.pendingProduct = product.id;
  ui.render();
  ui.toast(t('shop.processing'));
  try {
    const url = await api.createInvoice(product.id);
    const status = await openInvoice(url);
    if (status === 'paid') {
      sfx.purchase();
      haptic('success');
      ui.toast(t('shop.thanks'), 'success');
      await refreshProfile();
      window.setTimeout(() => void refreshProfile(), 1600);
    } else if (status === 'cancelled') {
      ui.toast(t('shop.cancelled'));
    } else if (status === 'failed' || status === 'unsupported') {
      ui.toast(t('shop.failed'), 'error');
    } else {
      window.setTimeout(() => void refreshProfile(), 2600);
    }
  } catch (err) {
    ui.toast(errorText(err), 'error');
    haptic('error');
  } finally {
    state.pendingProduct = null;
    ui.render();
  }
}

async function refreshProfile(): Promise<void> {
  try {
    const data = await api.bootstrap(lang);
    ui.applyBootstrap(data);
    state.adsAvailable = ads.available;
    publicBot = data.botUsername ?? publicBot ?? (ENV_BOT_USERNAME || null);
    game?.setSkin(data.profile.activeSkin);
    ui.render();
  } catch {
    // The product can take a moment to land; the next open will refresh it.
  }
}

async function equipSkin(skinId: string): Promise<void> {
  if (state.pendingProduct) return;
  state.pendingProduct = `equip:${skinId}`;
  ui.render();
  try {
    const next = await api.equip(skinId);
    state.profile = next;
    game?.setSkin(next.activeSkin);
    sfx.purchase();
    haptic('select');
  } catch (err) {
    ui.toast(errorText(err), 'error');
  } finally {
    state.pendingProduct = null;
    ui.render();
  }
}

function telegramLink(param: string): string {
  if (!publicBot || state.offline) return '';
  return botLink(publicBot, param);
}

async function shareChallenge(): Promise<void> {
  const profile = state.profile;
  const distance = Math.max(
    profile?.bestScore ?? 0,
    state.result?.run.distance ?? 0,
  );
  const text = t('challenge.share', { n: distance });
  const link = telegramLink(`ch-${distance}`);
  if (link) {
    await shareUrl(link, text);
    ui.toast(t('toast.invite'));
  } else {
    const ok = await copyText(`${text} ${window.location.href}`);
    ui.toast(ok ? t('toast.invite') : t('toast.error'), ok ? 'success' : 'error');
  }
}

async function inviteFriends(): Promise<void> {
  const profile = state.profile;
  const text = `${t('app.name')} — ${t('app.tagline')}`;
  const link = profile ? telegramLink(`ref-${profile.id}`) : '';
  if (link) {
    await shareUrl(link, text);
    ui.toast(t('toast.invite'));
    return;
  }
  const ok = await copyText(`${text} ${window.location.href}`);
  ui.toast(ok ? t('toast.invite') : t('toast.error'), ok ? 'success' : 'error');
}

function toggleSound(): void {
  state.sound = !state.sound;
  sfx.setEnabled(state.sound);
  if (state.sound) sfx.click();
  saveSettings();
  ui.render();
}

function toggleHaptics(): void {
  state.haptics = !state.haptics;
  setHapticsEnabled(state.haptics);
  saveSettings();
  if (state.haptics) haptic('select');
  ui.render();
}

function setLang(next: Lang): void {
  if (next === lang) return;
  lang = next;
  state.lang = next;
  api = backend(next);
  if (state.profile && !state.profile.id) state.profile.name = makeT(next)('guest');
  saveSettings();
  ui.render();
  ui.toast(t('toast.language'));
}

function errorText(err: unknown): string {
  const raw = err instanceof AppError ? err.code : err instanceof Error ? err.message : '';
  const code = raw.toUpperCase();
  if (code.includes('RATE') || code.includes('TOO_MANY')) return t('toast.rate');
  if (code.includes('UNAUTHORIZED') || code.includes('INIT_DATA')) return t('err.unauthorized');
  if (code.includes('NOT_ENOUGH_COINS') || code.includes('INSUFFICIENT')) return t('err.coins');
  if (code.includes('ALREADY_OWNED') || code.endsWith('_OWNED')) return t('err.owned');
  if (code.includes('INVALID') || code.includes('REJECTED') || code.includes('CHEAT')) return t('err.invalid');
  if (code.includes('NETWORK') || code.includes('TIMEOUT') || code.includes('SERVERLESS')) return t('err.network');
  if (code.includes('STARS_ONLY')) return t('shop.starsOnlyTelegram');
  if (code.includes('NOT_FOUND') || code.includes('NOT_FOR_SALE') || code === 'UNKNOWN') {
    return t('toast.error');
  }
  if (raw && !/^[A-Z0-9_]+$/.test(raw)) return raw;
  return t('toast.error');
}

function bindInput(): void {
  const press = (event: PointerEvent): void => {
    if (state.screen !== 'game' || state.overlay || state.modal) return;
    event.preventDefault();
    game?.press();
  };
  const release = (): void => {
    game?.release();
  };

  canvas!.addEventListener('pointerdown', press, { passive: false });
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
  window.addEventListener('blur', release);

  window.addEventListener('keydown', (event) => {
    if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') {
      if (state.screen === 'game' && !state.overlay && !state.modal) {
        event.preventDefault();
        game?.press();
      }
    }
    if (event.code === 'Escape') {
      if (state.modal) closeModal();
      else if (state.overlay === 'pause') resumeGame();
    }
  });
  window.addEventListener('keyup', (event) => {
    if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') release();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.screen === 'game' && game?.state.phase === 'running') pauseGame();
  });
}

document.getElementById('btn-pause')?.addEventListener('click', (event) => {
  event.preventDefault();
  pauseGame();
});

// The game canvas keeps the roving focus; buttons should not scroll on space.
window.addEventListener('keydown', (event) => {
  if (event.code === 'Space' && (event.target as HTMLElement | null)?.tagName === 'BUTTON') {
    event.preventDefault();
    (event.target as HTMLElement).click();
  }
});

bindInput();
applySettings();
ui.render();
void boot();

if (import.meta.env.DEV) {
  const debugWindow = window as Window & { __kazari?: Record<string, unknown> };
  debugWindow.__kazari = {
    get game() {
      return game;
    },
    get state() {
      return state;
    },
    ui,
    startRun,
    pauseGame,
    resumeGame,
    goMenu,
    finalizeRun,
    revive,
    openLeaders,
    openModal,
    closeModal,
    setLang,
  };
}
