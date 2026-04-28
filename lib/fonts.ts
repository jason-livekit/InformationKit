import { Public_Sans } from 'next/font/google';

/**
 * Public Sans
 *
 * @see {@link https://fonts.google.com/specimen/Public+Sans | Public Sans website}
 */
export const sansFont = Public_Sans({
  variable: '--font-public-sans',
  subsets: ['latin'],
  preload: true,
});

// Re-exports of bytes-core font definitions. CommitMono and TWK Everett font files are not bundled
// in this starter — mono and display stacks fall back to system fonts.
export const fontSize: Record<
  string,
  | string
  | [string, string]
  | [string, { lineHeight?: string; letterSpacing?: string; fontWeight?: string | number }]
> = {
  xxs: ['0.63rem', { lineHeight: '1rem', fontWeight: '400' }],
  xs: ['0.75rem', { lineHeight: '1rem', fontWeight: '400' }],
  sm: ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400', letterSpacing: '0.01em' }],
  base: ['1rem', { lineHeight: '1.7rem', fontWeight: '400', letterSpacing: '0.01em' }],
  lg: ['1.125rem', { lineHeight: '1.75rem', fontWeight: '400' }],
  xl: ['1.25rem', { lineHeight: '2rem', fontWeight: '400' }],
  '2xl': ['1.5rem', { lineHeight: '2rem', fontWeight: '400' }],
  '3xl': ['1.875rem', { lineHeight: '2.25rem', fontWeight: '400' }],
  '4xl': ['2.25rem', { lineHeight: '2.5rem', fontWeight: '400' }],
  '5xl': ['3rem', { lineHeight: '1', fontWeight: '400' }],
  '6xl': ['3.75rem', { lineHeight: '1', fontWeight: '400' }],
  '7xl': ['4.5rem', { lineHeight: '1', fontWeight: '400' }],
  '8xl': ['6rem', { lineHeight: '1', fontWeight: '400' }],
  '9xl': ['8rem', { lineHeight: '1', fontWeight: '400' }],
} as const;

export const fontWeight: Record<string, string> = {
  thin: '150',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const fontFamily: Record<string, string[]> = {
  sans: [
    '"Public Sans"',
    'ui-sans-serif',
    'system-ui',
    'sans-serif',
    'Apple Color Emoji',
    'Segoe UI Emoji',
    'Segoe UI Symbol',
    'Noto Color Emoji',
  ],
  mono: [
    '"CommitMono"',
    'ui-monospace',
    'SFMono-Regular',
    'Menlo',
    'Monaco',
    'Consolas',
    'Liberation Mono',
    'Courier New',
    'monospace',
  ],
  display: [
    '"TWK Everett"',
    'ui-sans-serif',
    'system-ui',
    'sans-serif',
    'Apple Color Emoji',
    'Segoe UI Emoji',
    'Segoe UI Symbol',
    'Noto Color Emoji',
  ],
} as const;
