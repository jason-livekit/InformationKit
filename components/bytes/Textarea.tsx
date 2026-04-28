import * as React from 'react';

import { PASSWORD_MANAGER_IGNORE_ATTRS } from '@/lib/bytes';
import { cn } from '@/lib/bytes/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: 'small' | 'medium';
  hasBorder?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows, size = 'small', hasBorder = true, ...props }, ref) => {
    return (
      <textarea
        {...PASSWORD_MANAGER_IGNORE_ATTRS}
        className={cn(
          'text-fg1',
          'bg-bg1 placeholder:text-fg4 flex w-full rounded px-3 py-2 transition-colors file:border-0 file:bg-transparent disabled:cursor-not-allowed disabled:opacity-50',
          'focus-visible:ring-fgAccent1 focus-visible:ring-offset-bg1 focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:outline-hidden focus-visible:invalid:ring-red-300',
          'read-only:bg-bg2 read-only:accent-separator1',
          size === 'small' ? 'text-xs' : 'text-sm',
          hasBorder ? 'border-separator2 border' : '',
          className,
        )}
        rows={rows ?? 4}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = 'Textarea';

export { Textarea };
