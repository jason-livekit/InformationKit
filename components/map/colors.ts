import type { MapColor } from '@/lib/repo/schemas';

/** Order shown in the color picker. */
export const MAP_COLORS: MapColor[] = [
  'neutral',
  'blue',
  'indigo',
  'purple',
  'pink',
  'red',
  'orange',
  'amber',
  'green',
  'teal',
];

interface CardSurface {
  /** Filled card background + border + text. */
  bg: string;
  border: string;
  text: string;
  /** A small swatch class for the picker. */
  swatch: string;
}

/** Card surface classes. Colored cards use the theme-invariant raw scales so a
 *  card keeps its identity in both light and dark mode; `neutral` follows the
 *  surface tokens. */
export const CARD_SURFACE: Record<MapColor, CardSurface> = {
  neutral: {
    bg: 'bg-bg1',
    border: 'border-separator2',
    text: 'text-fg0',
    swatch: 'bg-bg3 border border-separator2',
  },
  blue: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-900', swatch: 'bg-blue-400' },
  indigo: { bg: 'bg-indigo-100', border: 'border-indigo-300', text: 'text-indigo-900', swatch: 'bg-indigo-400' },
  purple: { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-900', swatch: 'bg-purple-400' },
  pink: { bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-900', swatch: 'bg-pink-400' },
  red: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-900', swatch: 'bg-red-400' },
  orange: { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-900', swatch: 'bg-orange-400' },
  amber: { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-900', swatch: 'bg-amber-400' },
  green: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-900', swatch: 'bg-green-400' },
  teal: { bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-900', swatch: 'bg-teal-400' },
};

/** Mid-tone hex per color, used for data-card chart strokes/fills. Values mirror
 *  the raw color scales defined in globals.css (theme-invariant). */
export const COLOR_HEX: Record<MapColor, string> = {
  neutral: '#737070',
  blue: '#395CF9',
  indigo: '#4C69FA',
  purple: '#BA1FF9',
  pink: '#F91F8C',
  red: '#FA4C39',
  orange: '#F97A1F',
  amber: '#FFA424',
  green: '#1EB66A',
  teal: '#06DBB7',
};

export function colorLabel(color: MapColor): string {
  return color.charAt(0).toUpperCase() + color.slice(1);
}
