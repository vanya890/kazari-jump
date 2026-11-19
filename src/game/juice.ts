import type { GameState } from './types';
import { worldAt } from './worlds';
import { skinVisual } from '../data/catalog';

interface Mote {
  x: number;
  y: number;
  size: number;
  speed: number;
  phase: number;
  alpha: number;
}

const MOTES: Mote[] = Array.from({ length: 18 }, (_, index) => ({
  x: ((Math.sin(index * 91.7) + 1) * 0.5),
  y: 0.12 + ((Math.cos(index * 43.1) + 1) * 0.34),
  size: 1.2 + ((index * 7) % 4) * 0.55,
  speed: 0.12 + ((index * 13) % 7) * 0.035,
  phase: index * 1.71,
  alpha: 0.18 + ((index * 11) % 5) * 0.045,
}));

function wrap(value: number, range: number): number {
  return ((value % range) + range) % range;
}

function drawAmbient(ctx: CanvasRenderingContext2D, s: GameState): void {
  const world = worldAt(s.distanceM).index;
  const colors = ['#ffd78b', '#ff9fbe', '#bceeff', '#ffc27d'];
  const color = colors[world] ?? colors[0]!;
  const count = s.quality === 'lite' ? 7 : MOTES.length;
  const u = s.unit;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < count; i += 1) {
    const mote = MOTES[i]!;
    const range = s.w + 48 * u;
    const x = wrap(mote.x * range - s.distancePx * mote.speed * 0.11 + s.now * mote.speed * 0.018, range) - 24 * u;
    const y = mote.y * s.groundY + Math.sin(s.now * 0.0007 + mote.phase) * 7 * u;
    const pulse = 0.68 + Math.sin(s.now * 0.0015 + mote.phase) * 0.32;
    ctx.globalAlpha = mote.alpha * pulse;
    ctx.fillStyle = color;

    if (world === 1) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(s.now * 0.0006 + mote.phase) * 0.8);
      ctx.beginPath();
      ctx.ellipse(0, 0, mote.size * 1.5 * u, mote.size * 0.72 * u, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (world === 2) {
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(0.8, 1.1 * u);
      ctx.beginPath();
      ctx.moveTo(x - mote.size * u, y);
      ctx.lineTo(x + mote.size * u, y);
      ctx.moveTo(x, y - mote.size * u);
      ctx.lineTo(x, y + mote.size * u);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, mote.size * u, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawPlayerTrail(ctx: CanvasRenderingContext2D, s: GameState): void {
  const p = s.player;
  const air = Math.max(0, s.groundY - p.y);
  if (s.phase !== 'running' || air < 10 * s.unit) return;

  const u = s.unit;
  const skin = skinVisual(s.skinId);
  const lift = Math.min(1, air / (150 * u));
  const speed = Math.min(1, Math.abs(p.vy) / (1000 * u));
  const alpha = (0.1 + lift * 0.16) * (0.62 + speed * 0.38);
  const length = (24 + lift * 48) * u;
  const x = p.x - p.w * 0.28;
  const y = p.y - p.h * 0.42;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i += 1) {
    const offset = (i - 1) * 7 * u;
    const startX = x - length * (0.42 + i * 0.08);
    const gradient = ctx.createLinearGradient(startX, y + offset, x, y + offset);
    gradient.addColorStop(0, 'rgba(255,255,255,0)');
    gradient.addColorStop(0.7, skin.accent);
    gradient.addColorStop(1, '#ffffff');
    ctx.globalAlpha = alpha * (1 - i * 0.18);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = (1.2 + (2 - i) * 0.45) * u;
    ctx.beginPath();
    ctx.moveTo(startX, y + offset + 3 * u);
    ctx.quadraticCurveTo(x - length * 0.26, y + offset - 5 * u, x, y + offset);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCollectibleLight(ctx: CanvasRenderingContext2D, s: GameState): void {
  const u = s.unit;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  for (const coin of s.coins) {
    const pulse = 0.72 + Math.sin(coin.phase * 1.4) * 0.28;
    ctx.globalAlpha = 0.11 * pulse;
    ctx.fillStyle = '#ffd779';
    ctx.beginPath();
    ctx.ellipse(coin.x, coin.y, coin.r * 2.1, coin.r * 1.65, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.24 * pulse;
    ctx.strokeStyle = '#fff1bd';
    ctx.lineWidth = Math.max(0.8, 1 * u);
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, coin.r * (1.2 + pulse * 0.12), 0, Math.PI * 2);
    ctx.stroke();
  }

  for (const relic of s.relics) {
    const pulse = 0.5 + Math.sin(relic.phase) * 0.5;
    ctx.globalAlpha = 0.18 + pulse * 0.1;
    ctx.strokeStyle = '#a9edff';
    ctx.lineWidth = 1.4 * u;
    ctx.beginPath();
    ctx.arc(relic.x, relic.y, relic.r * (1.55 + pulse * 0.35), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawLandingPulse(ctx: CanvasRenderingContext2D, s: GameState): void {
  const p = s.player;
  if (!p.onGround || s.phase !== 'running' || p.squashX < 1.025) return;
  const strength = Math.min(0.25, (p.squashX - 1) * 0.8);
  const width = p.w * (0.95 + (p.squashX - 1) * 4);
  ctx.save();
  ctx.globalAlpha = strength;
  ctx.strokeStyle = skinVisual(s.skinId).accent;
  ctx.lineWidth = 1.25 * s.unit;
  ctx.beginPath();
  ctx.ellipse(p.x, s.groundY + 4 * s.unit, width, 3.4 * s.unit, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** Lightweight post-render polish; no gameplay state or scoring is changed. */
export function renderJumpJuice(ctx: CanvasRenderingContext2D, s: GameState): void {
  drawAmbient(ctx, s);
  drawCollectibleLight(ctx, s);
  drawPlayerTrail(ctx, s);
  drawLandingPulse(ctx, s);
}
