import type { GameState, Obstacle, Particle } from './types';
import { WORLD_LENGTH, worldAt } from './worlds';
import { drawPlayer } from './player';

export interface Palette {
  skyTop: string;
  skyBottom: string;
  haze: string;
  sun: string;
  far: string;
  mid: string;
  near: string;
  ground: string;
  groundTop: string;
  groundLine: string;
  stone: string;
  stoneDark: string;
  grass: string;
  cactus: string;
  cloud: string;
  night: number;
}

const PALETTES: Palette[] = [
  {
    skyTop: '#0b0a24',
    skyBottom: '#3b1d55',
    haze: '#ff7a9c',
    sun: '#ffe6b0',
    far: '#241a4b',
    mid: '#1b1439',
    near: '#140f2c',
    ground: '#171129',
    groundTop: '#2b2048',
    groundLine: '#5b4a8f',
    stone: '#6b6288',
    stoneDark: '#413a5c',
    grass: '#2f6b5c',
    cactus: '#2f8f72',
    cloud: '#b9a7ff',
    night: 1,
  },
  {
    skyTop: '#251c4d',
    skyBottom: '#ff9a76',
    haze: '#ffb37a',
    sun: '#fff0c9',
    far: '#4b3468',
    mid: '#33244f',
    near: '#241936',
    ground: '#21172e',
    groundTop: '#402a4c',
    groundLine: '#a06f7a',
    stone: '#7d6684',
    stoneDark: '#523f5d',
    grass: '#3b7f5f',
    cactus: '#3a9b71',
    cloud: '#ffd9c4',
    night: 0.35,
  },
  {
    skyTop: '#4c9bd6',
    skyBottom: '#b7ebff',
    haze: '#ffe6a8',
    sun: '#fff6cf',
    far: '#6aa6c4',
    mid: '#3e7fa4',
    near: '#2b5f7d',
    ground: '#22453f',
    groundTop: '#38635a',
    groundLine: '#8fd6b8',
    stone: '#8b9aa3',
    stoneDark: '#5c6b74',
    grass: '#3f9a68',
    cactus: '#2e9c60',
    cloud: '#ffffff',
    night: 0,
  },
  {
    skyTop: '#25133f',
    skyBottom: '#ff8a63',
    haze: '#ffb066',
    sun: '#ffd29b',
    far: '#593063',
    mid: '#3d204c',
    near: '#291535',
    ground: '#241428',
    groundTop: '#472444',
    groundLine: '#d58a72',
    stone: '#866075',
    stoneDark: '#57384b',
    grass: '#4d7c4d',
    cactus: '#3c8a55',
    cloud: '#ffc9b0',
    night: 0.5,
  },
];

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function blend(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const r = Math.round(ca[0] + (cb[0] - ca[0]) * t);
  const g = Math.round(ca[1] + (cb[1] - ca[1]) * t);
  const bl = Math.round(ca[2] + (cb[2] - ca[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

function mixPalette(a: Palette, b: Palette, t: number): Palette {
  return {
    skyTop: blend(a.skyTop, b.skyTop, t),
    skyBottom: blend(a.skyBottom, b.skyBottom, t),
    haze: blend(a.haze, b.haze, t),
    sun: blend(a.sun, b.sun, t),
    far: blend(a.far, b.far, t),
    mid: blend(a.mid, b.mid, t),
    near: blend(a.near, b.near, t),
    ground: blend(a.ground, b.ground, t),
    groundTop: blend(a.groundTop, b.groundTop, t),
    groundLine: blend(a.groundLine, b.groundLine, t),
    stone: blend(a.stone, b.stone, t),
    stoneDark: blend(a.stoneDark, b.stoneDark, t),
    grass: blend(a.grass, b.grass, t),
    cactus: blend(a.cactus, b.cactus, t),
    cloud: blend(a.cloud, b.cloud, t),
    night: a.night + (b.night - a.night) * t,
  };
}

export function paletteFor(distanceM: number): Palette {
  const span = WORLD_LENGTH;
  const raw = (Math.max(0, distanceM) / span) % PALETTES.length;
  const index = Math.floor(raw);
  const next = (index + 1) % PALETTES.length;
  const t = raw - index;
  const eased = t * t * (3 - 2 * t);
  return mixPalette(PALETTES[index], PALETTES[next], eased);
}

const STARS = Array.from({ length: 64 }, (_, i) => {
  const a = Math.sin(i * 127.1) * 43758.5453;
  const b = Math.sin(i * 311.7) * 22578.1459;
  return {
    x: Math.abs(a - Math.floor(a)),
    y: Math.abs(b - Math.floor(b)),
    size: 0.6 + (Math.abs(Math.sin(i * 3.3)) * 1.6),
    phase: Math.abs(Math.cos(i * 1.7)) * 6.28,
  };
});

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function ellipse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
): void {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
}

function drawSky(ctx: CanvasRenderingContext2D, s: GameState, p: Palette): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, s.groundY + s.unit * 20);
  gradient.addColorStop(0, p.skyTop);
  gradient.addColorStop(0.68, p.skyBottom);
  gradient.addColorStop(1, p.haze);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, s.w, s.groundY + 2);

  if (p.night > 0.05) {
    for (let i = 0; i < STARS.length; i += 1) {
      const star = STARS[i];
      const twinkle = 0.55 + 0.45 * Math.sin(s.now * 0.0016 + star.phase);
      ctx.globalAlpha = p.night * (0.35 + twinkle * 0.65);
      ctx.fillStyle = i % 7 === 0 ? '#ffe4b0' : '#ffffff';
      const y = star.y * s.groundY * 0.75;
      ctx.beginPath();
      ctx.arc(star.x * s.w, y, star.size * s.unit, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  const cx = s.w * 0.76;
  const cy = Math.min(s.groundY * 0.26, s.h * 0.2);
  const radius = Math.min(s.w, s.h) * 0.085;
  const glow = ctx.createRadialGradient(cx, cy, radius * 0.4, cx, cy, radius * 3.6);
  glow.addColorStop(0, p.sun);
  glow.addColorStop(0.28, p.sun);
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = glow;
  ctx.fillRect(cx - radius * 4, cy - radius * 4, radius * 8, radius * 8);
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = p.sun;
  ellipse(ctx, cx, cy, radius, radius);
  ctx.fill();
  if (p.night > 0.45) {
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = p.skyTop;
    ellipse(ctx, cx + radius * 0.42, cy - radius * 0.24, radius * 0.92, radius * 0.92);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (const cloud of s.clouds) {
    ctx.globalAlpha = cloud.alpha * (0.6 + p.night * 0.18);
    ctx.fillStyle = p.cloud;
    const w = 64 * cloud.scale * s.unit;
    const h = 22 * cloud.scale * s.unit;
    ellipse(ctx, cloud.x, cloud.y, w, h);
    ctx.fill();
    ellipse(ctx, cloud.x - w * 0.48, cloud.y + h * 0.28, w * 0.58, h * 0.78);
    ctx.fill();
    ellipse(ctx, cloud.x + w * 0.42, cloud.y + h * 0.22, w * 0.64, h * 0.86);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawWorldWeather(ctx: CanvasRenderingContext2D, s: GameState, p: Palette): void {
  const world = worldAt(s.distanceM);
  const u = s.unit;
  const phase = s.now * 0.001;
  ctx.save();
  ctx.globalAlpha = 0.24;

  if (world.landmark === 'lanterns') {
    ctx.fillStyle = p.sun;
    for (let i = 0; i < 12; i += 1) {
      const x = ((i * 97 + s.distancePx * 0.08) % (s.w + 24 * u)) - 12 * u;
      const y = s.groundY * (0.22 + ((i * 0.071) % 0.46)) + Math.sin(phase * 1.4 + i) * 5 * u;
      ctx.beginPath();
      ctx.arc(x, y, (1.4 + (i % 3) * 0.6) * u, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (world.landmark === 'torii') {
    ctx.fillStyle = p.haze;
    for (let i = 0; i < 10; i += 1) {
      const x = ((i * 131 - s.distancePx * 0.16) % (s.w + 32 * u)) - 16 * u;
      const y = s.groundY * (0.16 + ((i * 0.083) % 0.5)) + Math.sin(phase + i) * 8 * u;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(phase * 0.8 + i) * 0.7);
      ctx.fillRect(-2 * u, -1 * u, 4 * u, 2 * u);
      ctx.restore();
    }
  } else if (world.landmark === 'peaks') {
    ctx.strokeStyle = p.cloud;
    ctx.lineWidth = Math.max(1, 1.5 * u);
    for (let i = 0; i < 6; i += 1) {
      const x = ((i * 173 + s.distancePx * 0.035) % (s.w + 110 * u)) - 55 * u;
      const y = s.groundY * (0.18 + (i % 3) * 0.08);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 24 * u, y - 7 * u, x + 52 * u, y);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = p.sun;
    for (let i = 0; i < 14; i += 1) {
      const x = ((i * 113 - s.distancePx * 0.22) % (s.w + 20 * u)) - 10 * u;
      const y = s.groundY * (0.12 + ((i * 0.097) % 0.56)) + Math.sin(phase * 0.7 + i) * 3 * u;
      ctx.fillRect(x, y, (1 + (i % 2)) * u, (1 + (i % 2)) * u);
    }
  }
  ctx.restore();
}

function ridge(
  ctx: CanvasRenderingContext2D,
  s: GameState,
  baseY: number,
  amp: number,
  offset: number,
  color: string,
  step: number,
): void {
  ctx.beginPath();
  ctx.moveTo(-20, s.h);
  for (let x = -20; x <= s.w + 20; x += step) {
    const wave =
      Math.sin((x + offset) / (210 * s.unit)) * amp +
      Math.sin((x + offset) / (93 * s.unit) + 1.3) * amp * 0.38 +
      Math.sin((x + offset) / (41 * s.unit) + 2.1) * amp * 0.12;
    ctx.lineTo(x, baseY + wave);
  }
  ctx.lineTo(s.w + 20, s.h);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawMountains(ctx: CanvasRenderingContext2D, s: GameState, p: Palette): void {
  const off = s.distancePx;
  ridge(ctx, s, s.groundY - 110 * s.unit, 76 * s.unit, off * 0.045, p.far, 16);
  ridge(ctx, s, s.groundY - 52 * s.unit, 92 * s.unit, off * 0.095, p.mid, 14);
  ridge(ctx, s, s.groundY + 14 * s.unit, 58 * s.unit, off * 0.18, p.near, 12);
}

function drawLandmark(ctx: CanvasRenderingContext2D, s: GameState, p: Palette): void {
  const world = worldAt(s.distanceM);
  const u = s.unit;
  const drift = (s.distancePx * 0.12) % (s.w + 260 * u);
  const x = s.w + 150 * u - drift;
  const base = s.groundY - 48 * u;
  ctx.save();
  ctx.globalAlpha = 0.42;
  ctx.fillStyle = p.near;
  ctx.strokeStyle = p.groundLine;
  ctx.lineWidth = 2 * u;

  if (world.landmark === 'lanterns') {
    for (let i = 0; i < 3; i += 1) {
      const lx = x + i * 72 * u;
      ctx.beginPath();
      ctx.moveTo(lx, base);
      ctx.lineTo(lx, base - (50 + i * 14) * u);
      ctx.stroke();
      ctx.fillStyle = p.sun;
      ctx.globalAlpha = 0.22;
      ctx.beginPath();
      ctx.arc(lx, base - (58 + i * 14) * u, 7 * u, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p.near;
      ctx.globalAlpha = 0.42;
    }
  } else if (world.landmark === 'torii') {
    const width = 116 * u;
    const top = base - 104 * u;
    ctx.strokeStyle = p.haze;
    ctx.lineWidth = 8 * u;
    ctx.beginPath();
    ctx.moveTo(x - width / 2, base);
    ctx.lineTo(x - width / 2 + 14 * u, top + 20 * u);
    ctx.moveTo(x + width / 2, base);
    ctx.lineTo(x + width / 2 - 14 * u, top + 20 * u);
    ctx.moveTo(x - width / 2 - 10 * u, top + 14 * u);
    ctx.lineTo(x + width / 2 + 10 * u, top + 14 * u);
    ctx.moveTo(x - width / 2 - 3 * u, top + 34 * u);
    ctx.lineTo(x + width / 2 + 3 * u, top + 34 * u);
    ctx.stroke();
  } else if (world.landmark === 'peaks') {
    ctx.fillStyle = p.groundLine;
    ctx.beginPath();
    ctx.moveTo(x - 140 * u, base);
    ctx.lineTo(x - 52 * u, base - 112 * u);
    ctx.lineTo(x + 12 * u, base - 40 * u);
    ctx.lineTo(x + 82 * u, base - 138 * u);
    ctx.lineTo(x + 164 * u, base);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = p.cloud;
    ctx.globalAlpha = 0.18;
    ctx.fillRect(x - 82 * u, base - 84 * u, 40 * u, 7 * u);
    ctx.fillRect(x + 44 * u, base - 105 * u, 52 * u, 7 * u);
  } else {
    ctx.strokeStyle = p.sun;
    ctx.lineWidth = 12 * u;
    ctx.beginPath();
    ctx.arc(x, base, 74 * u, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 4 * u;
    ctx.beginPath();
    ctx.moveTo(x - 74 * u, base);
    ctx.lineTo(x - 74 * u, base + 18 * u);
    ctx.moveTo(x + 74 * u, base);
    ctx.lineTo(x + 74 * u, base + 18 * u);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGround(ctx: CanvasRenderingContext2D, s: GameState, p: Palette): void {
  const gradient = ctx.createLinearGradient(0, s.groundY, 0, s.h);
  gradient.addColorStop(0, p.groundTop);
  gradient.addColorStop(0.2, p.ground);
  gradient.addColorStop(1, p.skyTop);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, s.groundY, s.w, s.h - s.groundY + 1);

  ctx.fillStyle = p.groundLine;
  ctx.globalAlpha = 0.55;
  ctx.fillRect(0, s.groundY, s.w, Math.max(1.4, 2 * s.unit));
  ctx.globalAlpha = 1;

  const spacing = 74 * s.unit;
  const shift = (s.distancePx * 1.0) % spacing;
  ctx.globalAlpha = 0.24;
  ctx.fillStyle = p.groundLine;
  for (let x = -spacing; x < s.w + spacing; x += spacing) {
    const px = x - shift;
    const depth = 12 + ((Math.abs(Math.sin(px * 0.11)) * 40) * s.unit);
    ctx.fillRect(px, s.groundY + depth, spacing * 0.24, Math.max(1, 2 * s.unit));
  }

  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 12; i += 1) {
    const seed = i * 977.13;
    const x = ((seed % 1000) / 1000) * s.w - ((s.distancePx * 0.55) % s.w);
    const wrapped = ((x % s.w) + s.w) % s.w;
    const y = s.groundY + (16 + (seed % 44)) * s.unit;
    ctx.fillStyle = i % 3 === 0 ? p.grass : p.stoneDark;
    ellipse(ctx, wrapped, y, (2.5 + (i % 3)) * s.unit, 1.4 * s.unit);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.globalAlpha = 0.35;
  ctx.fillStyle = p.grass;
  for (let x = -30; x < s.w + 30; x += 26 * s.unit) {
    const gx = x - ((s.distancePx * 0.85) % (26 * s.unit));
    const height = (5 + ((Math.abs(Math.sin(gx * 0.4)) * 9) | 0)) * s.unit;
    ctx.beginPath();
    ctx.moveTo(gx, s.groundY + 5 * s.unit);
    ctx.lineTo(gx + 4 * s.unit, s.groundY + 5 * s.unit - height);
    ctx.lineTo(gx + 8 * s.unit, s.groundY + 5 * s.unit);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawSpeedLines(ctx: CanvasRenderingContext2D, s: GameState): void {
  const intensity = Math.max(0, (s.speedPx / s.unit - 520) / 500);
  if (intensity <= 0.02) return;
  ctx.globalAlpha = Math.min(0.16, intensity * 0.16);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(1, s.unit);
  for (let i = 0; i < 7; i += 1) {
    const y = s.groundY * (0.15 + ((i * 0.117 + 0.04) % 0.7));
    const len = (30 + ((i * 53) % 90)) * s.unit;
    const x = s.w - ((s.now * 0.35 + i * 217) % (s.w + len * 2));
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawObstacle(ctx: CanvasRenderingContext2D, o: Obstacle, s: GameState, p: Palette): void {
  const u = s.unit;
  ctx.save();
  ctx.translate(o.x, o.y);

  ctx.globalAlpha = 0.28;
  ctx.fillStyle = '#000000';
  ellipse(ctx, o.w / 2, o.h + 4 * u, o.w * 0.62, 6 * u);
  ctx.fill();
  ctx.globalAlpha = 1;

  if (o.kind === 'rock') {
    const grad = ctx.createLinearGradient(0, 0, 0, o.h);
    grad.addColorStop(0, p.stone);
    grad.addColorStop(1, p.stoneDark);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(2 * u, o.h);
    ctx.lineTo(0, o.h * 0.55);
    ctx.lineTo(o.w * 0.18, o.h * 0.18);
    ctx.lineTo(o.w * 0.46, 0);
    ctx.lineTo(o.w * 0.82, o.h * 0.16);
    ctx.lineTo(o.w, o.h * 0.58);
    ctx.lineTo(o.w - 2 * u, o.h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = p.grass;
    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    ctx.ellipse(o.w * 0.44, o.h * 0.1, o.w * 0.2, 4 * u, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = p.stoneDark;
    ctx.lineWidth = 1.5 * u;
    ctx.beginPath();
    ctx.moveTo(o.w * 0.35, o.h * 0.35);
    ctx.lineTo(o.w * 0.55, o.h * 0.62);
    ctx.lineTo(o.w * 0.48, o.h * 0.86);
    ctx.stroke();
  } else if (o.kind === 'cactus') {
    const grad = ctx.createLinearGradient(0, 0, o.w, 0);
    grad.addColorStop(0, p.cactus);
    grad.addColorStop(1, '#0d4a3a');
    ctx.fillStyle = grad;
    roundRect(ctx, o.w * 0.32, 0, o.w * 0.36, o.h, o.w * 0.18);
    ctx.fill();
    roundRect(ctx, o.w * 0.04, o.h * 0.32, o.w * 0.3, o.h * 0.12, o.w * 0.06);
    ctx.fill();
    roundRect(ctx, o.w * 0.04, o.h * 0.32, o.w * 0.12, o.h * 0.3, o.w * 0.06);
    ctx.fill();
    roundRect(ctx, o.w * 0.68, o.h * 0.22, o.w * 0.28, o.h * 0.11, o.w * 0.055);
    ctx.fill();
    roundRect(ctx, o.w * 0.84, o.h * 0.02, o.w * 0.11, o.h * 0.3, o.w * 0.055);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.2 * u;
    for (let i = 0; i < 5; i += 1) {
      const y = o.h * (0.15 + i * 0.14);
      ctx.beginPath();
      ctx.moveTo(o.w * 0.32, y);
      ctx.lineTo(o.w * 0.25, y - 2 * u);
      ctx.moveTo(o.w * 0.68, y);
      ctx.lineTo(o.w * 0.75, y - 2 * u);
      ctx.stroke();
    }
  } else if (o.kind === 'crystal') {
    const crystal = ctx.createLinearGradient(0, 0, o.w, o.h);
    crystal.addColorStop(0, '#d7fbff');
    crystal.addColorStop(0.42, p.cloud);
    crystal.addColorStop(1, p.mid);
    ctx.fillStyle = crystal;
    ctx.beginPath();
    ctx.moveTo(o.w * 0.5, 0);
    ctx.lineTo(o.w, o.h * 0.76);
    ctx.lineTo(o.w * 0.66, o.h);
    ctx.lineTo(o.w * 0.22, o.h * 0.82);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5 * u;
    ctx.beginPath();
    ctx.moveTo(o.w * 0.5, 0);
    ctx.lineTo(o.w * 0.55, o.h * 0.82);
    ctx.lineTo(o.w * 0.22, o.h * 0.82);
    ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (o.kind === 'driftwood') {
    const wood = ctx.createLinearGradient(0, 0, 0, o.h);
    wood.addColorStop(0, p.stone);
    wood.addColorStop(1, p.stoneDark);
    ctx.fillStyle = wood;
    roundRect(ctx, 0, o.h * 0.18, o.w, o.h * 0.72, o.h * 0.32);
    ctx.fill();
    ctx.strokeStyle = p.grass;
    ctx.lineWidth = 2 * u;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(o.w * 0.16, o.h * 0.45);
    ctx.quadraticCurveTo(o.w * 0.42, o.h * 0.08, o.w * 0.8, o.h * 0.52);
    ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (o.kind === 'spikes') {
    const count = 3;
    const step = o.w / count;
    const metal = ctx.createLinearGradient(0, 0, 0, o.h);
    metal.addColorStop(0, '#f4f1ff');
    metal.addColorStop(0.55, p.stone);
    metal.addColorStop(1, p.stoneDark);
    ctx.fillStyle = metal;
    for (let i = 0; i < count; i += 1) {
      const x = i * step;
      ctx.beginPath();
      ctx.moveTo(x, o.h);
      ctx.lineTo(x + step * 0.5, 0);
      ctx.lineTo(x + step, o.h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < count; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * step + step * 0.5, 0);
      ctx.lineTo(i * step + step * 0.44, o.h * 0.68);
      ctx.lineTo(i * step + step * 0.35, o.h * 0.68);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = p.stoneDark;
    ctx.fillRect(0, o.h - 4 * u, o.w, 4 * u);
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, o.h);
    grad.addColorStop(0, p.stone);
    grad.addColorStop(1, p.stoneDark);
    ctx.fillStyle = grad;
    roundRect(ctx, 0, 0, o.w, o.h, 6 * u);
    ctx.fill();
    ctx.fillStyle = p.stoneDark;
    roundRect(ctx, -3 * u, 0, o.w + 6 * u, 8 * u, 4 * u);
    ctx.fill();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#000000';
    for (let i = 1; i < 4; i += 1) {
      ctx.fillRect(4 * u, (o.h / 4) * i, o.w - 8 * u, 1.5 * u);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = p.grass;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(3 * u, 7 * u, o.w * 0.3, 3 * u);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawRelic(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, phase: number, u: number): void {
  const pulse = 1 + Math.sin(phase) * 0.08;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(pulse, pulse);
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = '#5ad4ff';
  ctx.beginPath();
  ctx.arc(0, 0, r * 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.92;
  ctx.strokeStyle = '#d5f8ff';
  ctx.lineWidth = Math.max(1, 1.8 * u);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#5ad4ff';
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.72);
  ctx.lineTo(r * 0.64, -r * 0.25);
  ctx.lineTo(r * 0.42, r * 0.58);
  ctx.lineTo(0, r * 0.82);
  ctx.lineTo(-r * 0.42, r * 0.58);
  ctx.lineTo(-r * 0.64, -r * 0.25);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawCoin(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, phase: number, u: number): void {
  const spin = Math.cos(phase);
  const width = Math.max(0.16, Math.abs(spin));
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = '#ffcf4d';
  ellipse(ctx, 0, 0, r * 1.85, r * 1.85);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.scale(width, 1);
  const grad = ctx.createLinearGradient(-r, -r, r, r);
  grad.addColorStop(0, '#fff3b0');
  grad.addColorStop(0.5, '#ffd24a');
  grad.addColorStop(1, '#e09a18');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff6c9';
  ctx.lineWidth = Math.max(1, 1.4 * u);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#fff6c9';
  ctx.beginPath();
  for (let i = 0; i < 5; i += 1) {
    const outer = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const inner = outer + (2 * Math.PI) / 10;
    const ox = Math.cos(outer) * r * 0.46;
    const oy = Math.sin(outer) * r * 0.46;
    const ix = Math.cos(inner) * r * 0.2;
    const iy = Math.sin(inner) * r * 0.2;
    if (i === 0) ctx.moveTo(ox, oy);
    else ctx.lineTo(ox, oy);
    ctx.lineTo(ix, iy);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function starPath(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, points = 5): void {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? r : r * 0.45;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawParticle(ctx: CanvasRenderingContext2D, particle: Particle): void {
  const alpha = Math.max(0, particle.life / particle.maxLife);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = particle.color;
  ctx.save();
  ctx.translate(particle.x, particle.y);
  ctx.rotate(particle.rot);
  if (particle.kind === 'circle') {
    ctx.beginPath();
    ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
    ctx.fill();
  } else if (particle.kind === 'square') {
    ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
  } else {
    starPath(ctx, 0, 0, particle.size);
    ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

export function renderGame(ctx: CanvasRenderingContext2D, s: GameState): void {
  const p = paletteFor(s.distanceM);
  ctx.save();
  ctx.clearRect(0, 0, s.w, s.h);

  const shakeX = s.shake > 0 ? (Math.random() - 0.5) * s.shake : 0;
  const shakeY = s.shake > 0 ? (Math.random() - 0.5) * s.shake : 0;
  ctx.translate(shakeX, shakeY);

  drawSky(ctx, s, p);
  drawWorldWeather(ctx, s, p);
  drawMountains(ctx, s, p);
  drawLandmark(ctx, s, p);
  drawSpeedLines(ctx, s);
  drawGround(ctx, s, p);

  for (const obstacle of s.obstacles) drawObstacle(ctx, obstacle, s, p);
  for (const coin of s.coins) {
    drawCoin(ctx, coin.x, coin.y + Math.sin(coin.bob) * 3 * s.unit, coin.r, coin.phase, s.unit);
  }
  for (const relic of s.relics) {
    drawRelic(ctx, relic.x, relic.y + Math.sin(relic.bob) * 5 * s.unit, relic.r, relic.phase, s.unit);
  }

  drawPlayer(ctx, s, p);
  for (const particle of s.particles) drawParticle(ctx, particle);

  for (const floater of s.floaters) {
    const alpha = Math.min(1, floater.life / (floater.maxLife * 0.55));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = floater.color;
    ctx.font = `800 ${floater.size}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 6;
    ctx.fillText(floater.text, floater.x, floater.y);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  const vignette = ctx.createRadialGradient(
    s.w / 2,
    s.h * 0.45,
    Math.min(s.w, s.h) * 0.25,
    s.w / 2,
    s.h * 0.45,
    Math.max(s.w, s.h) * 0.72,
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(5,3,18,0.42)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, s.w, s.h);

  ctx.restore();

  if (s.flash > 0) {
    ctx.globalAlpha = Math.min(0.65, s.flash);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, s.w, s.h);
    ctx.globalAlpha = 1;
  }

  if (s.phase === 'dead') {
    ctx.globalAlpha = Math.min(0.32, s.deathAge * 0.6);
    ctx.fillStyle = '#120a20';
    ctx.fillRect(0, 0, s.w, s.h);
    ctx.globalAlpha = 1;
  }
}
