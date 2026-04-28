import * as React from 'react';

import { cn } from '@/lib/bytes/utils';

export type SpinnerProps = React.SVGProps<SVGSVGElement> & {
  diameter?: number;
  strokeWidth?: number;
};

export const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ diameter = 20, strokeWidth = 4, className, ...props }, ref) => (
    <svg
      className={cn('animate-spin', className)}
      fill="none"
      viewBox="0 0 24 24"
      width={diameter}
      height={diameter}
      {...props}
      ref={ref}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      ></circle>
      <path
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  ),
);
