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
