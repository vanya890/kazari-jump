import type { RunSnapshot } from './game/types';
import type {
  BootstrapData,
  Lang,
  LeaderboardData,
  LeaderboardRow,
  Product,
  Profile,
  Scope,
  SubmitResult,
} from './types';
import { productDescription, productTitle, skinVisual } from './data/catalog';
import { formatNumber, makeT } from './i18n';
import { paintAvatars } from './avatar';
import { sfx } from './audio';
import { WORLD_ATLAS, worldAt } from './game/worlds';

export const APP_VERSION = '0.1.0';

export type Screen = 'loading' | 'menu' | 'game';
export type Overlay = 'pause' | 'death' | 'result' | null;
export type Modal = 'shop' | 'leaders' | 'settings' | 'terms' | null;
export type ShopTab = 'skins' | 'coins' | 'support';

export interface DeathView {
  run: RunSnapshot;
  best: number;
  freeRevive: boolean;
  adAvailable: boolean;
}

export interface ResultView {
  run: RunSnapshot;
  submitted: SubmitResult | null;
  saving: boolean;
  doubled: boolean;
  bonus: number;
  error: string | null;
}

export interface BoardView {
  scope: Scope;
  loading: boolean;
  data: LeaderboardData | null;
  error: string | null;
}

export interface UiState {
  lang: Lang;
  screen: Screen;
  overlay: Overlay;
  modal: Modal;
  profile: Profile | null;
  products: Product[];
  top: LeaderboardRow[];
  totalPlayers: number;
  challengeScore: number | null;
  botUsername: string | null;
  offline: boolean;
  adsAvailable: boolean;
  pendingProduct: string | null;
  shopTab: ShopTab;
  board: BoardView;
  sound: boolean;
  haptics: boolean;
  death: DeathView | null;
  result: ResultView | null;
  pauseRun: RunSnapshot | null;
  bootError: string | null;
}

export interface UIHandlers {
  onPlay(): void;
  onPause(): void;
  onResume(): void;
  onRestart(): void;
  onMenu(): void;
  onReviveAd(): void;
  onReviveFree(): void;
  onEndRun(): void;
  onDouble(): void;
  onChallenge(): void;
  onOpenShop(): void;
  onOpenLeaders(scope: Scope): void;
  onOpenSettings(): void;
  onOpenTerms(): void;
  onClose(): void;
  onBuy(productId: string, currency: 'coins' | 'stars'): void;
  onEquip(skinId: string): void;
  onShopTab(tab: ShopTab): void;
  onBoardTab(scope: Scope): void;
  onInvite(): void;
  onToggleSound(): void;
  onToggleHaptics(): void;
  onSetLang(lang: Lang): void;
  onRetry(): void;
}

const ICONS: Record<string, string> = {
  play: '<path d="M8.2 5.3a1 1 0 0 1 1.5-.86l9.2 6.7a1 1 0 0 1 0 1.72l-9.2 6.7a1 1 0 0 1-1.5-.86Z" fill="currentColor"/>',
  pause:
    '<rect x="7" y="5.5" width="3.4" height="13" rx="1.3" fill="currentColor"/><rect x="13.6" y="5.5" width="3.4" height="13" rx="1.3" fill="currentColor"/>',
  coin:
    '<circle cx="12" cy="12" r="8.4" fill="currentColor" opacity=".22"/><circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 8.6v6.8M10.1 10.2h3.1a1.5 1.5 0 0 1 0 3h-2.4a1.5 1.5 0 0 0 0 3h3.1" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  hanger:
    '<path d="M12 4.2a2.5 2.5 0 0 1 2.4 3.2c-.3 1.1-1.2 1.6-2.4 2.3L3.6 14.4a1.4 1.4 0 0 0-.6 1.2v1.2a1.6 1.6 0 0 0 1.6 1.6h14.8a1.6 1.6 0 0 0 1.6-1.6v-1.2a1.4 1.4 0 0 0-.6-1.2L12 9.7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
  trophy:
    '<path d="M8 4.5h8v4.2a4 4 0 0 1-8 0Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M8 5.6H5.4v1.2A3.2 3.2 0 0 0 8.6 10M16 5.6h2.6v1.2a3.2 3.2 0 0 1-3.2 3.2M12 12.7v4.1M8.8 19.5h6.4M10 16.8h4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
  gear: '<circle cx="12" cy="12" r="3.1" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 2.8v2.3M12 18.9v2.3M21.2 12h-2.3M5.1 12H2.8M18.5 5.5l-1.6 1.6M7.1 16.9l-1.6 1.6M18.5 18.5l-1.6-1.6M7.1 7.1 5.5 5.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  close:
    '<path d="m6.4 6.4 11.2 11.2M17.6 6.4 6.4 17.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  star: '<path d="M12 3.4l2.6 5.3 5.9.85-4.3 4.13 1.02 5.82L12 16.75 6.78 19.5l1.02-5.82L3.5 9.55l5.9-.85Z" fill="currentColor"/>',
  check: '<path d="m5 12.6 4.4 4.3L19 6.8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  share:
    '<circle cx="6" cy="12" r="2.4" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="17.5" cy="5.8" r="2.4" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="17.5" cy="18.2" r="2.4" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="m8.2 10.8 7.1-3.7M8.2 13.2l7.1 3.7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  users:
    '<circle cx="9" cy="8.4" r="3.1" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3.5 19.2a5.5 5.5 0 0 1 11 0M16 5.8a3 3 0 0 1 0 5.7M17.4 14.5a4.6 4.6 0 0 1 3.2 4.4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  sound:
    '<path d="M4.5 9.4h3.1L12 5.7v12.6l-4.4-3.7H4.5Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M15.3 9.1a4 4 0 0 1 0 5.8M17.7 6.7a7.4 7.4 0 0 1 0 10.6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  mute: '<path d="M4.5 9.4h3.1L12 5.7v12.6l-4.4-3.7H4.5Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="m15.4 9.6 4.2 4.8M19.6 9.6l-4.2 4.8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  vibrate:
    '<rect x="8.2" y="3.5" width="7.6" height="17" rx="2.2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M4.6 9v6M2.3 10.5v3M19.4 9v6M21.7 10.5v3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  globe:
    '<circle cx="12" cy="12" r="8.4" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3.6 12h16.8M12 3.6c2.4 2.3 3.6 5.1 3.6 8.4S14.4 18.1 12 20.4C9.6 18.1 8.4 15.3 8.4 12S9.6 5.9 12 3.6Z" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  doc: '<path d="M6.5 3.8h7l4 4v12.4H6.5Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M13.3 3.8v4.2h4.2M9.3 12h5.4M9.3 15.4h5.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  info: '<circle cx="12" cy="12" r="8.4" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 10.6v5.2M12 7.7v.1" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>',
  bolt: '<path d="M13.4 2.8 5.6 13.4h5.2l-1.2 7.8 8-10.7h-5.3Z" fill="currentColor"/>',
  crown:
    '<path d="m3.6 7.4 4.6 3.4L12 5l3.8 5.8 4.6-3.4-1.5 10.2H5.1Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M6.4 18.6h11.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  spark:
    '<path d="M12 3.2c.6 3.8 2 5.2 5.8 5.8-3.8.6-5.2 2-5.8 5.8-.6-3.8-2-5.2-5.8-5.8 3.8-.6 5.2-2 5.8-5.8ZM18.3 14.6c.3 2 1.1 2.8 3.1 3.1-2 .3-2.8 1.1-3.1 3.1-.3-2-1.1-2.8-3.1-3.1 2-.3 2.8-1.1 3.1-3.1Z" fill="currentColor"/>',
  arrow:
    '<path d="M4.5 12h14M13.4 6.6 19 12l-5.6 5.4" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>',
  ad: '<rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M10.2 9.2v5.6L14.8 12Z" fill="currentColor"/>',
  refresh:
    '<path d="M19.4 8.2A8 8 0 1 0 20 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M19.8 3.8v4.8H15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
};

