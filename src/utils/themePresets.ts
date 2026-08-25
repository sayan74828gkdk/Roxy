import { ThemeConfig } from '../types';

export const THEME_PRESETS: Record<string, ThemeConfig> = {
  sassy: {
    id: 'sassy',
    name: 'Vibrant Palette',
    primaryColor: '#ff2e88',
    glowColor: 'rgba(255, 46, 136, 0.45)',
    accentColor: '#bc13fe',
    bgGradient: 'radial-gradient(circle at 50% 40%, #150610 0%, #08080a 100%)',
    particleColor: '#ff2e88',
  },
  electric: {
    id: 'electric',
    name: 'Electric Cyan',
    primaryColor: '#00f2ff',
    glowColor: 'rgba(0, 242, 255, 0.45)',
    accentColor: '#38bdf8',
    bgGradient: 'radial-gradient(circle at 50% 40%, #04121a 0%, #08080a 100%)',
    particleColor: '#00f2ff',
  },
  crimson: {
    id: 'crimson',
    name: 'Fiery Violet',
    primaryColor: '#bc13fe',
    glowColor: 'rgba(188, 19, 254, 0.45)',
    accentColor: '#ff2e88',
    bgGradient: 'radial-gradient(circle at 50% 40%, #17051f 0%, #08080a 100%)',
    particleColor: '#bc13fe',
  },
  emerald: {
    id: 'emerald',
    name: 'Cyber Mint',
    primaryColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    accentColor: '#00f2ff',
    bgGradient: 'radial-gradient(circle at 50% 40%, #04170f 0%, #08080a 100%)',
    particleColor: '#10b981',
  },
  glamour: {
    id: 'glamour',
    name: 'Solar Neon',
    primaryColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    accentColor: '#ff2e88',
    bgGradient: 'radial-gradient(circle at 50% 40%, #1a0f03 0%, #08080a 100%)',
    particleColor: '#f59e0b',
  },
};

export const DEFAULT_THEME = THEME_PRESETS.sassy;

export function getThemeByMood(mood: string): ThemeConfig {
  const normalized = mood.toLowerCase().trim();
  if (THEME_PRESETS[normalized]) {
    return THEME_PRESETS[normalized];
  }
  if (normalized.includes('blue') || normalized.includes('cyan') || normalized.includes('electric')) {
    return THEME_PRESETS.electric;
  }
  if (normalized.includes('purple') || normalized.includes('violet') || normalized.includes('mystic') || normalized.includes('crimson')) {
    return THEME_PRESETS.crimson;
  }
  if (normalized.includes('green') || normalized.includes('emerald')) {
    return THEME_PRESETS.emerald;
  }
  if (normalized.includes('gold') || normalized.includes('yellow') || normalized.includes('glamour')) {
    return THEME_PRESETS.glamour;
  }
  return THEME_PRESETS.sassy;
}

