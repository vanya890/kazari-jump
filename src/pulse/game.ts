interface PulseCallbacks {
  onScore(value: number, streak: number): void;
  onPulse(): void;
  onEnd(value: number, streak: number): void;
}

interface Gate {
  x: number;
  gapY: number;
  gap: number;
  width: number;
  passed: boolean;
  phase: number;
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export class PulseGame {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly callbacks: PulseCallbacks;
  private width = 360;
  private height = 720;
  private dpr = 1;
  private raf = 0;
  private previousTime = 0;
  private playerY = 0;
  private velocity = 0;
  private elapsed = 0;
  private spawnTimer = 0;
  private gates: Gate[] = [];
  private particles: Array<{ x: number; y: number; vx: number; vy: number; life: number; size: number; color: string }> = [];
  private running = false;
  private paused = false;
  private currentScore = 0;
  private currentStreak = 0;
  private pulseFlash = 0;
  private lastPulse = -1;
  private readonly stars = Array.from({ length: 42 }, (_, index) => ({ x: (index * 83.7) % 1, y: (index * 47.3) % 1, size: 0.7 + (index % 3) * 0.5, alpha: 0.18 + (index % 4) * 0.08 }));

  constructor(canvas: HTMLCanvasElement, callbacks: PulseCallbacks) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Pulse Drift requires Canvas 2D');
    this.context = context;
    this.callbacks = callbacks;
  }

