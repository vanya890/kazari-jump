export interface Drone {
  id: string;
  name: string;
  description: string;
  color: string;
  glow: string;
  price: number;
  perk: string;
}

export interface CyberTheme {
  id: string;
  name: string;
  bg1: string;
  bg2: string;
  cyan: string;
  coral: string;
  yellow: string;
}

export const DRONES: Drone[] = [
  { id: 'phantom', name: 'Phantom X', description: 'Классический маневренный дрон', color: '#62f6e0', glow: 'rgba(98,246,224,0.78)', price: 0, perk: 'Стабильный отклик' },
  { id: 'solar', name: 'Solar Flare', description: 'Разогнанный плазменный двигатель', color: '#ff9f43', glow: 'rgba(255,159,67,0.78)', price: 150, perk: '+15% к очкам за комбо' },
  { id: 'void', name: 'Void Runner', description: 'Квантовая оболочка из тёмной материи', color: '#a55eea', glow: 'rgba(165,94,234,0.78)', price: 350, perk: 'Одна ошибка прощается за забег' },
  { id: 'cyber', name: 'Cyber Ninja', description: 'Сверхточный вектор тяги для профи', color: '#ff4757', glow: 'rgba(255,71,87,0.78)', price: 600, perk: 'Ускоренный набор энергии' }
];

export const THEMES: CyberTheme[] = [
  { id: 'synth', name: 'Neon Synth', bg1: '#080b18', bg2: '#0e1730', cyan: '#62f6e0', coral: '#ff6b6b', yellow: '#ffd166' },
  { id: 'matrix', name: 'Matrix Acid', bg1: '#020f08', bg2: '#062614', cyan: '#00ff7f', coral: '#ff3366', yellow: '#ccff00' },
  { id: 'cyberpunk', name: 'Neo Tokyo', bg1: '#120524', bg2: '#2c104e', cyan: '#ff00ff', coral: '#00ffff', yellow: '#ffea00' },
  { id: 'solar', name: 'Solar Sunset', bg1: '#1a0808', bg2: '#4a1515', cyan: '#ff7675', coral: '#fab1a0', yellow: '#ffeaa7' }
];
