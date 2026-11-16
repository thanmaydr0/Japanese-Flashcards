export type ThemeMode = 'modern-light' | 'modern-dark' | 'japanese-light' | 'japanese-dark';

export type ThemePalette = {
  id: ThemeMode;
  name: string;
  isDark: boolean;
  isJapanese: boolean;
  bg: string;
  paper: string;
  card: string;
  cardBorder: string;
  ink: string;
  inkSecondary: string;
  muted: string;
  faint: string;
  line: string;
  lineSubtle: string;
  forest: string;
  forestDark: string;
  forestSoft: string;
  forestBorder: string;
  coral: string;
  coralSoft: string;
  amber: string;
  amberSoft: string;
  blue: string;
  blueSoft: string;
  sakura: string;
  sakuraSoft: string;
  canvasBg: string;
  canvasBorder: string;
  canvasGrid: string;
  canvasStroke: string;
  tabBg: string;
  tabBorder: string;
  tabActive: string;
  tabInactive: string;
  accent: string;
  badgeBg: string;
  badgeText: string;
  surface: string;
  surfaceRaised: string;
  accentSoft: string;
};

export const MODERN_LIGHT: ThemePalette = {
  id: 'modern-light',
  name: 'Modern Clean',
  isDark: false,
  isJapanese: false,
  bg: '#F8FAFC',
  paper: '#FFFFFF',
  card: '#FFFFFF',
  cardBorder: '#E2E8F0',
  ink: '#0F172A',
  inkSecondary: '#334155',
  muted: '#64748B',
  faint: '#94A3B8',
  line: '#E2E8F0',
  lineSubtle: '#F1F5F9',
  forest: '#0D5247',
  forestDark: '#08332C',
  forestSoft: '#E6F4F0',
  forestBorder: '#B0DCD1',
  coral: '#E11D48',
  coralSoft: '#FFE4E8',
  amber: '#D97706',
  amberSoft: '#FEF3C7',
  blue: '#2563EB',
  blueSoft: '#EFF6FF',
  sakura: '#EC4899',
  sakuraSoft: '#FCE7F3',
  canvasBg: '#FFFFFF',
  canvasBorder: '#CBD5E1',
  canvasGrid: '#E2E8F0',
  canvasStroke: '#0F172A',
  tabBg: '#FFFFFF',
  tabBorder: '#E2E8F0',
  tabActive: '#0D5247',
  tabInactive: '#64748B',
  accent: '#0D5247',
  badgeBg: '#E6F4F0',
  badgeText: '#0D5247',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  accentSoft: '#E6F4F0',
};

export const MODERN_DARK: ThemePalette = {
  id: 'modern-dark',
  name: 'Obsidian Night',
  isDark: true,
  isJapanese: false,
  bg: '#0B0F17',
  paper: '#111827',
  card: '#161F30',
  cardBorder: '#1E293B',
  ink: '#F8FAFC',
  inkSecondary: '#CBD5E1',
  muted: '#94A3B8',
  faint: '#64748B',
  line: '#1E293B',
  lineSubtle: '#141E2F',
  forest: '#10B981',
  forestDark: '#059669',
  forestSoft: 'rgba(16, 185, 129, 0.16)',
  forestBorder: '#059669',
  coral: '#F43F5E',
  coralSoft: 'rgba(244, 63, 94, 0.16)',
  amber: '#F59E0B',
  amberSoft: 'rgba(245, 158, 11, 0.16)',
  blue: '#3B82F6',
  blueSoft: 'rgba(59, 130, 246, 0.16)',
  sakura: '#F472B6',
  sakuraSoft: 'rgba(244, 114, 182, 0.16)',
  canvasBg: '#131A29',
  canvasBorder: '#27354A',
  canvasGrid: '#1E293B',
  canvasStroke: '#F8FAFC',
  tabBg: '#0F172A',
  tabBorder: '#1E293B',
  tabActive: '#10B981',
  tabInactive: '#64748B',
  accent: '#10B981',
  badgeBg: 'rgba(16, 185, 129, 0.16)',
  badgeText: '#34D399',
  surface: '#111827',
  surfaceRaised: '#161F30',
  accentSoft: 'rgba(16, 185, 129, 0.16)',
};

