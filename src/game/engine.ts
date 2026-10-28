import type {
  EngineOptions,
  GameCallbacks,
  GameState,
  Obstacle,
  ObstacleKind,
  RunSnapshot,
} from './types';
import { renderGame } from './render';
import { sfx } from '../audio';
import { haptic } from '../tg';
import { skinVisual } from '../data/catalog';
import { worldAt, worldChapterAt, WORLD_LENGTH } from './worlds';

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export class Game {
  readonly state: GameState;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly callbacks: GameCallbacks;
  private raf = 0;
  private lastFrame = 0;
  private jumpBuffer = 0;
  private holding = false;
  private coyote = 0;
  private spawnTimer = 1.6;
  private nextBlink = 0;
  private nextMilestone = 250;
  private currentWorld = -1;
  private resizeObserver: ResizeObserver | null = null;
  private deadNotified = false;

  constructor(options: EngineOptions) {
    this.canvas = options.canvas;
    const ctx = this.canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas 2D is not available');
    this.ctx = ctx;
    this.callbacks = options.callbacks;

    this.state = {
      w: 360,
      h: 640,
      dpr: 1,
      unit: 1,
      fieldX: 0,
      fieldW: 360,
      groundY: 520,
      phase: 'idle',
      player: {
        x: 90,
        y: 520,
        w: 46,
        h: 52,
        vy: 0,
        onGround: true,
        squashX: 1,
        squashY: 1,
        legPhase: 0,
        blinkAt: 0,
        tilt: 0,
        idlePhase: 0,
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
      now: performance.now(),
      shake: 0,
      flash: 0,
      deathAge: 0,
      invulnUntil: 0,
      revived: false,
      skinId: options.skinId,
      slowMoT: 1,
    };

    this.resize();
    this.makeClouds();
    this.bindResize();
    this.lastFrame = performance.now();
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  private bindResize(): void {
    const onResize = () => this.resize();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(onResize);
      this.resizeObserver.observe(this.canvas);
    }
  }

  private makeClouds(): void {
    const s = this.state;
    const count = Math.min(14, Math.max(8, Math.round(s.w / 140)));
    s.clouds = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * s.w,
      y: s.groundY * randomRange(0.06, 0.38),
      scale: randomRange(0.6, 1.8),
      speed: randomRange(4, 14) * (i % 2 === 0 ? 1 : 0.75),
      alpha: randomRange(0.12, 0.3),
    }));
  }

  resize(): void {
    const s = this.state;
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(240, rect.width || window.innerWidth);
    const h = Math.max(320, rect.height || window.innerHeight);
    const dpr = clamp(window.devicePixelRatio || 1, 1, 2.5);
    const oldGround = s.groundY;
    const oldW = s.w;

    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    s.w = w;
    s.h = h;
    s.dpr = dpr;
    s.unit = clamp(h / 800, 0.75, 1.35);
    s.groundY = h - clamp(h * 0.16, 76, 148);
    s.fieldW = w;
    s.fieldX = 0;
    s.player.x = s.fieldW * 0.24;
    s.player.w = 46 * s.unit;
    s.player.h = 52 * s.unit;
    s.player.x = clamp(s.player.x, 54 * s.unit, s.fieldW - 80 * s.unit);

    const deltaGround = s.groundY - oldGround;
    s.player.y += deltaGround;
    for (const obstacle of s.obstacles) obstacle.y += deltaGround;
    for (const coin of s.coins) coin.y += deltaGround;
    for (const cloud of s.clouds) {
      cloud.x = (cloud.x / oldW) * w;
      cloud.y += deltaGround * 0.18;
    }
    if (s.phase === 'idle' || s.phase === 'paused') s.player.y = s.groundY;
  }

  setSkin(skinId: string): void {
    this.state.skinId = skinVisual(skinId).id;
  }

  start(): void {
    const s = this.state;
    s.obstacles = [];
    s.coins = [];
    s.particles = [];
    s.floaters = [];
    s.distancePx = 0;
    s.distanceM = 0;
    s.runCoins = 0;
    s.elapsedMs = 0;
    s.speedPx = 330 * s.unit;
    s.shake = 0;
    s.flash = 0;
    s.deathAge = 0;
    s.invulnUntil = 0;
    s.revived = false;
    s.phase = 'running';
    this.currentWorld = -1;
    this.enterWorld(0);
    s.player.y = s.groundY;
    s.player.vy = 0;
    s.player.onGround = true;
    s.player.tilt = 0;
    s.player.squashX = 1;
    s.player.squashY = 1;
    s.player.idlePhase = 0;
    this.spawnTimer = 1.6;
    this.nextMilestone = 200;
    this.nextBlink = performance.now() + randomRange(1200, 3200);
    this.deadNotified = false;
    this.holding = false;
    this.jumpBuffer = 0;
    this.lastFrame = performance.now();
    sfx.unlock();
    this.emitDust(s.player.x, s.groundY, 8, '#bdb4d8');
  }

  toMenu(): void {
    const s = this.state;
    s.phase = 'idle';
    s.obstacles = [];
    s.coins = [];
    s.particles = [];
    s.floaters = [];
    s.distanceM = 0;
    s.speedPx = 0;
    s.player.y = s.groundY;
    s.player.vy = 0;
    s.player.onGround = true;
    s.player.tilt = 0;
    s.player.squashX = 1;
    s.player.squashY = 1;
    s.revived = false;
    s.deathAge = 0;
    this.deadNotified = false;
  }

  pause(): void {
    if (this.state.phase !== 'running') return;
    this.state.phase = 'paused';
    this.holding = false;
    sfx.click();
  }

  resume(): void {
    if (this.state.phase !== 'paused') return;
    this.state.phase = 'running';
    this.lastFrame = performance.now();
    sfx.click();
  }

  press(): void {
    if (this.state.phase !== 'running') return;
    this.jumpBuffer = 0.13;
    this.holding = true;
    if (this.state.player.onGround || this.coyote > 0) this.jump();
  }

  release(): void {
    this.holding = false;
    const p = this.state.player;
    if (this.state.phase === 'running' && !p.onGround && p.vy < -430 * this.state.unit) {
      p.vy *= 0.54;
    }
  }

  private jump(): void {
    const s = this.state;
    const p = s.player;
    p.vy = -940 * s.unit;
    p.onGround = false;
    p.squashX = 0.8;
    p.squashY = 1.18;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.emitDust(p.x, s.groundY, 7, '#d9d2ee');
    sfx.jump();
    haptic('tap');
    this.callbacks.onJump?.();
  }

  revive(): void {
    const s = this.state;
    if (s.phase !== 'dead' || s.revived) return;
    const fromX = s.fieldX - 60 * s.unit;
    const toX = s.fieldX + s.fieldW * 0.96;
    s.obstacles = s.obstacles.filter((o) => o.x + o.w < fromX || o.x > toX);
    s.coins = s.coins.filter((c) => c.x > fromX && c.x < toX);
    s.phase = 'running';
    s.revived = true;
    s.deathAge = 0;
    s.flash = 0.42;
    s.shake = 0;
    s.player.y = s.groundY;
    s.player.vy = 0;
    s.player.onGround = true;
    s.player.tilt = 0;
    s.player.squashX = 1;
    s.player.squashY = 1;
    s.invulnUntil = performance.now() + 1500;
    this.spawnTimer = 1.25;
    this.deadNotified = false;
    this.lastFrame = performance.now();
    this.emitBurst(s.player.x, s.groundY - s.player.h * 0.5, 22, skinVisual(s.skinId).accent);
    sfx.revive();
    haptic('success');
  }

  snapshot(): RunSnapshot {
    const s = this.state;
    const distance = Math.floor(s.distanceM);
    return {
      score: distance,
      distance,
      coins: s.runCoins,
      durationMs: Math.round(s.elapsedMs),
      revived: s.revived,
    };
  }

  private loop(now: number): void {
    this.raf = requestAnimationFrame(this.loop);
    const elapsed = Math.min(0.05, Math.max(0, (now - this.lastFrame) / 1000));
    this.lastFrame = now;
    this.state.now = now;
    this.update(elapsed);
    renderGame(this.ctx, this.state);
    this.callbacks.onTick?.(this.state);
  }

  update(dt: number): void {
    const s = this.state;
    if (s.phase === 'paused') {
      s.now = performance.now();
      return;
    }
    s.now = performance.now();

    if (s.phase === 'idle') {
      s.distancePx += 46 * dt * s.unit;
      s.player.idlePhase += dt;
      this.updateClouds(dt);
      this.updateBlink();
      s.player.squashX += (1 - s.player.squashX) * Math.min(1, dt * 10);
      s.player.squashY += (1 - s.player.squashY) * Math.min(1, dt * 10);
      return;
    }

    if (s.phase === 'dead') {
      s.deathAge += dt;
      this.updatePlayerPhysics(dt, true);
      this.updateParticles(dt);
      this.updateClouds(dt);
      s.shake *= Math.pow(0.001, dt);
      s.flash = Math.max(0, s.flash - dt * 1.7);
      return;
    }

    if (s.phase !== 'running') return;

    s.elapsedMs += dt * 1000;
    const speedM = 360 + Math.min(680, s.distanceM * 0.52);
    s.speedPx = speedM * s.unit;
    const meterPx = 18 * s.unit;
    s.distanceM += (s.speedPx * dt) / meterPx;
    s.distancePx += s.speedPx * dt;

    if (s.distanceM >= this.nextMilestone) {
      this.addFloater(
        s.player.x + 60 * s.unit,
        s.groundY - s.player.h * 1.6,
        `${this.nextMilestone} м`,
        '#ffffff',
        16 * s.unit,
      );
      this.nextMilestone += 200;
    }

    const nextWorld = worldChapterAt(s.distanceM);
    if (nextWorld !== this.currentWorld) this.enterWorld(nextWorld);

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) this.spawnPattern();

    this.updatePlayerPhysics(dt, false);
    this.updateBlink();

    const move = s.speedPx * dt;
    for (const obstacle of s.obstacles) obstacle.x -= move;
    for (const coin of s.coins) {
      coin.x -= move;
      coin.phase += dt * 5.5;
      coin.bob += dt * 3.2;
    }
    s.obstacles = s.obstacles.filter((o) => o.x + o.w > s.fieldX - 140 * s.unit);
    s.coins = s.coins.filter((c) => c.x > s.fieldX - 120 * s.unit);

    this.checkCollisions();
    this.updateParticles(dt);
    this.updateClouds(dt);
    this.updateFloaters(dt);
    s.shake *= Math.pow(0.002, dt);
    s.flash = Math.max(0, s.flash - dt * 2.4);
  }

  private enterWorld(chapter: number): void {
    const index = worldAt(chapter * WORLD_LENGTH).index;
    this.currentWorld = chapter;
    this.state.worldIndex = index;
    this.callbacks.onWorld?.(index);
    if (chapter > 0) {
      const world = worldAt(chapter * WORLD_LENGTH);
      this.addFloater(
        this.state.fieldW * 0.62,
        this.state.groundY - this.state.player.h * 2.4,
        world.name,
        '#fff0c9',
        19 * this.state.unit,
      );
    }
  }

  private updateClouds(dt: number): void {
    const s = this.state;
    for (const cloud of s.clouds) {
      cloud.x += cloud.speed * dt * (s.unit + 0.3);
      if (cloud.x > s.w + 120 * s.unit) {
        cloud.x = -120 * s.unit;
        cloud.y = s.groundY * randomRange(0.06, 0.42);
        cloud.scale = randomRange(0.55, 1.5);
        cloud.alpha = randomRange(0.08, 0.24);
      }
    }
  }

  private updateBlink(): void {
    const s = this.state;
    if (s.now > this.nextBlink) {
      s.player.blinkAt = s.now + 130;
      this.nextBlink = s.now + randomRange(2100, 5200);
    }
  }

  private updatePlayerPhysics(dt: number, dead: boolean): void {
    const s = this.state;
    const p = s.player;
    const u = s.unit;
    const gravity = 2650 * u;

    if (dead) {
      p.vy += gravity * dt;
      p.y += p.vy * dt;
      p.tilt += dt * 4.2;
      if (p.y > s.groundY) {
        p.y = s.groundY;
        p.vy = 0;
        p.tilt += dt * 3;
      }
      p.squashX += (1 - p.squashX) * Math.min(1, dt * 8);
      p.squashY += (1 - p.squashY) * Math.min(1, dt * 8);
      return;
    }

    this.coyote = p.onGround ? 0.095 : Math.max(0, this.coyote - dt);
    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    if (this.jumpBuffer > 0 && (p.onGround || this.coyote > 0)) this.jump();

    p.vy += gravity * dt;
    p.y += p.vy * dt;

    if (p.y >= s.groundY) {
      const wasAir = !p.onGround;
      p.y = s.groundY;
      if (wasAir) {
        const impact = Math.min(1, Math.abs(p.vy) / (1100 * u));
        p.squashX = 1 + 0.2 * impact;
        p.squashY = 1 - 0.24 * impact;
        if (impact > 0.3) this.emitDust(p.x, s.groundY, Math.round(6 + impact * 8), '#cfc6e8');
      }
      p.vy = 0;
      p.onGround = true;
      this.coyote = 0.095;
      p.legPhase += dt * (12 + (s.speedPx / u) * 0.035);
    } else {
      p.onGround = false;
      p.legPhase += dt * 2;
    }

    p.squashX += (1 - p.squashX) * Math.min(1, dt * 11);
    p.squashY += (1 - p.squashY) * Math.min(1, dt * 11);
    const targetTilt = p.onGround ? 0 : clamp(p.vy / (4800 * u), -0.16, 0.2);
    p.tilt += (targetTilt - p.tilt) * Math.min(1, dt * 8);
    p.idlePhase += dt;

    if (!this.holding && p.vy < 0) {
      // Short taps produce a lower hop; holding keeps the full arc.
      p.vy += gravity * dt * 1.1;
    }
  }

  private spawnPattern(): void {
    const s = this.state;
    const u = s.unit;
    const x = s.fieldX + s.fieldW + 70 * u;
    const meters = s.distanceM;
    const roll = Math.random();

    let kind: ObstacleKind = 'rock';
    if (s.distanceM > 90 && roll > 0.68) kind = 'spikes';
    if (s.distanceM > 160 && roll > 0.48) kind = 'cactus';
    if (s.distanceM > 420 && roll > 0.88) kind = 'pillar';
    if (s.distanceM > 620 && roll > 0.82) kind = 'pillar';
    if (s.distanceM > 720 && roll > 0.64) kind = 'crystal';
    if (s.distanceM > 1440 && roll > 0.72) kind = 'driftwood';
    if (s.distanceM < 60) kind = 'rock';

    const dims = this.obstacleDims(kind);
    const obstacle: Obstacle = {
      x,
      y: s.groundY - dims.h,
      w: dims.w,
      h: dims.h,
      kind,
      seed: Math.random() * 1000,
    };
    s.obstacles.push(obstacle);

    const canDouble = meters > 260 && kind === 'rock' && Math.random() < 0.28;
    if (canDouble) {
      const second = this.obstacleDims('rock');
      const gap = randomRange(48, 72) * u;
      s.obstacles.push({
        x: x + obstacle.w + gap,
        y: s.groundY - second.h * 0.9,
        w: second.w,
        h: second.h * 0.9,
        kind: 'rock',
        seed: Math.random() * 1000,
      });
    }

    const arcChance = kind === 'spikes' || kind === 'crystal' ? 0.8 : 0.55;
    if (Math.random() < arcChance) this.spawnCoinArc(obstacle, canDouble ? 150 : 0);
    else if (Math.random() < 0.3) this.spawnCoinLine(x + 230 * u, 4);

    const pressure = meters < 120 ? 1.28 : meters > 720 ? 0.92 : 1;
    this.spawnTimer = randomRange(0.96, 1.56) * pressure;
  }

  private obstacleDims(kind: ObstacleKind): { w: number; h: number } {
    const u = this.state.unit;
    if (kind === 'spikes') return { w: randomRange(58, 92) * u, h: randomRange(26, 36) * u };
    if (kind === 'cactus') return { w: randomRange(34, 44) * u, h: randomRange(62, 86) * u };
    if (kind === 'pillar') return { w: randomRange(26, 34) * u, h: randomRange(88, 104) * u };
    if (kind === 'crystal') return { w: randomRange(34, 46) * u, h: randomRange(58, 88) * u };
    if (kind === 'driftwood') return { w: randomRange(68, 104) * u, h: randomRange(22, 32) * u };
    return { w: randomRange(34, 52) * u, h: randomRange(38, 58) * u };
  }

  private spawnCoinArc(obstacle: Obstacle, extraOffset: number): void {
    const s = this.state;
    const u = s.unit;
    const centerX = obstacle.x + obstacle.w / 2 + extraOffset * u;
    const centerY = s.groundY - 170 * u;
    const count = 5;
    const spread = 128 * u;
    for (let i = 0; i < count; i += 1) {
      const t = i / (count - 1);
      const x = centerX - spread / 2 + spread * t;
      const y = centerY + Math.pow(Math.abs(t - 0.5) * 2, 2) * 34 * u;
      s.coins.push({ x, y, r: 9.5 * u, phase: Math.random() * Math.PI * 2, bob: Math.random() * 6 });
    }
  }

  private spawnCoinLine(x: number, count: number): void {
    const s = this.state;
    const u = s.unit;
    for (let i = 0; i < count; i += 1) {
      s.coins.push({
        x: x + i * 36 * u,
        y: s.groundY - 30 * u,
        r: 9.5 * u,
        phase: i * 0.7,
        bob: i * 1.3,
      });
    }
  }

  private checkCollisions(): void {
    const s = this.state;
    const p = s.player;
    const u = s.unit;
    const px = p.x - p.w * 0.34;
    const py = p.y - p.h * 0.86;
    const pw = p.w * 0.68;
    const ph = p.h * 0.8;

    const invulnerable = s.now < s.invulnUntil;
    if (!invulnerable) {
      for (const obstacle of s.obstacles) {
        const ox = obstacle.x + 3 * u;
        const oy = obstacle.y + 3 * u;
        const ow = obstacle.w - 6 * u;
        const oh = obstacle.h - 3 * u;
        if (px < ox + ow && px + pw > ox && py < oy + oh && py + ph > oy) {
          this.die();
          return;
        }
      }
    }

    for (let i = s.coins.length - 1; i >= 0; i -= 1) {
      const coin = s.coins[i];
      const dx = coin.x - p.x;
      const dy = coin.y - (p.y - p.h * 0.5);
      const reach = coin.r + p.w * 0.34;
      if (dx * dx + dy * dy < reach * reach) {
        s.coins.splice(i, 1);
        s.runCoins += 1;
        this.addFloater(coin.x, coin.y - 6 * u, '+1', '#ffd24a', 15 * u);
        this.emitBurst(coin.x, coin.y, 7, '#ffd24a');
        sfx.coin();
        haptic('coin');
        this.callbacks.onCoin?.(s.runCoins);
      }
    }
  }

  private die(): void {
    const s = this.state;
    if (s.phase !== 'running') return;
    s.phase = 'dead';
    s.deathAge = 0;
    s.shake = 15 * s.unit;
    s.flash = 0.2;
    s.player.vy = -520 * s.unit;
    s.player.onGround = false;
    s.player.squashX = 1.1;
    s.player.squashY = 0.9;
    this.emitBurst(s.player.x, s.player.y - s.player.h * 0.5, 26, '#ff8a8a');
    this.emitBurst(s.player.x, s.player.y - s.player.h * 0.5, 12, '#ffffff');
    sfx.death();
    haptic('error');
    if (!this.deadNotified) {
      this.deadNotified = true;
      this.callbacks.onDeath?.(this.snapshot());
    }
  }

  private emitDust(x: number, y: number, count: number, color: string): void {
    const s = this.state;
    for (let i = 0; i < count; i += 1) {
      s.particles.push({
        x: x + randomRange(-10, 10) * s.unit,
        y: y - randomRange(0, 5) * s.unit,
        vx: randomRange(-90, 20) * s.unit,
        vy: randomRange(-110, -20) * s.unit,
        life: randomRange(0.35, 0.7),
        maxLife: 0.7,
        size: randomRange(1.5, 4) * s.unit,
        color,
        gravity: 180 * s.unit,
        rot: 0,
        vr: 0,
        kind: 'circle',
      });
    }
  }

  private emitBurst(x: number, y: number, count: number, color: string): void {
    const s = this.state;
    const palette = [color, '#ffd24a', '#ffffff', skinVisual(s.skinId).accent];
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = randomRange(60, 330) * s.unit;
      s.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60 * s.unit,
        life: randomRange(0.45, 1.05),
        maxLife: 1.05,
        size: randomRange(2, 5.5) * s.unit,
        color: palette[i % palette.length],
        gravity: 620 * s.unit,
        rot: Math.random() * Math.PI,
        vr: randomRange(-8, 8),
        kind: i % 3 === 0 ? 'star' : i % 3 === 1 ? 'square' : 'circle',
      });
    }
  }

  private addFloater(x: number, y: number, text: string, color: string, size: number): void {
    this.state.floaters.push({
      x,
      y,
      vy: -46 * this.state.unit,
      life: 0.95,
      maxLife: 0.95,
      text,
      color,
      size,
    });
  }

  private updateParticles(dt: number): void {
    const s = this.state;
    for (const particle of s.particles) {
      particle.vy += particle.gravity * dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.rot += particle.vr * dt;
      particle.life -= dt;
    }
    if (s.particles.length > 260) s.particles.splice(0, s.particles.length - 260);
    s.particles = s.particles.filter((particle) => particle.life > 0);
  }

  private updateFloaters(dt: number): void {
    const s = this.state;
    for (const floater of s.floaters) {
      floater.y += floater.vy * dt;
      floater.vy *= 0.97;
      floater.life -= dt;
    }
    s.floaters = s.floaters.filter((floater) => floater.life > 0);
  }

  destroy(): void {
    cancelAnimationFrame(this.raf);
    this.resizeObserver?.disconnect();
  }
}
