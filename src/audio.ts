type Wave = OscillatorType;

class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  enabled = true;
  private lastCoin = 0;

  setEnabled(value: boolean): void {
    this.enabled = value;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(value ? 0.5 : 0, this.ctx.currentTime, 0.02);
    }
  }

  unlock(): void {
    if (!this.enabled) return;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  private tone(
    from: number,
    to: number,
    duration: number,
    type: Wave = 'sine',
    volume = 0.2,
    delay = 0,
  ): void {
    if (!this.enabled) return;
    this.unlock();
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  jump(): void {
    this.tone(340, 640, 0.13, 'triangle', 0.16);
  }

  doubleJump(): void {
    this.tone(500, 900, 0.12, 'triangle', 0.13);
  }

  coin(): void {
    const now = performance.now();
    if (now - this.lastCoin < 32) return;
    this.lastCoin = now;
    this.tone(980, 1180, 0.055, 'sine', 0.14);
    this.tone(1480, 1480, 0.07, 'sine', 0.09, 0.045);
  }

  death(): void {
    this.tone(240, 55, 0.38, 'sawtooth', 0.16);
    this.tone(120, 45, 0.45, 'square', 0.06, 0.04);
  }

  click(): void {
    this.tone(620, 760, 0.055, 'triangle', 0.1);
  }

  purchase(): void {
    this.tone(523, 523, 0.09, 'sine', 0.14);
    this.tone(659, 659, 0.09, 'sine', 0.14, 0.09);
    this.tone(784, 784, 0.14, 'sine', 0.16, 0.18);
  }

  revive(): void {
    this.tone(330, 660, 0.14, 'sine', 0.14);
    this.tone(494, 988, 0.18, 'sine', 0.12, 0.12);
  }

  record(): void {
    this.tone(660, 660, 0.08, 'triangle', 0.12);
    this.tone(880, 880, 0.08, 'triangle', 0.12, 0.08);
    this.tone(1100, 1100, 0.16, 'triangle', 0.14, 0.16);
  }
}

export const sfx = new Sfx();
