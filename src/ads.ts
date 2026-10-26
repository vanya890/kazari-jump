import type { Lang } from './types';

interface AdsgramController {
  show(): Promise<unknown>;
}

interface AdsgramSdk {
  init(options: { blockId: string }): AdsgramController;
}

declare global {
  interface Window {
    Adsgram?: AdsgramSdk;
  }
}

function envValue(key: string): string {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | boolean> }).env ?? {};
  const value = env[key];
  return typeof value === 'string' ? value.trim() : '';
}

const BLOCK_ID = envValue('VITE_ADSGRAM_BLOCK_ID');
let controller: AdsgramController | null = null;
let loading: Promise<boolean> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('AD_SDK_FAILED'));
    document.head.appendChild(script);
  });
}

async function ensureController(): Promise<AdsgramController | null> {
  if (!BLOCK_ID) return null;
  if (controller) return controller;
  if (!loading) {
    loading = (async () => {
      try {
        if (!window.Adsgram) await loadScript(`https://sdk.adsgram.ai/js/sdk-a${BLOCK_ID}.js`);
        if (!window.Adsgram) return false;
        controller = window.Adsgram.init({ blockId: BLOCK_ID });
        return true;
      } catch {
        return false;
      }
    })();
  }
  return (await loading) ? controller : null;
}

class Ads {
  /** Real provider in production; a clearly-labelled demo in local dev. */
  readonly demo = !BLOCK_ID && (import.meta.env.DEV || !window.Telegram?.WebApp?.initData);

  get available(): boolean {
    return Boolean(BLOCK_ID) || this.demo;
  }

  async showRewarded(lang: Lang): Promise<boolean> {
    if (BLOCK_ID) {
      const ctrl = await ensureController();
      if (!ctrl) return false;
      try {
        const result = await ctrl.show();
        return result !== false;
      } catch {
        return false;
      }
    }
    if (this.demo) return demoAd(lang);
    return false;
  }
}

function demoAd(lang: Lang): Promise<boolean> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'ad-overlay';
    let left = 3;
    const label = lang === 'ru' ? 'Демо-реклама' : 'Demo ad';
    const reward = lang === 'ru' ? 'Награда через' : 'Reward in';
    const skip = lang === 'ru' ? 'Подождите…' : 'Please wait…';
    overlay.innerHTML = `
      <div class="ad-card">
        <div class="ad-brand">KAZARI JUMP</div>
        <div class="ad-art" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
        <div class="ad-label">${label}</div>
        <div class="ad-counter">${reward} <b>3</b></div>
        <button class="ad-skip" type="button" disabled>${skip}</button>
      </div>`;
    document.body.appendChild(overlay);
    const counter = overlay.querySelector('.ad-counter b');
    const skipBtn = overlay.querySelector<HTMLButtonElement>('.ad-skip');
    const tick = window.setInterval(() => {
      left -= 1;
      if (counter) counter.textContent = String(Math.max(0, left));
      if (left <= 0) {
        window.clearInterval(tick);
        if (skipBtn) {
          skipBtn.disabled = false;
          skipBtn.textContent = lang === 'ru' ? 'Забрать награду' : 'Claim reward';
        }
      }
    }, 1000);
    skipBtn?.addEventListener('click', () => {
      window.clearInterval(tick);
      overlay.classList.add('closing');
      window.setTimeout(() => overlay.remove(), 180);
      resolve(true);
    });
  });
}

export const ads = new Ads();
