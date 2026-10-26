import type { GameState } from './types';
import { skinVisual } from '../data/catalog';
import type { Palette } from './render';

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

export function drawPlayer(ctx: CanvasRenderingContext2D, s: GameState, palette: Palette): void {
  const p = s.player;
  const u = s.unit;
  const skin = skinVisual(s.skinId);

  const airHeight = Math.max(0, s.groundY - p.y);
  const shadowScale = Math.max(0.35, 1 - airHeight / (240 * u));
  ctx.globalAlpha = 0.3 * shadowScale;
  ctx.fillStyle = '#05030f';
  ellipse(ctx, p.x, s.groundY + 7 * u, p.w * 0.52 * shadowScale, 5.5 * u * shadowScale);
  ctx.fill();
  ctx.globalAlpha = 1;

  const bob = p.onGround ? Math.sin(p.idlePhase * 2.2) * 1.3 * u : 0;
  const blink = s.now < p.blinkAt;

  ctx.save();
  ctx.translate(p.x, p.y + bob);
  ctx.rotate(p.tilt);
  ctx.scale(p.squashX, p.squashY);

  if (skin.aura) {
    const aura = ctx.createRadialGradient(0, -p.h * 0.5, p.w * 0.2, 0, -p.h * 0.5, p.w * 1.35);
    aura.addColorStop(0, skin.aura);
    aura.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.15 + Math.sin(s.now * 0.003) * 0.05;
    ctx.fillStyle = aura;
    ellipse(ctx, 0, -p.h * 0.5, p.w * 0.95, p.h * 0.8);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  if (s.phase === 'running' && (s.invulnUntil > s.now || s.revived)) {
    const pulse = 0.4 + 0.25 * Math.sin(s.now * 0.012);
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = skin.accent;
    ctx.lineWidth = 2 * u;
    ctx.setLineDash([5 * u, 5 * u]);
    ctx.beginPath();
    ctx.ellipse(0, -p.h * 0.5, p.w * 0.86, p.h * 0.72, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  // Tail
  ctx.strokeStyle = skin.bodyDark;
  ctx.lineWidth = 8 * u;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-p.w * 0.32, -p.h * 0.35);
  ctx.quadraticCurveTo(-p.w * 0.9, -p.h * 0.62, -p.w * 0.76, -p.h * 0.12);
  ctx.stroke();
  ctx.strokeStyle = skin.accent;
  ctx.lineWidth = 4.5 * u;
  ctx.beginPath();
  ctx.moveTo(-p.w * 0.68, -p.h * 0.28);
  ctx.quadraticCurveTo(-p.w * 0.8, -p.h * 0.34, -p.w * 0.76, -p.h * 0.12);
  ctx.stroke();

  // Ears (behind the body)
  const earY = -p.h * 0.83;
  ctx.fillStyle = skin.body;
  ctx.strokeStyle = skin.bodyDark;
  ctx.lineWidth = 1.6 * u;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * p.w * 0.12, earY + p.h * 0.07);
    ctx.lineTo(side * p.w * 0.3, earY - p.h * 0.13);
    ctx.lineTo(side * p.w * 0.44, earY + p.h * 0.09);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = skin.accent;
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.moveTo(side * p.w * 0.2, earY + p.h * 0.045);
    ctx.lineTo(side * p.w * 0.3, earY - p.h * 0.065);
    ctx.lineTo(side * p.w * 0.37, earY + p.h * 0.055);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = skin.body;
  }

  // Legs
  const legSwing = p.onGround && s.phase !== 'dead' ? Math.sin(p.legPhase) * 4.5 * u : 0;
  ctx.fillStyle = skin.bodyDark;
  for (const side of [-1, 1]) {
    const lx = side * p.w * 0.19 + (side === 1 ? legSwing : -legSwing);
    ellipse(ctx, lx, -3.4 * u + Math.abs(legSwing) * 0.12, 7.2 * u, 4.2 * u);
    ctx.fill();
  }

  // Arms
  ctx.fillStyle = skin.body;
  for (const side of [-1, 1]) {
    const ax = side * p.w * 0.46;
    const ay = -p.h * 0.45 + (side === 1 ? -legSwing * 0.6 : legSwing * 0.6);
    ellipse(ctx, ax, ay, 5.2 * u, 7.4 * u);
    ctx.fill();
  }

  // Body
  const bodyGradient = ctx.createLinearGradient(0, -p.h, 0, 0);
  bodyGradient.addColorStop(0, skin.body);
  bodyGradient.addColorStop(1, skin.bodyDark);
  ctx.fillStyle = bodyGradient;
  ctx.strokeStyle = skin.bodyDark;
  ctx.lineWidth = 2 * u;
  ctx.beginPath();
  ctx.ellipse(0, -p.h * 0.48, p.w * 0.5, p.h * 0.48, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = skin.belly;
  ctx.globalAlpha = 0.9;
  ellipse(ctx, 0, -p.h * 0.33, p.w * 0.3, p.h * 0.26);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Scarf
  ctx.strokeStyle = skin.accent;
  ctx.lineWidth = 5 * u;
  ctx.lineCap = 'round';
  const scarfWave = Math.sin(s.now * 0.009 + p.legPhase * 0.4) * 3 * u;
  ctx.beginPath();
  ctx.moveTo(-p.w * 0.3, -p.h * 0.62);
  ctx.quadraticCurveTo(-p.w * 0.62, -p.h * 0.68 + scarfWave, -p.w * 0.82, -p.h * 0.54 + scarfWave);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-p.w * 0.28, -p.h * 0.6);
  ctx.quadraticCurveTo(-p.w * 0.5, -p.h * 0.5 - scarfWave, -p.w * 0.7, -p.h * 0.4 - scarfWave);
  ctx.stroke();
  ctx.lineWidth = 5.5 * u;
  ctx.beginPath();
  ctx.arc(0, -p.h * 0.64, p.w * 0.3, 0.15, Math.PI - 0.15);
  ctx.stroke();

  // Face
  const eyeY = -p.h * 0.56;
  const eyeX = p.w * 0.18;
  ctx.fillStyle = skin.eye;
  if (s.phase === 'dead') {
    ctx.strokeStyle = skin.eye;
    ctx.lineWidth = 2.2 * u;
    for (const side of [-1, 1]) {
      const x = side * eyeX;
      ctx.beginPath();
      ctx.moveTo(x - 2.8 * u, eyeY - 2.8 * u);
      ctx.lineTo(x + 2.8 * u, eyeY + 2.8 * u);
      ctx.moveTo(x + 2.8 * u, eyeY - 2.8 * u);
      ctx.lineTo(x - 2.8 * u, eyeY + 2.8 * u);
      ctx.stroke();
    }
  } else {
    for (const side of [-1, 1]) {
      if (blink) {
        ctx.strokeStyle = skin.eye;
        ctx.lineWidth = 2 * u;
        ctx.beginPath();
        ctx.moveTo(side * eyeX - 2.7 * u, eyeY);
        ctx.quadraticCurveTo(side * eyeX, eyeY + 1.8 * u, side * eyeX + 2.7 * u, eyeY);
        ctx.stroke();
      } else {
        ellipse(ctx, side * eyeX, eyeY, 3.1 * u, 3.7 * u);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ellipse(ctx, side * eyeX - 0.9 * u, eyeY - 1.2 * u, 1.1 * u, 1.2 * u);
        ctx.fill();
        ctx.fillStyle = skin.eye;
      }
    }
  }

  ctx.fillStyle = skin.accent;
  ctx.globalAlpha = 0.25;
  ellipse(ctx, -p.w * 0.3, -p.h * 0.43, 3.6 * u, 2.2 * u);
  ctx.fill();
  ellipse(ctx, p.w * 0.3, -p.h * 0.43, 3.6 * u, 2.2 * u);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = skin.eye;
  ctx.lineWidth = 1.5 * u;
  ctx.beginPath();
  if (s.phase === 'dead') {
    ctx.moveTo(-2.2 * u, -p.h * 0.46);
    ctx.quadraticCurveTo(0, -p.h * 0.42, 2.2 * u, -p.h * 0.46);
  } else {
    ctx.moveTo(-2.4 * u, -p.h * 0.46);
    ctx.quadraticCurveTo(-1.2 * u, -p.h * 0.435, 0, -p.h * 0.46);
    ctx.quadraticCurveTo(1.2 * u, -p.h * 0.435, 2.4 * u, -p.h * 0.46);
  }
  ctx.stroke();

  // Accessories
  const headTop = -p.h * 0.98;
  if (skin.accessory === 'cap') {
    ctx.fillStyle = skin.accent;
    ctx.beginPath();
    ctx.ellipse(0, headTop + 6 * u, p.w * 0.3, p.h * 0.14, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-p.w * 0.3, headTop + 3 * u, p.w * 0.6, 3 * u);
    ctx.fillStyle = skin.bodyDark;
    roundRect(ctx, -p.w * 0.06, headTop + 2 * u, p.w * 0.34, 3.5 * u, 1.5 * u);
    ctx.fill();
  } else if (skin.accessory === 'crown') {
    ctx.fillStyle = '#ffd24a';
    ctx.strokeStyle = '#c98d12';
    ctx.lineWidth = 1.2 * u;
    ctx.beginPath();
    ctx.moveTo(-p.w * 0.25, headTop + 8 * u);
    ctx.lineTo(-p.w * 0.18, headTop - 3 * u);
    ctx.lineTo(-p.w * 0.02, headTop + 3 * u);
    ctx.lineTo(p.w * 0.14, headTop - 4 * u);
    ctx.lineTo(p.w * 0.27, headTop + 8 * u);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ff6f91';
    ellipse(ctx, 0, headTop + 4 * u, 2 * u, 2 * u);
    ctx.fill();
  } else if (skin.accessory === 'halo') {
    const glow = ctx.createRadialGradient(0, headTop - 3 * u, 1, 0, headTop - 3 * u, p.w * 0.5);
    glow.addColorStop(0, 'rgba(255,232,150,0.5)');
    glow.addColorStop(1, 'rgba(255,232,150,0)');
    ctx.fillStyle = glow;
    ellipse(ctx, 0, headTop - 3 * u, p.w * 0.5, p.h * 0.2);
    ctx.fill();
    ctx.strokeStyle = '#ffe28a';
    ctx.lineWidth = 3 * u;
    ctx.beginPath();
    ctx.ellipse(0, headTop - 2 * u, p.w * 0.29, p.h * 0.075, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (skin.accessory === 'band') {
    ctx.fillStyle = skin.accent;
    ctx.fillRect(-p.w * 0.5, eyeY - 4.6 * u, p.w, 9 * u);
    ctx.beginPath();
    ctx.moveTo(-p.w * 0.5, eyeY - 4.6 * u);
    ctx.lineTo(-p.w * 0.82, eyeY - 1 * u);
    ctx.lineTo(-p.w * 0.8, eyeY + 4 * u);
    ctx.lineTo(-p.w * 0.5, eyeY + 1 * u);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.85;
    ellipse(ctx, -p.w * 0.32, eyeY - 0.5 * u, 2.2 * u, 1.2 * u);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = skin.eye;
    for (const side of [-1, 1]) {
      ellipse(ctx, side * eyeX, eyeY, 2.4 * u, 1.5 * u);
      ctx.fill();
    }
  } else if (skin.accessory === 'headphones') {
    ctx.strokeStyle = skin.accent;
    ctx.lineWidth = 3.4 * u;
    ctx.beginPath();
    ctx.arc(0, -p.h * 0.64, p.w * 0.58, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();
    ctx.fillStyle = skin.accent;
    for (const side of [-1, 1]) {
      roundRect(ctx, side * p.w * 0.48 - 4 * u, -p.h * 0.7, 8 * u, 15 * u, 4 * u);
      ctx.fill();
    }
  } else if (skin.accessory === 'sprout') {
    ctx.strokeStyle = '#3f9a68';
    ctx.lineWidth = 2.4 * u;
    ctx.beginPath();
    ctx.moveTo(0, headTop + 4 * u);
    ctx.quadraticCurveTo(1 * u, headTop - 2 * u, -1 * u, headTop - 7 * u);
    ctx.stroke();
    ctx.fillStyle = '#59c98a';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(side * 5 * u, headTop - 5 * u, 5.5 * u, 3 * u, side * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();

  // Landing dust is emitted by the engine; a tiny ground contact glow helps depth.
  if (p.onGround) {
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = palette.groundLine;
    ellipse(ctx, p.x, s.groundY + 5 * u, p.w * 0.62, 3 * u);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
