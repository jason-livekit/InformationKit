'use client';

import * as React from 'react';
import { cn } from '@/lib/bytes/utils';

export type DotFillTone = 'fg' | 'accent' | 'success' | 'serious' | 'moderate';

interface DotFillProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: DotFillTone;
  /** Density: spacing between dots in px. Default 4 → 1px dot every 4px. */
  spacing?: number;
  /** Opacity of the entire dither layer. Default 1. */
  opacity?: number;
}

const TONE_VAR: Record<DotFillTone, string> = {
  fg: 'var(--fg1)',
  accent: 'var(--fgAccent1)',
  success: 'var(--fgSuccess)',
  serious: 'var(--fgSerious2)',
  moderate: 'var(--fgModerate)',
};

/**
 * Renders a 1px dot dither pattern as a positioned absolute fill. Pair with
 * `relative overflow-hidden` on the parent. The dither uses a CSS radial-gradient
 * so it scales to any container size and stays crisp on retina.
 */
export function DotFill({
  tone = 'fg',
  spacing = 4,
  opacity = 1,
  className,
  style,
  ...rest
}: DotFillProps) {
  const color = TONE_VAR[tone];
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0', className)}
      style={{
        backgroundImage: `radial-gradient(circle, ${color} 0.5px, transparent 0.6px)`,
        backgroundSize: `${spacing}px ${spacing}px`,
        opacity,
        ...style,
      }}
      {...rest}
    />
  );
}
