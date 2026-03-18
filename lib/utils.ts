import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * Why? This is needed because tailwind-merge otherwise strips out the non standard classes like
 * `text-xxs`.
 */
const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['xxs'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs));
}
