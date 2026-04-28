'use client';

import * as React from 'react';
import { CircleCheckIcon, CrossSmallIcon } from '@/icons/react';
import { cn } from '@/lib/bytes/utils';

export function ResultsSubmittedToast() {
  const [open, setOpen] = React.useState(true);

  React.useEffect(() => {
    const t = window.setTimeout(() => setOpen(false), 6000);
    return () => window.clearTimeout(t);
  }, []);

  if (!open) return null;
  return (
    <div
      className={cn(
        'border-separatorSuccess bg-bgSuccess1 text-fgSuccess flex items-center gap-3 rounded-lg border px-4 py-3',
      )}
      role="status"
    >
      <CircleCheckIcon className="h-4 w-4 shrink-0" />
      <span className="text-sm font-medium">
        Thanks! Your sort was submitted. Take it as many times as you want.
      </span>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setOpen(false)}
        className="text-fgSuccess hover:bg-bgSuccess2 ml-auto inline-flex h-6 w-6 items-center justify-center rounded"
      >
        <CrossSmallIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
