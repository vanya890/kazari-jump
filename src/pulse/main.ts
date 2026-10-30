import './style.css';
import { PulseGame } from './game';
import { DRONES, THEMES } from './catalog';

type Lang = 'ru' | 'en';

const tg = window.Telegram?.WebApp;
const lang: Lang = ((tg?.initDataUnsafe?.user?.language_code ?? navigator.language).startsWith('ru') ? 'ru' : 'en');
const copy = {
  ru: {
    title: 'Pulse Drift',
    subtitle: 'Поймай сигнал. Не дай ритму сорваться.',
    best: 'Личный рекорд',
    start: 'Войти в поток',
    shop: 'Ангар дронов',
    themes: 'Темы',
    hint: 'Тапни или нажми пробел, чтобы подняться',
    score: 'ворот',
    combo: 'серия',
    gameOver: 'Сигнал потерян',
    scoreLabel: 'Пройдено ворот',
    bestLabel: 'Лучший результат',
    retry: 'Новый заход',
    share: 'Бросить вызов',
    menu: 'В меню',
    paused: 'Поток остановлен',
    continue: 'Продолжить',
    pause: 'Пауза',
    ready: 'Готов?',
    perfect: 'ИДЕАЛЬНО',
    clean: 'ЧИСТО',
    challenge: 'Побей мой сигнал: {score} ворот в Pulse Drift!',
    newBest: 'Новый рекорд',
    buy: 'Выбрать',
    selected: 'Активен',
    credits: 'Кредиты',
  },
  en: {
    title: 'Pulse Drift',
    subtitle: 'Catch the signal. Keep the rhythm alive.',
    best: 'Personal best',
    start: 'Enter the flow',
    shop: 'Drone Hangar',
    themes: 'Themes',
    hint: 'Tap or press space to rise',
    score: 'gates',
    combo: 'streak',
    gameOver: 'Signal lost',
    scoreLabel: 'Gates cleared',
    bestLabel: 'Best run',
    retry: 'Run it back',
    share: 'Challenge a friend',
    menu: 'Back to menu',
    paused: 'Flow paused',
    continue: 'Continue',
    pause: 'Pause',
    ready: 'Ready?',
    perfect: 'PERFECT',
    clean: 'CLEAN',
    challenge: 'Beat my signal: {score} gates in Pulse Drift!',
    newBest: 'New personal best',
    buy: 'Select',
    selected: 'Equipped',
    credits: 'Credits',
  },
}[lang];

const root = document.getElementById('app');
if (!root) throw new Error('Pulse Drift root is missing');