export const JAPANESE_LIGHT: ThemePalette = {
  id: 'japanese-light',
  name: 'Kyoto Washi',
  isDark: false,
  isJapanese: true,
  bg: '#F7F4EB', // Washi rice paper
  paper: '#FFFEFA',
  card: '#FFFEFA',
  cardBorder: '#E8E1D3',
  ink: '#1C1917', // Traditional Sumi ink
  inkSecondary: '#44403C',
  muted: '#78716C', // Rikyu-grey
  faint: '#A8A29E',
  line: '#E7DFD1',
  lineSubtle: '#F0E9DC',
  forest: '#245A45', // Take-iro bamboo
  forestDark: '#173B2D',
  forestSoft: '#E6EFEA',
  forestBorder: '#B7D4C6',
  coral: '#C8392B', // Torii gate Bengara vermilion
  coralSoft: '#FBECE9',
  amber: '#C2831E', // Makie gold lacquer
  amberSoft: '#FAF0DE',
  blue: '#2B4A6F', // Aizome indigo
  blueSoft: '#E6EDF5',
  sakura: '#E06B84', // Japanese Sakura blossom
  sakuraSoft: '#FDF0F3',
  canvasBg: '#FFFEFB',
  canvasBorder: '#D8CFBF',
  canvasGrid: '#E8E1D4',
  canvasStroke: '#1C1917',
  tabBg: '#FFFDF7',
  tabBorder: '#E7DFD1',
  tabActive: '#C8392B',
  tabInactive: '#78716C',
  accent: '#C8392B',
  badgeBg: '#FBECE9',
  badgeText: '#C8392B',
  surface: '#FFFEFA',
  surfaceRaised: '#FFFEFA',
  accentSoft: '#FBECE9',
};

export const JAPANESE_DARK: ThemePalette = {
  id: 'japanese-dark',
  name: 'Kyoto Midnight',
  isDark: true,
  isJapanese: true,
  bg: '#0F0E11', // Urushi black lacquer
  paper: '#17161A',
  card: '#1B1A20',
  cardBorder: '#2E2B36',
  ink: '#FAF8F5',
  inkSecondary: '#D6D1C7',
  muted: '#A39C91',
  faint: '#6E675E',
  line: '#2B2833',
  lineSubtle: '#22202A',
  forest: '#34D399',
  forestDark: '#059669',
  forestSoft: 'rgba(52, 211, 153, 0.15)',
  forestBorder: '#059669',
  coral: '#FF6B6B', // Red lantern vermilion
  coralSoft: 'rgba(255, 107, 107, 0.16)',
  amber: '#F6C15C', // Kinpaku gold leaf
  amberSoft: 'rgba(246, 193, 92, 0.16)',
  blue: '#60A5FA',
  blueSoft: 'rgba(96, 165, 250, 0.15)',
  sakura: '#F472B6', // Yozakura night blossom
  sakuraSoft: 'rgba(244, 114, 182, 0.18)',
  canvasBg: '#141318',
  canvasBorder: '#35323E',
  canvasGrid: '#2B2833',
  canvasStroke: '#FAF8F5',
  tabBg: '#141318',
  tabBorder: '#2B2833',
  tabActive: '#F6C15C',
  tabInactive: '#8A8377',
  accent: '#F6C15C',
  badgeBg: 'rgba(246, 193, 92, 0.16)',
  badgeText: '#F6C15C',
  surface: '#17161A',
  surfaceRaised: '#1B1A20',
  accentSoft: 'rgba(246, 193, 92, 0.16)',
};

export const THEMES: Record<ThemeMode, ThemePalette> = {
  'modern-light': MODERN_LIGHT,
  'modern-dark': MODERN_DARK,
  'japanese-light': JAPANESE_LIGHT,
  'japanese-dark': JAPANESE_DARK,
};

// Default fallback export for legacy static references
export const C = MODERN_LIGHT;

export const R = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 9999,
};

export const S = {
  shadowSm: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  shadowMd: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  shadowLg: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
};
