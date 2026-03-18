import * as React from 'react';

import { PASSWORD_MANAGER_IGNORE_ATTRS } from '@/lib/form';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        {...PASSWORD_MANAGER_IGNORE_ATTRS}
        type={type}
        className={cn(
          'text-fg2 text-sm file:font-medium',
          'border-separator2 bg-bg1 placeholder:text-fg4 flex h-8 w-full rounded border px-3 py-1 transition-colors file:border-0 file:bg-transparent file:text-sm',
          'accent-fgAccent1 focus-visible:ring-fgAccent1 focus-visible:ring-offset-bg1 focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:outline-hidden focus-visible:invalid:ring-red-300',
          'read-only:bg-bg2 read-only:accent-separator1',
          'disabled:border-separator1 disabled:text-fg4 disabled:cursor-not-allowed',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
