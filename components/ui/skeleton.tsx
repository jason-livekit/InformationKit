import * as React from 'react';

import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('bg-bg3 animate-pulse rounded', className)} {...props} />;
}