function icon(name: string): string {
  return `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name] ?? ''}</svg>`;
}

export function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? parts[1]?.[0] ?? '' : '';
  return (first + second).toUpperCase() || '?';
}

function bubble(id: number, name: string, extra = ''): string {
  const hue = Math.abs(Math.round(id)) % 360;
  return `<span class="bubble ${extra}" style="--bubble-h:${hue}" aria-hidden="true">${esc(initials(name))}</span>`;
}

function stateCard(label: string, value: string, unit = ''): string {
  return `<div class="stat"><span class="stat-label">${esc(label)}</span><span class="stat-value">${value}${unit ? `<small>${esc(unit)}</small>` : ''}</span></div>`;
}

function switchRow(
  label: string,
  value: boolean,
  action: string,
  iconName: string,
  onText: string,
  offText: string,
): string {
  return `
    <button class="setting-row" type="button" data-action="${action}" role="switch" aria-checked="${value}">
      <span class="setting-icon">${icon(iconName)}</span>
      <span class="setting-label">${esc(label)}</span>
      <span class="switch ${value ? 'is-on' : ''}" aria-hidden="true"><span></span></span>
      <span class="sr-only">${esc(value ? onText : offText)}</span>
    </button>`;
}

function boardRow(row: LeaderboardRow, lang: Lang): string {
  const t = makeT(lang);
  const fmt = (n: number) => formatNumber(lang, n);
  const medal = row.rank <= 3 ? ` rank-${row.rank}` : '';
  return `
    <li class="board-row${row.isMe ? ' is-me' : ''}${medal}">
      <span class="board-rank">${row.rank <= 3 ? icon('crown') : `#${row.rank}`}</span>
      ${bubble(row.id, row.name, 'board-bubble')}
      <span class="board-name">
        <b>${esc(row.name)}</b>
        ${row.username ? `<small>@${esc(row.username)}</small>` : ''}
      </span>
      ${row.isMe ? `<span class="you-pill">${esc(t('board.you'))}</span>` : ''}
      <span class="board-score">${fmt(row.bestScore)}<small>${esc(t('hud.m'))}</small></span>
    </li>`;
}

export class UI {
  readonly root: HTMLElement;
  readonly state: UiState;
  private readonly handlers: UIHandlers;
  private readonly toastEl: HTMLElement | null;
  private toastTimer = 0;
  private focusKey = '';

  constructor(root: HTMLElement, handlers: UIHandlers, initial: UiState) {
    this.root = root;
    this.handlers = handlers;
    this.state = initial;
    this.toastEl = document.getElementById('toast');
    this.root.addEventListener('click', this.onClick);
  }

  private onClick = (event: MouseEvent): void => {
    const el = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-action]');
    if (!el || el.getAttribute('aria-disabled') === 'true' || el.hasAttribute('disabled')) return;
    const action = el.dataset.action ?? '';
    const value = el.dataset.value ?? '';
    event.preventDefault();
    this.dispatch(action, value, el.dataset.currency === 'stars' ? 'stars' : 'coins');
  };

  private dispatch(action: string, value: string, currency: 'coins' | 'stars'): void {
    const h = this.handlers;
    sfx.click();
    switch (action) {
      case 'play':
        h.onPlay();
        break;
      case 'pause':
        h.onPause();
        break;
      case 'resume':
        h.onResume();
        break;
      case 'restart':
        h.onRestart();
        break;
      case 'menu':
        h.onMenu();
        break;
      case 'revive-ad':
        h.onReviveAd();
        break;
      case 'revive-free':
        h.onReviveFree();
        break;
      case 'end-run':
        h.onEndRun();
        break;
      case 'double':
        h.onDouble();
        break;
      case 'challenge':
        h.onChallenge();
        break;
      case 'shop':
        h.onOpenShop();
        break;
      case 'leaders':
        h.onOpenLeaders('global');
        break;
      case 'leaders-squad':
        h.onOpenLeaders('squad');
        break;
      case 'settings':
        h.onOpenSettings();
        break;
      case 'terms':
        h.onOpenTerms();
        break;
      case 'close':
        h.onClose();
        break;
      case 'buy':
        h.onBuy(value, currency);
        break;
      case 'equip':
        h.onEquip(value);
        break;
      case 'shop-tab':
        h.onShopTab(value === 'coins' || value === 'support' ? value : 'skins');
        break;
      case 'board-tab':
        h.onBoardTab(value === 'squad' ? 'squad' : 'global');
        break;
      case 'invite':
        h.onInvite();
        break;
      case 'toggle-sound':
        h.onToggleSound();
        break;
      case 'toggle-haptics':
        h.onToggleHaptics();
        break;
      case 'set-lang':
        h.onSetLang(value === 'en' ? 'en' : 'ru');
        break;
      case 'retry':
        h.onRetry();
        break;
      default:
        break;
    }
  }

  toast(message: string, kind: 'info' | 'success' | 'error' = 'info'): void {
    if (!this.toastEl) return;
    window.clearTimeout(this.toastTimer);
    this.toastEl.textContent = message;
    this.toastEl.dataset.kind = kind;
    this.toastEl.classList.add('is-visible');
    this.toastTimer = window.setTimeout(() => {
      this.toastEl?.classList.remove('is-visible');
    }, 2600);
  }

  setHud(distance: number, coins: number, bump = false): void {
    const distanceEl = document.getElementById('hud-distance');
    const coinsEl = document.getElementById('hud-run-coins');
    if (distanceEl) {
      const formatted = formatNumber(this.state.lang, distance);
      if (distanceEl.textContent !== formatted) distanceEl.textContent = formatted;
    }
    if (coinsEl) {
      const formatted = String(coins);
      if (coinsEl.textContent !== formatted) coinsEl.textContent = formatted;
      if (bump) {
        const parent = coinsEl.parentElement;
        if (parent) {
          parent.classList.remove('bump');
          void parent.offsetWidth;
          parent.classList.add('bump');
        }
      }
    }
  }

  applyBootstrap(data: BootstrapData): void {
    this.state.profile = data.profile;
    this.state.products = data.products;
    this.state.top = data.top;
    this.state.totalPlayers = data.totalPlayers;
    this.state.challengeScore = data.challengeScore;
    this.state.botUsername = data.botUsername;
    this.state.offline = Boolean(data.offline);
    this.state.bootError = null;
  }

  render(): void {
    const scroller = this.root.querySelector<HTMLElement>('.sheet-scroll');
    const scrollTop = scroller?.scrollTop ?? 0;
    const active = document.activeElement as HTMLElement | null;
    const activeDialog = Boolean(active && this.root.contains(active) && active.getAttribute('role') === 'dialog');
    const restore =
      active && active !== document.body && this.root.contains(active) && active.dataset.action
        ? { action: active.dataset.action, value: active.dataset.value, currency: active.dataset.currency }
        : null;
    const parts: string[] = [];

    if (this.state.screen === 'loading') parts.push(this.renderLoading());
    if (this.state.screen === 'menu') parts.push(this.renderMenu());
    if (this.state.screen === 'game') parts.push(this.renderGame());
    if (this.state.overlay === 'pause') parts.push(this.renderPause());
    if (this.state.overlay === 'death') parts.push(this.renderDeath());
    if (this.state.overlay === 'result') parts.push(this.renderResult());

    const modal = this.renderModal();
    if (modal) parts.push(modal);

    this.root.innerHTML = parts.join('');
    const dialogOpen = Boolean(this.state.modal || this.state.overlay);
    this.root.querySelectorAll<HTMLElement>('.screen').forEach((el) => {
      el.toggleAttribute('inert', dialogOpen);
    });
    document.body.dataset.screen = this.state.screen;
    document.documentElement.lang = this.state.lang;
    const t = makeT(this.state.lang);
    const unit = document.getElementById('hud-unit');
    if (unit) unit.textContent = t('hud.m');
    const rotate = document.getElementById('rotate-hint');
    if (rotate) rotate.textContent = t('rotateHint');
    document.getElementById('btn-pause')?.setAttribute('aria-label', t('pause'));
    const hud = document.getElementById('hud');
    if (hud) {
      const live = this.state.screen === 'game' && !this.state.overlay && !this.state.modal;
      hud.toggleAttribute('inert', !live);
      if (live) hud.removeAttribute('aria-hidden');
      else hud.setAttribute('aria-hidden', 'true');
    }
    const nextScroller = this.root.querySelector<HTMLElement>('.sheet-scroll');
    if (nextScroller) nextScroller.scrollTop = scrollTop;
    paintAvatars(this.root);
    this.restoreFocus(restore, activeDialog);
  }

  private restoreFocus(
    restore: { action: string; value?: string; currency?: string } | null,
    keepDialogFocus: boolean,
  ): void {
    const key = `${this.state.screen}:${this.state.overlay ?? ''}:${this.state.modal ?? ''}`;
    const changed = key !== this.focusKey;
    this.focusKey = key;
    if (!changed && !restore && !keepDialogFocus) return;
    let target: HTMLElement | null = null;
    if (restore) {
      target =
        Array.from(this.root.querySelectorAll<HTMLElement>('[data-action]')).find(
          (el) =>
            el.dataset.action === restore.action &&
            (restore.value === undefined || el.dataset.value === restore.value) &&
            (restore.currency === undefined || el.dataset.currency === restore.currency),
        ) ?? null;
    }
    const dialog = this.root.querySelector<HTMLElement>('[role="dialog"]');
    if (dialog) {
      dialog.tabIndex = -1;
      if (!target || !dialog.contains(target)) target = dialog;
    }
    target?.focus({ preventScroll: true });
  }

  private renderLoading(): string {
    const t = makeT(this.state.lang);
    if (this.state.bootError) {
      return `
        <div class="screen screen-loading">
          <div class="loading-card">
            <div class="boot-mark">${icon('spark')}</div>
            <h2>${esc(t('toast.error'))}</h2>
            <p class="muted">${esc(this.state.bootError)}</p>
            <button class="btn btn-primary" type="button" data-action="retry">${icon('refresh')}<span>${esc(t('play'))}</span></button>
          </div>
        </div>`;
    }
    return `
      <div class="screen screen-loading">
        <div class="loading-card">
          <div class="boot-mark is-spinning">${icon('spark')}</div>
          <p class="loading-text">${esc(t('loading'))}</p>
          <span class="loading-bar" aria-hidden="true"><span></span></span>
        </div>
      </div>`;
  }

  private renderMenu(): string {
    const s = this.state;
    const t = makeT(s.lang);
    const profile = s.profile;
    if (!profile) return '';
    const fmt = (n: number) => formatNumber(s.lang, n);
    const world = worldAt(profile.bestScore, s.lang);
    const challenge = s.challengeScore;
    const online = !s.offline;
    const topPreview = s.top
      .filter((row) => !row.isMe && row.bestScore > 0)
      .slice(0, 3);

    return `
      <div class="screen screen-menu">
        <header class="menu-head">
          <div class="user-chip">
            ${bubble(profile.id, profile.name, 'user-bubble')}
            <span class="user-copy">
              <b>${esc(profile.name)}</b>
              ${profile.username ? `<small>@${esc(profile.username)}</small>` : ''}
            </span>
          </div>
          <span class="balance-pill" title="${esc(t('coins'))}">${icon('coin')}<b>${fmt(profile.coins)}</b></span>
        </header>

        <div class="menu-hero">
          <p class="menu-tagline">${esc(t('app.tagline'))}</p>
          <h1 class="wordmark"><span>Kazari</span><b>Jump</b></h1>
          <div class="hero-stage">
            <span class="hero-glow" aria-hidden="true"></span>
            <canvas class="hero-avatar" data-avatar="${esc(profile.activeSkin)}" aria-hidden="true"></canvas>
            <span class="hero-world-mark" aria-hidden="true">${esc(world.glyph)}</span>
          </div>
          <section class="world-card" aria-label="${esc(world.name)}">
            <div class="world-card-copy">
              <span class="world-card-kicker">${esc(t('world.journey'))}</span>
              <strong>${esc(world.name)}</strong>
              <span>${esc(world.subtitle)}</span>
            </div>
            <div class="world-progress" role="progressbar" aria-label="${esc(t('world.progress'))}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(world.progress * 100)}">
              <span style="width:${Math.max(3, Math.round(world.progress * 100))}%"></span>
            </div>
            <div class="world-card-foot">
              <span>${esc(t('world.next', { n: fmt(world.distanceToNext) }))}</span>
              <span>${Math.round(world.progress * 100)}%</span>
            </div>
          </section>
          <nav class="world-route" aria-label="${esc(t('world.route'))}">
            ${WORLD_ATLAS.map((chapter, index) => {
              const reached = index <= world.index;
              const active = index === world.index;
              return `<span class="route-stop ${reached ? 'is-reached' : ''} ${active ? 'is-active' : ''}" title="${esc(chapter.name[s.lang])}">
                <i>${esc(chapter.glyph)}</i><b>${index + 1}</b>
              </span>`;
            }).join('<span class="route-line" aria-hidden="true"></span>')}
          </nav>
          <div class="menu-stats">
            ${stateCard(t('best'), fmt(profile.bestScore), t('hud.m'))}
            ${stateCard(t('coins'), fmt(profile.coins))}
            ${stateCard(t('over.rank'), profile.bestScore > 0 && profile.rank > 0 ? `#${fmt(profile.rank)}` : '—')}
          </div>
        </div>

        ${
          challenge != null && challenge > 0
            ? `<button class="challenge-banner" type="button" data-action="play">
                <span class="challenge-icon">${icon('bolt')}</span>
                <span>${esc(t('challenge.banner', { n: fmt(challenge) }))}</span>
                ${icon('arrow')}
              </button>`
            : ''
        }

        <div class="menu-actions">
          <button class="btn btn-play" type="button" data-action="play">
            ${icon('play')}<span>${esc(t('play'))}</span>
          </button>
          <nav class="menu-nav" aria-label="${esc(t('menu'))}">
            <button class="nav-btn" type="button" data-action="shop">
              ${icon('hanger')}<span>${esc(t('shop'))}</span>
            </button>
            <button class="nav-btn" type="button" data-action="leaders">
              ${icon('trophy')}<span>${esc(t('leaders'))}</span>
            </button>
            <button class="nav-btn" type="button" data-action="settings">
              ${icon('gear')}<span>${esc(t('settings'))}</span>
            </button>
          </nav>
        </div>

        <footer class="menu-foot">
          ${
            topPreview.length
              ? `<div class="top-preview">
                  <span class="top-bubbles">
                    ${topPreview.map((row) => bubble(row.id, row.name, 'mini-bubble')).join('')}
                  </span>
                  <span>${esc(t('board.players', { n: fmt(s.totalPlayers) }))}</span>
                  <button class="link-btn" type="button" data-action="leaders">${esc(t('leaders'))} ${icon('arrow')}</button>
                </div>`
              : `<span class="menu-note">${esc(t('app.name'))}</span>`
          }
          ${
            online
              ? ''
              : `<span class="offline-pill">${icon('info')}${esc(t('settings.offline'))}</span>`
          }
        </footer>
      </div>`;
  }

  private renderGame(): string {
    const t = makeT(this.state.lang);
    return `
      <div class="screen screen-game" aria-hidden="true">
        <div class="tap-hint">
          <span class="tap-ring" aria-hidden="true"></span>
          <span>${esc(t('hint.start'))}</span>
        </div>
      </div>`;
  }

  private renderPause(): string {
    const s = this.state;
    const t = makeT(s.lang);
    const run = s.pauseRun;
    const fmt = (n: number) => formatNumber(s.lang, n);
    return `
      <div class="overlay" role="dialog" aria-modal="true" aria-label="${esc(t('pause'))}">
        <div class="sheet pause-sheet">
          <div class="sheet-grip" aria-hidden="true"></div>
          <p class="eyebrow">${esc(t('pause'))}</p>
          <div class="pause-stats">
            <div class="pause-stat"><b>${fmt(run?.distance ?? 0)}</b><span>${esc(t('over.distance'))}, ${esc(t('hud.m'))}</span></div>
            <div class="pause-stat"><b>${fmt(run?.coins ?? 0)}</b><span>${esc(t('over.runCoins'))}</span></div>
          </div>
          <button class="btn btn-primary" type="button" data-action="resume">${icon('play')}<span>${esc(t('resume'))}</span></button>
          <button class="btn btn-ghost" type="button" data-action="restart">${icon('refresh')}<span>${esc(t('restart'))}</span></button>
          <button class="btn btn-quiet" type="button" data-action="menu">${esc(t('menu'))}</button>
        </div>
      </div>`;
  }

  private renderDeath(): string {
    const s = this.state;
    const t = makeT(s.lang);
    const death = s.death;
    if (!death) return '';
    const fmt = (n: number) => formatNumber(s.lang, n);
    const run = death.run;
    const reviveBtn = death.freeRevive
      ? `<button class="btn btn-primary" type="button" data-action="revive-free">${icon('spark')}<span>${esc(t('over.continueFree'))}</span></button>`
      : death.adAvailable
        ? `<button class="btn btn-primary" type="button" data-action="revive-ad">${icon('ad')}<span>${esc(t('over.continueAd'))}</span></button>`
        : '';

    return `
      <div class="overlay" role="dialog" aria-modal="true" aria-label="${esc(t('over.title'))}">
        <div class="sheet death-sheet">
          <div class="sheet-grip" aria-hidden="true"></div>
          <p class="eyebrow">${esc(t('over.title'))}</p>
          <div class="score-hero">
            <span>${fmt(run.distance)}</span><small>${esc(t('hud.m'))}</small>
          </div>
          <div class="mini-stats">
            <span aria-label="${esc(`${t('over.runCoins')}: ${fmt(run.coins)}`)}">${icon('coin')}${fmt(run.coins)}</span>
            <span aria-label="${esc(`${t('over.best')}: ${fmt(death.best)} ${t('hud.m')}`)}">${icon('trophy')}${fmt(death.best)} ${esc(t('hud.m'))}</span>
          </div>
          ${reviveBtn}
          <button class="btn ${reviveBtn ? 'btn-ghost' : 'btn-primary'}" type="button" data-action="end-run">
            ${icon('check')}<span>${esc(t('over.endRun'))}</span>
          </button>
          ${reviveBtn ? `<p class="fineprint">${esc(t('over.reviveOnce'))}</p>` : ''}
        </div>
      </div>`;
  }

  private renderResult(): string {
    const s = this.state;
    const t = makeT(s.lang);
    const result = s.result;
    const profile = s.profile;
    if (!result) return '';
    const fmt = (n: number) => formatNumber(s.lang, n);
    const run = result.run;
    const submitted = result.submitted;
    const newBest = Boolean(submitted?.newBest);
    const canDouble =
      Boolean(submitted?.runId) && !result.doubled && s.adsAvailable && !result.saving && run.coins > 0;

    return `
      <div class="overlay" role="dialog" aria-modal="true" aria-label="${esc(t('over.title'))}">
        <div class="sheet result-sheet">
          <div class="sheet-grip" aria-hidden="true"></div>
          <p class="eyebrow ${newBest ? 'is-record' : ''}">
            ${newBest ? icon('spark') : ''}
            ${esc(newBest ? t('over.newBest') : t('over.title'))}
          </p>
          <div class="score-hero">
            <span>${fmt(run.distance)}</span><small>${esc(t('hud.m'))}</small>
          </div>

          <div class="result-stats">
            ${stateCard(t('over.runCoins'), fmt(run.coins))}
            ${stateCard(t('over.best'), fmt(profile?.bestScore ?? run.distance), t('hud.m'))}
            ${stateCard(
              t('over.rank'),
              submitted && submitted.rank > 0 ? `#${fmt(submitted.rank)}` : result.saving ? '…' : '—',
            )}
          </div>

          <p class="banked-note">
            ${
              result.saving
                ? `<span class="spinner" aria-hidden="true"></span>${esc(t('toast.updating'))}`
                : result.error
                  ? `<span class="warn">${esc(result.error)}</span>`
                  : submitted
                    ? esc(
                        run.coins > 0
                          ? t('over.banked', { n: fmt(submitted.coinsBanked) })
                          : t('over.noCoins'),
                      )
                    : esc(t('over.saved'))
            }
          </p>

          ${
            result.doubled
              ? `<p class="doubled-note">${icon('star')}${esc(t('over.doubleDone'))} · +${fmt(result.bonus)}</p>`
              : canDouble
                ? `<button class="btn btn-gold" type="button" data-action="double">${icon('ad')}<span>${esc(t('over.double'))}</span></button>`
                : ''
          }

          ${
            result.error
              ? `<button class="btn btn-ghost" type="button" data-action="end-run">${icon('refresh')}<span>${esc(t('restart'))}</span></button>`
              : `<button class="btn btn-ghost" type="button" data-action="challenge">${icon('share')}<span>${esc(t('over.challenge'))}</span></button>`
          }
          ${
            submitted
              ? `<button class="link-btn result-shop" type="button" data-action="shop">${icon('hanger')}${esc(t('over.shop'))} ${icon('arrow')}</button>`
              : ''
          }

          <div class="result-actions">
            <button class="btn btn-primary" type="button" data-action="play">${icon('play')}<span>${esc(t('playAgain'))}</span></button>
            <button class="btn btn-quiet" type="button" data-action="menu">${esc(t('menu'))}</button>
          </div>
        </div>
      </div>`;
  }

  private renderModal(): string {
    const s = this.state;
    if (!s.modal) return '';
    const t = makeT(s.lang);
    const title =
      s.modal === 'shop'
        ? t('shop.title')
        : s.modal === 'leaders'
          ? t('board.title')
          : s.modal === 'settings'
            ? t('settings.title')
            : t('terms.title');
    const body =
      s.modal === 'shop'
        ? this.renderShop()
        : s.modal === 'leaders'
          ? this.renderBoard()
          : s.modal === 'settings'
            ? this.renderSettings()
            : this.renderTerms();

    return `
      <div class="overlay modal-overlay" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <div class="scrim" data-action="close"></div>
        <div class="sheet modal-sheet">
          <div class="sheet-head">
            <div>
              <p class="eyebrow">${esc(t('app.name'))}</p>
              <h2>${esc(title)}</h2>
            </div>
            <button class="icon-btn" type="button" data-action="close" aria-label="${esc(t('close'))}">${icon('close')}</button>
          </div>
          <div class="sheet-scroll">${body}</div>
        </div>
      </div>`;
  }

  private renderShop(): string {
    const s = this.state;
    const t = makeT(s.lang);
    const profile = s.profile;
    if (!profile) return '';
    const fmt = (n: number) => formatNumber(s.lang, n);
    const tab = s.shopTab;
    const tabs: Array<{ id: ShopTab; label: string }> = [
      { id: 'skins', label: t('shop.skins') },
      { id: 'coins', label: t('shop.coins') },
      { id: 'support', label: 'Kazari+' },
    ];

    return `
      <div class="shop-head">
        <div class="tabs" role="tablist">
          ${tabs
            .map(
              (item) => `
                <button class="tab ${tab === item.id ? 'is-active' : ''}" type="button" role="tab"
                  aria-selected="${tab === item.id}" data-action="shop-tab" data-value="${item.id}">
                  ${esc(item.label)}
                </button>`,
            )
            .join('')}
        </div>
        <span class="shop-balance" aria-label="${esc(t('shop.balance', { n: fmt(profile.coins) }))}">${icon('coin')}<b aria-hidden="true">${fmt(profile.coins)}</b></span>
      </div>
      ${tab === 'skins' ? this.renderSkins() : tab === 'coins' ? this.renderCoinPacks() : this.renderSupport()}
    `;
  }

  private renderSkins(): string {
    const s = this.state;
    const profile = s.profile;
    if (!profile) return '';
    const skinProducts = s.products.filter((product) => product.kind === 'skin');
    const cards: string[] = [
      this.renderSkinCard(
        {
          id: 'skin_classic',
          kind: 'skin',
          skinId: 'classic',
          title: { ru: 'Классика', en: 'Classic' },
          description: { ru: 'Тот самый кот, с которого всё началось.', en: 'The cat that started it all.' },
        },
        true,
      ),
      ...skinProducts.map((product) => this.renderSkinCard(product, false)),
    ];
    if (profile.supporter) {
      const supporter = s.products.find((product) => product.id === 'supporter');
      if (supporter) cards.push(this.renderSkinCard(supporter, false));
    }
    return `<div class="skin-grid">${cards.join('')}</div>`;
  }

  private renderSkinCard(product: Product, free: boolean): string {
    const s = this.state;
    const t = makeT(s.lang);
    const profile = s.profile;
    if (!profile) return '';
    const fmt = (n: number) => formatNumber(s.lang, n);
    const skinId = product.skinId ?? 'classic';
    const owned = free || profile.ownedSkins.includes(skinId);
    const equipped = profile.activeSkin === skinId;
    const pending = s.pendingProduct === product.id;
    const skin = skinVisual(skinId);
    const rarity = product.priceCoins ? (product.priceCoins >= 1400 ? 'epic' : product.priceCoins >= 600 ? 'rare' : 'common') : 'premium';

    let actions = '';
    if (equipped) {
      actions = `<span class="equipped-pill">${icon('check')}${esc(t('shop.equipped'))}</span>`;
    } else if (owned) {
      actions = `<button class="btn btn-small btn-ghost" type="button" data-action="equip" data-value="${esc(skinId)}"
        aria-label="${esc(`${t('shop.equip')}: ${productTitle(product, s.lang)}`)}">${esc(t('shop.equip'))}</button>`;
    } else {
      const coinBtn = product.priceCoins
        ? `<button class="btn btn-small btn-coin" type="button" data-action="buy" data-currency="coins" data-value="${esc(product.id)}"
             ${pending ? 'disabled' : ''} aria-disabled="${pending}"
             aria-label="${esc(`${productTitle(product, s.lang)} — ${t('shop.buyWithCoins', { n: fmt(product.priceCoins) })}`)}">
             ${icon('coin')}<span>${fmt(product.priceCoins)}</span>
           </button>`
        : '';
      const starBtn = product.priceStars
        ? `<button class="btn btn-small btn-star" type="button" data-action="buy" data-currency="stars" data-value="${esc(product.id)}"
             ${pending ? 'disabled' : ''} aria-disabled="${pending}"
             aria-label="${esc(`${productTitle(product, s.lang)} — ${t('shop.buyWithStars', { n: fmt(product.priceStars) })}`)}">
             ${icon('star')}<span>${fmt(product.priceStars)}</span>
           </button>`
        : '';
      actions = `<div class="buy-row">${coinBtn}${starBtn}</div>`;
    }

    return `
      <article class="skin-card ${equipped ? 'is-equipped' : ''}" data-rarity="${rarity}">
        <div class="skin-art" style="--skin-accent:${skin.accent}">
          <span class="skin-aura" aria-hidden="true"></span>
          <canvas data-avatar="${esc(skinId)}" aria-hidden="true"></canvas>
        </div>
        <div class="skin-copy">
          <h3>${esc(productTitle(product, s.lang))}</h3>
          <p>${esc(productDescription(product, s.lang))}</p>
        </div>
        <div class="skin-actions">${actions}</div>
      </article>`;
  }

  private renderCoinPacks(): string {
    const s = this.state;
    const t = makeT(s.lang);
    const fmt = (n: number) => formatNumber(s.lang, n);
    const packs = s.products.filter((product) => product.kind === 'coins');
    const pending = s.pendingProduct;
    return `
      <div class="coin-grid">
        ${packs
          .map(
            (product) => `
            <article class="coin-card">
              <div class="coin-art" aria-hidden="true">
                <span class="coin-stack">${icon('coin')}</span>
                <b>${fmt(product.amount ?? 0)}</b>
              </div>
              <div class="coin-copy">
                <h3>${esc(productTitle(product, s.lang))}</h3>
                <p>${esc(productDescription(product, s.lang))}</p>
              </div>
              <button class="btn btn-small btn-star" type="button" data-action="buy" data-currency="stars" data-value="${esc(product.id)}"
                ${pending === product.id ? 'disabled' : ''} aria-disabled="${pending === product.id}"
                aria-label="${esc(`${productTitle(product, s.lang)} — ${t('shop.buyWithStars', { n: fmt(product.priceStars ?? 0) })}`)}">
                ${icon('star')}<span>${fmt(product.priceStars ?? 0)}</span>
              </button>
            </article>`,
          )
          .join('')}
      </div>
      <p class="fineprint center">${esc(t('shop.starsOnlyTelegram'))}</p>`;
  }

  private renderSupport(): string {
    const s = this.state;
    const t = makeT(s.lang);
    const profile = s.profile;
    if (!profile) return '';
    const fmt = (n: number) => formatNumber(s.lang, n);
    const supporter = s.products.find((product) => product.id === 'supporter');
    if (!supporter) return '';
    const pending = s.pendingProduct === supporter.id;
    if (profile.supporter) {
      return `
        <div class="support-card is-active">
          <span class="support-glow" aria-hidden="true"></span>
          <div class="support-crown">${icon('crown')}</div>
          <h3>${esc(productTitle(supporter, s.lang))}</h3>
          <p class="supporter-badge">${icon('check')}${esc(t('shop.supporterActive'))}</p>
          <p>${esc(productDescription(supporter, s.lang))}</p>
          <div class="support-art"><canvas data-avatar="supporter" aria-hidden="true"></canvas></div>
        </div>`;
    }
    return `
      <div class="support-card">
        <span class="support-glow" aria-hidden="true"></span>
        <div class="support-crown">${icon('crown')}</div>
        <h3>${esc(productTitle(supporter, s.lang))}</h3>
        <p>${esc(productDescription(supporter, s.lang))}</p>
        <div class="support-art"><canvas data-avatar="supporter" aria-hidden="true"></canvas></div>
        <ul class="perk-list">
          <li>${icon('check')}${esc(t('over.continueFree'))}</li>
          <li>${icon('check')}${esc(s.lang === 'ru' ? 'Золотая корона и аура' : 'Golden crown and aura')}</li>
          <li>${icon('check')}${esc(s.lang === 'ru' ? 'Поддержка разработки' : 'Support development')}</li>
        </ul>
        <button class="btn btn-star btn-wide" type="button" data-action="buy" data-currency="stars" data-value="${esc(supporter.id)}"
          ${pending ? 'disabled' : ''} aria-disabled="${pending}"
          aria-label="${esc(`${productTitle(supporter, s.lang)} — ${t('shop.buyWithStars', { n: fmt(supporter.priceStars ?? 0) })}`)}">
          ${icon('star')}<span>${fmt(supporter.priceStars ?? 0)}</span>
        </button>
      </div>`;
  }

  private renderBoard(): string {
    const s = this.state;
    const t = makeT(s.lang);
    const board = s.board;
    const fmt = (n: number) => formatNumber(s.lang, n);
    const data = board.data;
    const profile = s.profile;

    let body = '';
    if (board.loading) {
      body = `<div class="board-state"><span class="spinner"></span><span>${esc(t('board.loading'))}</span></div>`;
    } else if (board.error) {
      body = `<div class="board-state"><p class="warn">${esc(board.error)}</p>
        <button class="btn btn-small btn-ghost" type="button" data-action="retry">${icon('refresh')}<span>${esc(t('play'))}</span></button>
      </div>`;
    } else if (!data || data.rows.length === 0) {
      body = `<div class="board-state">
        <span class="empty-icon">${icon('trophy')}</span>
        <p>${esc(board.scope === 'squad' ? t('board.emptySquad') : t('board.empty'))}</p>
      </div>`;
    } else {
      const rows = data.rows.map((row) => boardRow(row, s.lang));
      const hasMe = data.rows.some((row) => row.isMe || (profile && row.id === profile.id));
      if (!hasMe && profile) {
        rows.push(
          boardRow(
            {
              id: profile.id,
              name: profile.name,
              username: profile.username,
              photoUrl: profile.photoUrl,
              bestScore: profile.bestScore,
              rank: profile.rank || data.rows.length + 1,
              isMe: true,
            },
            s.lang,
          ),
        );
      }
      body = `<ol class="board-list">${rows.join('')}</ol>`;
    }

    return `
      <div class="tabs tabs-wide" role="tablist">
        <button class="tab ${board.scope === 'global' ? 'is-active' : ''}" type="button" role="tab"
          aria-selected="${board.scope === 'global'}" data-action="board-tab" data-value="global">${esc(t('board.global'))}</button>
        <button class="tab ${board.scope === 'squad' ? 'is-active' : ''}" type="button" role="tab"
          aria-selected="${board.scope === 'squad'}" data-action="board-tab" data-value="squad">${esc(t('board.squad'))}</button>
      </div>
      ${body}
      ${
        board.scope === 'squad'
          ? `<div class="board-footer">
              <p class="fineprint">${esc(t('board.squadHint'))}</p>
              <button class="btn btn-primary" type="button" data-action="invite">${icon('users')}<span>${esc(t('board.invite'))}</span></button>
            </div>`
          : data
            ? `<p class="board-total">${esc(t('board.players', { n: fmt(data.total) }))}</p>`
            : ''
      }`;
  }

  private renderSettings(): string {
    const s = this.state;
    const t = makeT(s.lang);
    return `
      <div class="setting-list">
        <div class="setting-row is-static">
          <span class="setting-icon">${icon('globe')}</span>
          <span class="setting-label">${esc(t('language'))}</span>
          <div class="seg" role="group" aria-label="${esc(t('language'))}">
            <button class="seg-btn ${s.lang === 'ru' ? 'is-active' : ''}" type="button" data-action="set-lang" data-value="ru" aria-pressed="${s.lang === 'ru'}">RU</button>
            <button class="seg-btn ${s.lang === 'en' ? 'is-active' : ''}" type="button" data-action="set-lang" data-value="en" aria-pressed="${s.lang === 'en'}">EN</button>
          </div>
        </div>
        ${switchRow(t('sound'), s.sound, 'toggle-sound', s.sound ? 'sound' : 'mute', t('on'), t('off'))}
        ${switchRow(t('haptics'), s.haptics, 'toggle-haptics', 'vibrate', t('on'), t('off'))}
      </div>

      <div class="panel">
        <h3>${icon('info')}${esc(t('settings.howto'))}</h3>
        <p>${esc(t('settings.howtoText'))}</p>
      </div>

      <div class="setting-list">
        <button class="setting-row" type="button" data-action="terms">
          <span class="setting-icon">${icon('doc')}</span>
          <span class="setting-label">${esc(t('settings.terms'))}</span>
          ${icon('arrow')}
        </button>
      </div>

      <footer class="settings-foot">
        <span>${esc(t('settings.version', { v: APP_VERSION }))}</span>
        ${s.offline ? `<span class="offline-pill">${icon('info')}${esc(t('settings.offline'))}</span>` : ''}
      </footer>`;
  }

  private renderTerms(): string {
    const s = this.state;
    const t = makeT(s.lang);
    return `
      <div class="panel terms-panel">
        <p>${esc(t('terms.text'))}</p>
      </div>
      <button class="btn btn-primary btn-wide" type="button" data-action="close">${esc(t('close'))}</button>`;
  }
}

export function createUiState(lang: Lang): UiState {
  return {
    lang,
    screen: 'loading',
    overlay: null,
    modal: null,
    profile: null,
    products: [],
    top: [],
    totalPlayers: 0,
    challengeScore: null,
    botUsername: null,
    offline: false,
    adsAvailable: false,
    pendingProduct: null,
    shopTab: 'skins',
    board: { scope: 'global', loading: false, data: null, error: null },
    sound: true,
    haptics: true,
    death: null,
    result: null,
    pauseRun: null,
    bootError: null,
  };
}
