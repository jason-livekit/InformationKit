'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

/**
 * This component uses the `data-lk-theme` attribute to toggle the theme.
 *
 * @remarks
 * We fix the `attribute` prop to `data-lk-theme` because our Tailwind theme relies on this
 * attribute.
 */
export function ThemeProvider({
  children,
  ...props
}: Omit<React.ComponentProps<typeof NextThemesProvider>, 'attribute'>) {
  return (
    <NextThemesProvider {...props} attribute={['class', 'data-lk-theme']}>
      {children}
    </NextThemesProvider>
  );
}
