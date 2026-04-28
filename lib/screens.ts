/**
 * Breakpoints for responsive design. These values are the default set in Tailwind, and likely
 * should not be changed.
 *
 * @see {@link https://tailwindcss.com/docs/responsive-design#overview | Tailind Responsive Design}
 */
export const screens = {
  sm: '640px', // Small screens (mobile)
  md: '768px', // Medium screens (tablet)
  lg: '1024px', // Large screens (laptop)
  xl: '1280px', // Extra large screens (desktop)
  '2xl': '1536px', // 2x extra large (big monitors)
} as const;
