'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { CheckIcon, ChevronIcon, ChevronTopSmallIcon } from '@/components/bytes';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/bytes/utils';

const selectConfig = {
  variants: {
    variant: {
      primary:
        'border border-separator1 bg-bg2 text-fg1 hover:border-separator2 hover:bg-bg3 active:bg-bg2',
      ghost: '',
    },
    size: {
      sm: 'h-7 text-xs',
      md: 'h-9 text-sm',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'sm',
  },
} as const;

const selectTriggerVariants = cva(
  [
    'placeholder:text-fg3 group relative inline-flex items-center justify-between gap-1 px-2 py-2 whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
    'focus-visible:ring-fgAccent1 focus-visible:ring-offset-bg1 focus-visible:invalid:ring-fgSerious1 focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:outline-hidden',
    'rounded font-sans transition-all',
    'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  ],
  selectConfig,
);

const SelectContext = React.createContext<VariantProps<typeof selectTriggerVariants>>({});

interface SelectRootProps
  extends
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root>,
    VariantProps<typeof selectTriggerVariants> {}

const Select: React.FC<SelectRootProps> = ({
  variant = selectConfig.defaultVariants.variant,
  size = selectConfig.defaultVariants.size,
  ...props
}) => (
  <SelectContext.Provider value={{ variant, size }}>
    <SelectPrimitive.Root {...props} />
  </SelectContext.Provider>
);

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

interface SelectTriggerProps
  extends
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>,
    VariantProps<typeof selectTriggerVariants> {
  /* Show a chevron next to the selected value. Defaults to `true`. */
  withIcon?: boolean;
}

const SelectTrigger = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>(({ className, variant, size, children, withIcon = true, ...props }, ref) => {
  const { size: ctxSize, variant: ctxVariant } = React.useContext(SelectContext);
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        selectTriggerVariants({ variant: variant ?? ctxVariant, size: size ?? ctxSize }),
        'text-fg1 hover:bg-bg3 data-[state=open]:border-separator2 data-[state=open]:bg-bg3 transition-colors',
        className,
      )}
      {...props}
    >
      {children}
      {withIcon && (
        <SelectPrimitive.Icon asChild>
          <ChevronIcon className="text-fg3 w-5 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
        </SelectPrimitive.Icon>
      )}
    </SelectPrimitive.Trigger>
  );
});
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    <ChevronTopSmallIcon />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    <ChevronIcon />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => {
  const { size } = React.useContext(SelectContext);
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        data-size={size}
        className={cn(
          'border-separator1 bg-bg2 text-fg1 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-96 min-w-32 overflow-hidden rounded border drop-shadow-md',
          size === 'sm' && 'text-xs',
          size === 'md' && 'text-sm',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          className,
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            'p-1',
            position === 'popper' &&
              'h-(--radix-select-trigger-height) w-full min-w-(--radix-select-trigger-width)',
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      'text-xxs text-fg3 px-2 py-1.5 font-mono leading-none tracking-wide uppercase',
      className,
    )}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & {
    description?: string;
  }
>(({ className, children, description, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'text-fg1 focus:bg-bg3 data-[state=checked]:text-fg0 relative flex w-full cursor-default flex-col justify-center rounded py-1.5 pr-8 pl-2 text-inherit outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50',
      className,
    )}
    {...props}
  >
    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <CheckIcon className="text-fgAccent1 h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    {description && <div className="text-fg3 text-xs">{description}</div>}
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('bg-separator1 -mx-1 my-1 h-px', className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectContent,
  SelectContext,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
