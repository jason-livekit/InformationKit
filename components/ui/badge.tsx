import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

export const sizes = {
  large: 'px-1.5 py-0.5 text-xs ',
  medium: 'px-1 py-0.5 text-xxs',
} as const;

export const variants = {
  muted: 'bg-bg3 text-fg3',
  accent: 'bg-bgAccent2 text-fgAccent1',
  success: 'bg-bgSuccess2 text-fgSuccess',
  warning: 'bg-bgModerate2 text-fgModerate',
  error: 'text-fg bg-bgSerious2 text-fgSerious1',
} as const;

const badgeVariants = cva(
  'pointer-events-none inline-flex h-min w-fit items-center justify-center gap-1 rounded font-mono font-semibold tracking-wider whitespace-nowrap uppercase select-none',
  {
    variants: {
      size: sizes,
      variant: variants,
    },
    defaultVariants: {
      size: 'medium',
      variant: 'muted',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  leftIcon?: React.ReactElement<{ className?: string }>;
  rightIcon?: React.ReactElement<{ className?: string }>;
}

function sizeIcon(variant: VariantProps<typeof badgeVariants>['size']) {
  return ((size) => {
    switch (size) {
      case 'medium':
        return 'w-2.5 h-2.5';
      case undefined:
      case null:
      case 'large':
        return 'w-3 h-3';
    }
  })(variant);
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, leftIcon, rightIcon, ...props }, ref) => {
    const iconSize = sizeIcon(size);
    return (
      <div className={cn(badgeVariants({ variant, size, className }))} ref={ref} {...props}>
        {leftIcon &&
          React.cloneElement(leftIcon, {
            className: cn(iconSize, leftIcon.props?.className),
          })}
        {props.children}
        {rightIcon &&
          React.cloneElement(rightIcon, {
            className: cn(iconSize, rightIcon.props?.className),
          })}
      </div>
    );
  },
);
Badge.displayName = 'Badge';

export { Badge };
