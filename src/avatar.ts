import type { GameState } from './game/types';
import { drawPlayer } from './game/player';
import { paletteFor } from './game/render';

export function paintAvatar(canvas: HTMLCanvasElement, skinId: string): void {
  const rect = canvas.getBoundingClientRect();
  const size = Math.min(rect.width || canvas.clientWidth || 140, rect.height || canvas.clientHeight || 140);
  if (size < 8) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  canvas.width = Math.round(size * dpr);
  canvas.height = Math.round(size * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);

  const now = performance.now();
  const height = size * 0.6;
  const unit = height / 74;
  const state: GameState = {
    w: size,
    h: size,
    dpr,
    unit,
    fieldX: 0,
    fieldW: size,
    groundY: size * 0.92,
    phase: 'idle',
    player: {
      x: size / 2,
      y: size * 0.92,
      w: height * 0.9,
      h: height,
      vy: 0,
      onGround: true,
      squashX: 1,
      squashY: 1,
      legPhase: 0,
      blinkAt: now + 5000,
      tilt: 0,
      idlePhase: now * 0.0011,
    },
    obstacles: [],
    coins: [],
    particles: [],
    floaters: [],
    clouds: [],
    distancePx: 0,
    distanceM: 0,
    worldIndex: 0,
    runCoins: 0,
    speedPx: 0,
    elapsedMs: 0,
    now,
    shake: 0,
    flash: 0,
    deathAge: 0,
    invulnUntil: 0,
    revived: false,
    skinId,
    slowMoT: 1,
  };
  drawPlayer(ctx, state, paletteFor(0));
}

export function paintAvatars(root: ParentNode): void {
  root.querySelectorAll<HTMLCanvasElement>('canvas[data-avatar]').forEach((canvas) => {
    const skin = canvas.dataset.avatar;
    if (skin) paintAvatar(canvas, skin);
  });
}
