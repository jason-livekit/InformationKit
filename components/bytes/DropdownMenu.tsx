'use client';

import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { cva, type VariantProps } from 'class-variance-authority';

import { CheckIcon, ChevronRightSmallIcon, CirclePlaceholderOnIcon } from '@/icons/react';
import { overlayContentAnimationStyles, overlayContentStyles } from '@/lib/bytes/overlay-styles';
import { cn } from '@/lib/bytes/utils';

/** @see {@link https://www.radix-ui.com/primitives/docs/components/dropdown-menu#root} */
const DropdownMenu = DropdownMenuPrimitive.Root;

/** @see {@link https://www.radix-ui.com/primitives/docs/components/dropdown-menu#trigger} */
const DropdownMenuTrigger = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.Trigger
    ref={ref}
    className={cn(
      'focus-visible:ring-fgAccent1 focus-visible:ring-offset-bg1 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-offset-2',
      className,
    )}
    {...props}
  >
    {children}
  </DropdownMenuPrimitive.Trigger>
));
DropdownMenuTrigger.displayName = DropdownMenuPrimitive.Trigger.displayName;

/** @see {@link https://www.radix-ui.com/primitives/docs/components/dropdown-menu#group} */
const DropdownMenuGroup = DropdownMenuPrimitive.Group;

/** @see {@link https://www.radix-ui.com/primitives/docs/components/dropdown-menu#portal} */
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

/** @see {@link https://www.radix-ui.com/primitives/docs/components/dropdown-menu#sub} */
const DropdownMenuSub = DropdownMenuPrimitive.Sub;

/** @see {@link https://www.radix-ui.com/primitives/docs/components/dropdown-menu#subcontent} */
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

/** @see {@link https://www.radix-ui.com/primitives/docs/components/dropdown-menu#subtrigger} */
const DropdownMenuSubTrigger = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      'focus:bg-bg3 data-[state=open]:bg-bg3 outline-hidden focus:outline-hidden flex cursor-default select-none items-center rounded px-2 py-1.5 text-xs',
      inset && 'pl-8',
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRightSmallIcon className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

/** @see {@link https://www.radix-ui.com/primitives/docs/components/dropdown-menu#subcontent} */
const DropdownMenuSubContent = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      'border-separator1 bg-bg2 text-fg1 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-32 overflow-hidden rounded border p-1 shadow-lg',
      className,
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

/** @see {@link https://www.radix-ui.com/primitives/docs/components/dropdown-menu#content} */
const DropdownMenuContent = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, align = 'start', sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(overlayContentStyles, overlayContentAnimationStyles, className)}
      collisionPadding={16}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const dropdownMenuItemVariants = cva(
  [
    'focus:bg-bg3 relative flex cursor-pointer items-center rounded px-2 py-1.5 text-xs outline-hidden transition-colors select-none data-disabled:pointer-events-none data-disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        primary:
          'text-fg0 data-disabled:bg-separator2 data-[highlighted]:bg-bgAccent1 data-[highlighted]:text-fgAccent1 dark:data-[highlighted]:bg-bgAccent2',
        secondary: 'bg-bg2 text-fg1 active:bg-bg2 data-highlighted:bg-bg3',
        destructive:
          'text-fgSerious1 focus-visible:ring-fgSerious1 active:bg-bgSerious2 data-[highlighted]:bg-bgSerious1 dark:data-[highlighted]:bg-bgSerious2',
      },
    },
    defaultVariants: {
      variant: 'secondary',
    },
  },
);

interface DropdownMenuItemProps
  extends
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>,
    VariantProps<typeof dropdownMenuItemVariants> {
  inset?: boolean;
}

/** @see {@link https://www.radix-ui.com/primitives/docs/components/dropdown-menu#item} */
const DropdownMenuItem = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Item>,
  DropdownMenuItemProps
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(dropdownMenuItemVariants({ variant: props.variant }), inset && 'pl-8', className)}
    {...props}
  />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

/** @see {@link https://www.radix-ui.com/primitives/docs/components/dropdown-menu#checkboxitem} */
const DropdownMenuCheckboxItem = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      'focus:bg-bg3 focus:text-fg1 outline-hidden data-disabled:pointer-events-none data-disabled:opacity-50 relative flex cursor-default select-none items-center rounded py-1.5 pl-8 pr-2 text-xs transition-colors',
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <CheckIcon className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

/** @see {@link https://www.radix-ui.com/primitives/docs/components/dropdown-menu#radioitem} */
const DropdownMenuRadioItem = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      'focus:bg-bg3 focus:text-fg1 outline-hidden data-disabled:pointer-events-none data-disabled:opacity-50 relative flex cursor-default select-none items-center rounded py-1.5 pl-8 pr-2 text-xs transition-colors',
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <CirclePlaceholderOnIcon className="h-4 w-4 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

/** @see {@link https://www.radix-ui.com/primitives/docs/components/dropdown-menu#label} */
const DropdownMenuLabel = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn('px-2 py-1.5 text-xs font-semibold', inset && 'pl-8', className)}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

/** @see {@link https://www.radix-ui.com/primitives/docs/components/dropdown-menu#separator} */
const DropdownMenuSeparator = React.forwardRef<
  React.ComponentRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn('bg-separator1 -mx-1 my-1 h-px', className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span className={cn('ml-auto text-xs tracking-widest opacity-60', className)} {...props} />
  );
};
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
};
