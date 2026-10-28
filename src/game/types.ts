export type Phase = 'idle' | 'running' | 'paused' | 'dead';
export type RenderQuality = 'full' | 'lite';

export interface Player {
  x: number;
  y: number;
  w: number;
  h: number;
  vy: number;
  onGround: boolean;
  squashX: number;
  squashY: number;
  legPhase: number;
  blinkAt: number;
  tilt: number;
  idlePhase: number;
}

export type ObstacleKind = 'rock' | 'cactus' | 'spikes' | 'pillar' | 'driftwood' | 'crystal';

export interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: ObstacleKind;
  seed: number;
}

export interface Coin {
  x: number;
  y: number;
  r: number;
  phase: number;
  bob: number;
}

export interface Relic {
  x: number;
  y: number;
  r: number;
  phase: number;
  bob: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
  rot: number;
  vr: number;
  kind: 'circle' | 'square' | 'star';
}

export interface Floater {
  x: number;
  y: number;
  vy: number;
  life: number;
  maxLife: number;
  text: string;
  color: string;
  size: number;
}

export interface Cloud {
  x: number;
  y: number;
  scale: number;
  speed: number;
  alpha: number;
}

export interface GameState {
  w: number;
  h: number;
  dpr: number;
  quality: RenderQuality;
  unit: number;
  fieldX: number;
  fieldW: number;
  groundY: number;
  phase: Phase;
  player: Player;
  obstacles: Obstacle[];
  coins: Coin[];
  relics: Relic[];
  particles: Particle[];
  shield: boolean;
  floaters: Floater[];
  clouds: Cloud[];
  distancePx: number;
  distanceM: number;
  worldIndex: number;
  runCoins: number;
  speedPx: number;
  elapsedMs: number;
  now: number;
  shake: number;
  flash: number;
  deathAge: number;
  invulnUntil: number;
  revived: boolean;
  skinId: string;
  slowMoT: number;
}

export interface RunSnapshot {
  score: number;
  distance: number;
  coins: number;
  durationMs: number;
  revived: boolean;
}

export interface GameCallbacks {
  onCoin?: (total: number) => void;
  onDeath?: (run: RunSnapshot) => void;
  onTick?: (state: GameState) => void;
  onJump?: () => void;
  onWorld?: (index: number) => void;
}

export interface EngineOptions {
  canvas: HTMLCanvasElement;
  skinId: string;
  callbacks: GameCallbacks;
}