root.innerHTML = `
  <main class="pulse-app" data-state="menu">
    <canvas id="pulse-canvas" aria-label="Pulse Drift game"></canvas>
    <div class="grain" aria-hidden="true"></div>
    <header class="pulse-hud" aria-live="polite">
      <div class="hud-score"><strong id="pulse-score">0</strong><span>${copy.score}</span></div>
      <div class="hud-combo" id="pulse-combo" hidden><span class="combo-dot"></span><strong id="pulse-combo-value">0</strong><span>${copy.combo}</span></div>
      <button class="pulse-icon" id="pulse-pause" type="button" aria-label="${copy.pause}" hidden>Ⅱ</button>
    </header>
    <section class="pulse-menu" id="pulse-menu">
      <div class="signal-lockup">
        <div class="signal-orbit orbit-one"></div><div class="signal-orbit orbit-two"></div>
        <div class="signal-core"><span id="core-dot"></span></div>
      </div>
      <p class="pulse-kicker">KAZARI / NEURAL NET 02</p>
      <h1>${copy.title}</h1>
      <p class="pulse-subtitle">${copy.subtitle}</p>
      <div class="menu-best"><span>${copy.best}</span><strong id="pulse-best">0</strong></div>
      <div class="menu-row">
        <button class="pulse-button pulse-primary" id="pulse-start" type="button"><span>${copy.start}</span><b>↗</b></button>
      </div>
      <div class="menu-nav-row">
        <button class="sub-button" id="open-shop" type="button">${copy.shop}</button>
        <button class="sub-button" id="open-themes" type="button">${copy.themes}</button>
      </div>
      <p class="pulse-hint">${copy.hint}</p>
    </section>

    <div class="modal-overlay" id="modal-shop" hidden>
      <div class="modal-card">
        <h2>${copy.shop}</h2>
        <div class="drone-grid" id="drone-list"></div>
        <button class="pulse-button pulse-secondary" id="close-shop" type="button"><span>${copy.menu}</span><b>✕</b></button>
      </div>
    </div>

    <div class="modal-overlay" id="modal-themes" hidden>
      <div class="modal-card">
        <h2>${copy.themes}</h2>
        <div class="theme-grid" id="theme-list"></div>
        <button class="pulse-button pulse-secondary" id="close-themes" type="button"><span>${copy.menu}</span><b>✕</b></button>
      </div>
    </div>

    <section class="pulse-overlay" id="pulse-overlay" hidden>
      <div class="result-card" id="pulse-result">
        <p class="pulse-kicker" id="result-kicker">${copy.gameOver}</p>
        <h2>${copy.gameOver}</h2>
        <div class="result-score"><strong id="result-score">0</strong><span>${copy.score}</span></div>
        <p class="new-best" id="result-best" hidden>${copy.newBest}</p>
        <div class="result-stats"><div><span>${copy.scoreLabel}</span><strong id="result-gates">0</strong></div><div><span>${copy.bestLabel}</span><strong id="result-high">0</strong></div></div>
        <button class="pulse-button pulse-primary" id="pulse-retry" type="button"><span>${copy.retry}</span><b>↗</b></button>
        <button class="pulse-button pulse-secondary" id="pulse-share" type="button"><span>${copy.share}</span><b>⌁</b></button>
        <button class="text-button" id="pulse-menu-button" type="button">${copy.menu}</button>
      </div>
    </section>
    <section class="pause-overlay" id="pulse-pause-overlay" hidden>
      <div class="pause-card"><p class="pulse-kicker">${copy.title}</p><h2>${copy.paused}</h2><button class="pulse-button pulse-primary" id="pulse-continue" type="button"><span>${copy.continue}</span><b>↗</b></button><button class="text-button" id="pulse-pause-menu" type="button">${copy.menu}</button></div>
    </section>
    <div class="pulse-toast" id="pulse-toast" role="status" aria-live="polite"></div>
  </main>`;

tg?.ready?.();
tg?.expand?.();

document.documentElement.style.setProperty('--pulse-safe-top', `${tg?.safeAreaInset?.top ?? 0}px`);
document.documentElement.style.setProperty('--pulse-safe-bottom', `${tg?.safeAreaInset?.bottom ?? 0}px`);

const canvas = document.getElementById('pulse-canvas') as HTMLCanvasElement;
const app = document.querySelector<HTMLElement>('.pulse-app');
const menu = document.getElementById('pulse-menu');
const overlay = document.getElementById('pulse-overlay');
const pauseOverlay = document.getElementById('pulse-pause-overlay');
const score = document.getElementById('pulse-score');
const best = document.getElementById('pulse-best');
const combo = document.getElementById('pulse-combo');
const comboValue = document.getElementById('pulse-combo-value');
const pauseButton = document.getElementById('pulse-pause') as HTMLButtonElement;
const resultScore = document.getElementById('result-score');
const resultGates = document.getElementById('result-gates');
const resultHigh = document.getElementById('result-high');
const resultBest = document.getElementById('result-best');
const toast = document.getElementById('pulse-toast');
const coreDot = document.getElementById('core-dot') as HTMLElement;

const STORAGE_KEY = 'kazari.pulse.best.v2';
const DRONE_KEY = 'kazari.pulse.drone.v1';
const THEME_KEY = 'kazari.pulse.theme.v1';

let highScore = Number(localStorage.getItem(STORAGE_KEY) ?? 0) || 0;
let activeDroneId = localStorage.getItem(DRONE_KEY) || 'phantom';
let activeThemeId = localStorage.getItem(THEME_KEY) || 'synth';

