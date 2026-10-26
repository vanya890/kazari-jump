export type Lang = 'ru' | 'en';
export type Scope = 'global' | 'squad';

export interface Profile {
  id: number;
  name: string;
  username: string | null;
  photoUrl: string | null;
  bestScore: number;
  coins: number;
  games: number;
  totalDistance: number;
  activeSkin: string;
  ownedSkins: string[];
  supporter: boolean;
  freeRevive: boolean;
  referrals: number;
  rank: number;
  createdAt?: string;
}

export interface Product {
  id: string;
  kind: 'skin' | 'coins' | 'supporter';
  skinId?: string;
  title: { ru: string; en: string };
  description: { ru: string; en: string };
  priceCoins?: number;
  priceStars?: number;
  amount?: number;
  unique?: boolean;
}

export interface LeaderboardRow {
  id: number;
  name: string;
  username: string | null;
  photoUrl: string | null;
  bestScore: number;
  rank: number;
  isMe?: boolean;
}

export interface LeaderboardData {
  scope: Scope;
  rows: LeaderboardRow[];
  me: Profile;
  total: number;
}

export interface BootstrapData {
  profile: Profile;
  products: Product[];
  top: LeaderboardRow[];
  totalPlayers: number;
  botUsername: string | null;
  startParam: string | null;
  challengeScore: number | null;
  offline?: boolean;
}

export interface SubmitResult {
  profile: Profile;
  coinsBanked: number;
  newBest: boolean;
  rank: number;
  runId: number | null;
}

export interface RunResult {
  score: number;
  distance: number;
  coins: number;
  durationMs: number;
  revived: boolean;
}