  get score(): number { return this.currentScore; }
  get isPaused(): boolean { return this.paused; }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.max(300, rect.width);
    this.height = Math.max(560, rect.height);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (!this.running) this.playerY = this.height * 0.48;
  }

  start(): void {
    window.cancelAnimationFrame(this.raf);
    this.running = true;
    this.paused = false;
    this.currentScore = 0;
    this.currentStreak = 0;
    this.elapsed = 0;
    this.spawnTimer = 0.5;
    this.playerY = this.height * 0.48;
    this.velocity = 0;
    this.pulseFlash = 0;
    this.lastPulse = -1;
    this.gates = [];
    this.particles = [];
    this.previousTime = performance.now();
    this.raf = window.requestAnimationFrame(this.frame);
  }

  reset(): void {
    this.running = false;
    this.paused = false;
    window.cancelAnimationFrame(this.raf);
    this.gates = [];
    this.particles = [];
    this.draw(0.016);
  }

  pause(): void { if (this.running) { this.paused = true; window.cancelAnimationFrame(this.raf); } }
  resume(): void { if (this.running && this.paused) { this.paused = false; this.previousTime = performance.now(); this.raf = window.requestAnimationFrame(this.frame); } }

  pulse(): void {
    if (!this.running || this.paused) return;
    const now = performance.now();
    if (now - this.lastPulse < 90) return;
    this.lastPulse = now;
    this.velocity = -470;
    this.pulseFlash = 1;
    this.callbacks.onPulse();
    this.emitBurst(this.width * 0.25, this.playerY, 7, '#62f6e0');
  }

  private frame = (time: number): void => {
    if (!this.running || this.paused) return;
    const dt = Math.min((time - this.previousTime) / 1000, 0.034);
    this.previousTime = time;
    this.update(dt);
    this.draw(dt);
    this.raf = window.requestAnimationFrame(this.frame);
  };

  private update(dt: number): void {
    this.elapsed += dt;
    this.velocity += 1120 * dt;
    this.playerY += this.velocity * dt;
    this.pulseFlash = Math.max(0, this.pulseFlash - dt * 4.5);
    const speed = 220 + Math.min(130, this.elapsed * 4.5);
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnGate();
      this.spawnTimer = Math.max(0.94, 1.35 - this.elapsed * 0.006);
    }

    for (const gate of this.gates) gate.x -= speed * dt;
    this.gates = this.gates.filter((gate) => {
      if (!gate.passed && gate.x + gate.width < this.width * 0.25) {
        gate.passed = true;
        const centerDistance = Math.abs(this.playerY - gate.gapY);
        this.currentScore += 1;
        this.currentStreak = centerDistance < gate.gap * 0.22 ? this.currentStreak + 1 : 0;
        this.emitBurst(this.width * 0.25, this.playerY, 10, this.currentStreak > 1 ? '#ffd166' : '#62f6e0');
        this.callbacks.onScore(this.currentScore, this.currentStreak);
      }
      return gate.x > -gate.width - 30;
    });

    for (const particle of this.particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 100 * dt;
      particle.life -= dt * 1.8;
    }
    this.particles = this.particles.filter((particle) => particle.life > 0);

    const playerX = this.width * 0.25;
    const radius = 15;
    const top = 95;
    const bottom = this.height - 84;
    if (this.playerY - radius < top) { this.playerY = top + radius; this.velocity = Math.abs(this.velocity) * 0.45; }
    else if (this.playerY + radius > bottom) { this.playerY = bottom - radius; this.velocity = -Math.abs(this.velocity) * 0.45; }
    if (this.hitsGate(playerX, radius)) {
      this.running = false;
      this.callbacks.onEnd(this.currentScore, this.currentStreak);
    }
  }

  private hitsGate(playerX: number, radius: number): boolean {
    return this.gates.some((gate) => {
      const inX = playerX + radius > gate.x && playerX - radius < gate.x + gate.width;
      if (!inX) return false;
      return this.playerY - radius < gate.gapY - gate.gap / 2 || this.playerY + radius > gate.gapY + gate.gap / 2;
    });
  }

  private spawnGate(): void {
    const margin = 155;
    const minGapY = 95 + margin;
    const maxGapY = this.height - 84 - margin;
    const wave = Math.sin(this.elapsed * 0.68) * 0.5 + 0.5;
    const noise = ((this.currentScore * 37) % 17) / 17;
    const gapY = minGapY + ((wave * 0.62 + noise * 0.38) % 1) * (maxGapY - minGapY);
    const gap = Math.max(132, 190 - Math.min(55, this.elapsed * 1.7));
    this.gates.push({ x: this.width + 34, gapY, gap, width: 23, passed: false, phase: this.elapsed * 2.4 });
  }

  private emitBurst(x: number, y: number, count: number, color: string): void {
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 90;
      this.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.5 + Math.random() * 0.5, size: 1 + Math.random() * 2.5, color });
    }
  }

  private draw(dt: number): void {
    const ctx = this.context;
    const w = this.width;
    const h = this.height;
    const t = this.elapsed;
    ctx.clearRect(0, 0, w, h);

    const background = ctx.createLinearGradient(0, 0, w, h);
    background.addColorStop(0, '#080b18');
    background.addColorStop(0.55, '#0e1730');
    background.addColorStop(1, '#07131f');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, w, h);

    const glow = ctx.createRadialGradient(w * 0.25, h * 0.46, 0, w * 0.25, h * 0.46, h * 0.55);
    glow.addColorStop(0, `rgba(98,246,224,${0.12 + this.pulseFlash * 0.12})`);
    glow.addColorStop(0.55, 'rgba(39,92,128,0.04)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    for (const star of this.stars) {
      ctx.fillStyle = `rgba(217,228,240,${star.alpha})`;
      ctx.fillRect((star.x * w + t * (4 + star.size * 3)) % w, star.y * h, star.size, star.size);
    }

    const horizon = h - 84;
    ctx.strokeStyle = 'rgba(98,246,224,0.09)';
    ctx.lineWidth = 1;
    for (let index = 0; index < 5; index += 1) {
      const y = horizon - index * 24;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(98,246,224,0.17)';
    ctx.beginPath(); ctx.moveTo(0, horizon); ctx.lineTo(w, horizon); ctx.stroke();

    for (const gate of this.gates) this.drawGate(gate, t);
    this.drawParticles();
    this.drawPlayer(t);
    this.drawSignalLine(t);
    void dt;
  }

  private drawGate(gate: Gate, t: number): void {
    const ctx = this.context;
    const top = 76;
    const bottom = this.height - 84;
    const pulse = Math.sin(t * 4 + gate.phase) * 0.5 + 0.5;
    ctx.save();
    ctx.shadowColor = 'rgba(255,107,107,0.46)';
    ctx.shadowBlur = 12 + pulse * 8;
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(gate.x, top, gate.width, Math.max(0, gate.gapY - gate.gap / 2 - top));
    ctx.fillRect(gate.x, gate.gapY + gate.gap / 2, gate.width, Math.max(0, bottom - gate.gapY - gate.gap / 2));
    ctx.shadowBlur = 0;
    ctx.fillStyle = `rgba(255,209,102,${0.55 + pulse * 0.35})`;
    ctx.fillRect(gate.x - 3, gate.gapY - gate.gap / 2 - 2, gate.width + 6, 4);
    ctx.fillRect(gate.x - 3, gate.gapY + gate.gap / 2 - 2, gate.width + 6, 4);
    ctx.globalAlpha = 0.18 + pulse * 0.12;
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(gate.x - 18, top, 1, gate.gapY - gate.gap / 2 - top);
    ctx.fillRect(gate.x - 18, gate.gapY + gate.gap / 2, 1, bottom - gate.gapY - gate.gap / 2);
    ctx.restore();
  }

  private drawPlayer(t: number): void {
    const ctx = this.context;
    const x = this.width * 0.25;
    const y = this.playerY;
    const radius = 13 + this.pulseFlash * 4;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(clamp(this.velocity / 1800, -0.28, 0.35));
    ctx.shadowColor = 'rgba(98,246,224,0.78)';
    ctx.shadowBlur = 20 + this.pulseFlash * 22;
    ctx.fillStyle = '#62f6e0';
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0b2030';
    ctx.beginPath(); ctx.arc(3, -2, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d9e4f0';
    ctx.beginPath(); ctx.arc(4, -3, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(217,228,240,0.62)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-radius - 3, 5); ctx.lineTo(-radius - 12, 9 + Math.sin(t * 11) * 2); ctx.stroke();
    ctx.restore();
  }

  private drawSignalLine(t: number): void {
    const ctx = this.context;
    const x = this.width * 0.25;
    ctx.save();
    ctx.strokeStyle = `rgba(98,246,224,${0.18 + this.pulseFlash * 0.2})`;
    ctx.setLineDash([2, 12]);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, 72); ctx.lineTo(x, this.height - 84); ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = `rgba(98,246,224,${0.12 + this.pulseFlash * 0.18})`;
    ctx.beginPath(); ctx.arc(x, this.playerY, 26 + this.pulseFlash * 24 + Math.sin(t * 4) * 2, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  private drawParticles(): void {
    const ctx = this.context;
    for (const particle of this.particles) {
      ctx.globalAlpha = clamp(particle.life, 0, 1);
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    }
    ctx.globalAlpha = 1;
  }
}