if (best) best.textContent = String(highScore);

function applyTheme(themeId: string): void {
  activeThemeId = themeId;
  localStorage.setItem(THEME_KEY, themeId);
  const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];
  document.documentElement.style.setProperty('--pulse-bg1', theme.bg1);
  document.documentElement.style.setProperty('--pulse-bg2', theme.bg2);
  document.documentElement.style.setProperty('--pulse-cyan', theme.cyan);
  document.documentElement.style.setProperty('--pulse-coral', theme.coral);
  document.documentElement.style.setProperty('--pulse-yellow', theme.yellow);
}

function applyDrone(droneId: string): void {
  activeDroneId = droneId;
  localStorage.setItem(DRONE_KEY, droneId);
  const drone = DRONES.find((d) => d.id === droneId) || DRONES[0];
  if (coreDot) coreDot.style.background = drone.color;
  game.setDrone(drone);
}

applyTheme(activeThemeId);
applyDrone(activeDroneId);

const audio = new (class PulseAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private enabled = true;

  private ensure(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.context) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.context = new Ctor();
      this.master = this.context.createGain();
      this.master.gain.value = 0.32;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') void this.context.resume();
    return this.context;
  }

  tone(frequency: number, duration = 0.1, type: OscillatorType = 'sine', delay = 0): void {
    const context = this.ensure();
    if (!context || !this.master) return;
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(0.15, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    oscillator.connect(gain).connect(this.master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  pulse(): void { this.tone(280, 0.09, 'triangle'); }
  gate(): void { this.tone(520, 0.12, 'sine'); this.tone(780, 0.18, 'sine', 0.045); }
  fail(): void { this.tone(190, 0.35, 'sawtooth'); }
  click(): void { this.tone(420, 0.06, 'square'); }
})();

const game = new PulseGame(canvas, {
  onScore: (value, streak) => {
    if (score) score.textContent = String(value);
    if (combo && comboValue) {
      combo.hidden = streak < 2;
      comboValue.textContent = String(streak);
    }
    audio.gate();
    if (streak >= 3) showToast(streak % 5 === 0 ? copy.perfect : copy.clean);
  },
  onPulse: () => audio.pulse(),
  onEnd: (value, streak) => finish(value, streak),
});

function showToast(message: string): void {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove('is-visible');
  void toast.offsetWidth;
  toast.classList.add('is-visible');
}

function setState(value: 'menu' | 'running' | 'result' | 'paused'): void {
  app?.setAttribute('data-state', value);
  if (menu) menu.hidden = value !== 'menu';
  if (overlay) overlay.hidden = value !== 'result';
  if (pauseOverlay) pauseOverlay.hidden = value !== 'paused';
  if (pauseButton) pauseButton.hidden = value !== 'running';
}

function start(): void {
  audio.click();
  setState('running');
  game.start();
}

function finish(value: number, streak: number): void {
  audio.fail();
  const isNewBest = value > highScore;
  highScore = Math.max(highScore, value);
  localStorage.setItem(STORAGE_KEY, String(highScore));
  if (score) score.textContent = String(value);
  if (combo && comboValue) { combo.hidden = streak < 2; comboValue.textContent = String(streak); }
  if (resultScore) resultScore.textContent = String(value);
  if (resultGates) resultGates.textContent = String(value);
  if (resultHigh) resultHigh.textContent = String(highScore);
  resultBest?.toggleAttribute('hidden', !isNewBest);
  setState('result');
}

function goMenu(): void {
  game.reset();
  if (score) score.textContent = '0';
  if (combo) combo.hidden = true;
  setState('menu');
}

function togglePause(): void {
  if (game.isPaused) {
    game.resume();
    setState('running');
  } else {
    game.pause();
    setState('paused');
  }
}

function share(): void {
  const value = game.score;
  const text = copy.challenge.replace('{score}', String(value));
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`;
  if (tg?.openTelegramLink) tg.openTelegramLink(shareUrl);
  else if (navigator.share) void navigator.share({ title: copy.title, text, url: window.location.href });
  else {
    void navigator.clipboard?.writeText(`${text} ${window.location.href}`);
    showToast(lang === 'ru' ? 'Вызов скопирован' : 'Challenge copied');
  }
}

function renderShop(): void {
  const list = document.getElementById('drone-list');
  if (!list) return;
  list.innerHTML = DRONES.map((drone) => {
    const active = drone.id === activeDroneId;
    return `
      <div class="catalog-item ${active ? 'is-active' : ''}">
        <span class="drone-preview" style="background:${drone.color}; box-shadow:0 0 16px ${drone.glow}"></span>
        <div class="catalog-info">
          <h3>${drone.name}</h3>
          <p>${drone.description}</p>
          <small class="perk">${drone.perk}</small>
        </div>
        <button class="pulse-button ${active ? 'pulse-secondary' : 'pulse-primary'}" type="button" data-drone="${drone.id}">
          <span>${active ? copy.selected : copy.buy}</span>
        </button>
      </div>`;
  }).join('');
}

function renderThemes(): void {
  const list = document.getElementById('theme-list');
  if (!list) return;
  list.innerHTML = THEMES.map((theme) => {
    const active = theme.id === activeThemeId;
    return `
      <div class="catalog-item ${active ? 'is-active' : ''}">
        <span class="theme-preview" style="background:linear-gradient(135deg, ${theme.bg1}, ${theme.cyan});"></span>
        <div class="catalog-info">
          <h3>${theme.name}</h3>
          <small class="perk">Кибернетическая палитра</small>
        </div>
        <button class="pulse-button ${active ? 'pulse-secondary' : 'pulse-primary'}" type="button" data-theme="${theme.id}">
          <span>${active ? copy.selected : copy.buy}</span>
        </button>
      </div>`;
  }).join('');
}

document.getElementById('pulse-start')?.addEventListener('click', start);
document.getElementById('pulse-retry')?.addEventListener('click', start);
document.getElementById('pulse-share')?.addEventListener('click', share);
document.getElementById('pulse-menu-button')?.addEventListener('click', goMenu);
document.getElementById('pulse-continue')?.addEventListener('click', togglePause);
document.getElementById('pulse-pause-menu')?.addEventListener('click', goMenu);
pauseButton.addEventListener('click', togglePause);

document.getElementById('open-shop')?.addEventListener('click', () => {
  renderShop();
  document.getElementById('modal-shop')?.removeAttribute('hidden');
});
document.getElementById('close-shop')?.addEventListener('click', () => {
  document.getElementById('modal-shop')?.setAttribute('hidden', '');
});
document.getElementById('open-themes')?.addEventListener('click', () => {
  renderThemes();
  document.getElementById('modal-themes')?.removeAttribute('hidden');
});
document.getElementById('close-themes')?.addEventListener('click', () => {
  document.getElementById('modal-themes')?.setAttribute('hidden', '');
});

document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement | null;
  const droneBtn = target?.closest('[data-drone]');
  if (droneBtn) {
    const id = (droneBtn as HTMLElement).dataset.drone;
    if (id) {
      applyDrone(id);
      renderShop();
      showToast(lang === 'ru' ? 'Дрон активирован' : 'Drone equipped');
    }
  }
  const themeBtn = target?.closest('[data-theme]');
  if (themeBtn) {
    const id = (themeBtn as HTMLElement).dataset.theme;
    if (id) {
      applyTheme(id);
      renderThemes();
      showToast(lang === 'ru' ? 'Тема применена' : 'Theme applied');
    }
  }
});

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space' || event.code === 'ArrowUp') {
    event.preventDefault();
    if (event.code === 'Space' && app?.dataset.state === 'paused') togglePause();
    else if (app?.dataset.state === 'menu' || app?.dataset.state === 'result') start();
    else if (app?.dataset.state === 'running') game.pulse();
  }
  if (event.code === 'Escape' && app?.dataset.state === 'running') togglePause();
});

canvas.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  if (app?.dataset.state === 'running') game.pulse();
});

window.addEventListener('resize', () => game.resize());
game.resize();
