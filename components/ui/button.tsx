import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'group relative inline-flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer',
    'rounded border font-sans transition-all',
    'focus-visible:ring-fgAccent1 focus-visible:ring-offset-bg1 focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:outline-hidden',
    // apply active scale when NOT aria-disabled (works for <button> and <a aria-disabled="true">)
    '[&:not([aria-disabled="true"])]:active:scale-[99%]',
    // keep native disabled for <button> + aria-disabled support for anchors
    'disabled:cursor-not-allowed disabled:opacity-60',
    'aria-disabled:cursor-not-allowed',
    'aria-disabled:opacity-60',
    'aria-disabled:pointer-events-none',
  ],
  {
    variants: {
      variant: {
        primary:
          'bg-fgAccent1 text-bg1 border-none ' +
          '[&:not([aria-disabled="true"])]:hover:bg-fgAccent2 [&:not([aria-disabled="true"])]:active:bg-fgAccent1 ' +
          'disabled:bg-gray-400',
        secondary:
          'border-separator1 bg-bg2 text-fg1 ' +
          '[&:not([aria-disabled="true"])]:hover:border-separator2 [&:not([aria-disabled="true"])]:hover:bg-bg3 [&:not([aria-disabled="true"])]:active:bg-bg2',
        outline:
          'border-separator1 bg-bg1 text-fg1 ' +
          '[&:not([aria-disabled="true"])]:hover:border-separator2 [&:not([aria-disabled="true"])]:hover:bg-bg2 [&:not([aria-disabled="true"])]:hover:text-fg1 [&:not([aria-disabled="true"])]:active:bg-bg1',
        ghost:
          'text-fg1 border-none bg-transparent ' +
          '[&:not([aria-disabled="true"])]:hover:bg-bg2 [&:not([aria-disabled="true"])]:active:bg-transparent',
        destructive:
          'border-separatorSerious1 bg-bgSerious1 text-fgSerious1 focus-visible:ring-fgSerious1 ' +
          '[&:not([aria-disabled="true"])]:hover:bg-fgSerious1 [&:not([aria-disabled="true"])]:hover:text-bg1 [&:not([aria-disabled="true"])]:active:bg-bgSerious2 [&:not([aria-disabled="true"])]:hover:border-transparent',
      },
      size: {
        sm: 'h-7 px-2 py-1 text-xs font-semibold',
        lg: 'h-9 px-3 py-2 text-base font-semibold',
        xl: 'h-11 gap-3 p-3 text-[0.875rem] font-semibold',
        icon: 'h-7 w-8',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'sm',
    },
  },
);

const BUTTON_VARIANTS: Exclude<VariantProps<typeof buttonVariants>['variant'], null | undefined>[] =
  ['primary', 'secondary', 'outline', 'ghost', 'destructive'] as const;
const BUTTON_SIZES: Exclude<VariantProps<typeof buttonVariants>['size'], null | undefined>[] = [
  'sm',
  'lg',
  'xl',
  'icon',
] as const;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  leftIcon?: React.ReactElement;
  rightIcon?: React.ReactElement;
  asChild?: boolean;
}

export function prepareIcon(
  icon: React.ReactElement,
  buttonSize?: (typeof BUTTON_SIZES)[number] | null,
): React.ReactElement {
  let extraClassNames = 'w-3 h-3 ';
  switch (buttonSize) {
    case 'sm':
    case 'icon':
      extraClassNames = 'w-3 h-3';
      break;
    case 'lg':
    case 'xl':
      extraClassNames = 'w-4 h-4';
      break;
  }

  return React.cloneElement(icon, {
    // @ts-expect-error React 19
    ...icon.props,
    // @ts-expect-error React 19
    className: cn(extraClassNames, icon.props.className, 'group-data-[pending=true]:opacity-0'),
  });
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, leftIcon, rightIcon, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const leftIconPrepared = leftIcon ? prepareIcon(leftIcon, size) : null;
    const rightIconPrepared = rightIcon ? prepareIcon(rightIcon, size) : null;

    return (
      <Comp
        ref={ref}
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {leftIconPrepared}
        {props.children}
        {rightIconPrepared}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants, BUTTON_VARIANTS, BUTTON_SIZES };
