'use client';

import { cn } from '@/lib/utils';

export interface NewBadgeProps {
  title?: string;
  className?: string;
}

export const NewBadge = ({ title, className }: NewBadgeProps) => (
  <span
    className={cn(
      'bg-bgAccent1 text-fgAccent1 rounded-sm px-2 py-1 font-mono text-[0.65rem] leading-none tracking-wide uppercase',
      className,
    )}
  >
    {title ?? 'New'}
  </span>
);
