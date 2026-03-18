'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { cn } from '@/lib/utils';

const TooltipProvider = TooltipPrimitive.Provider;

/** @see {@link https://radix-ui.com/primitives/docs/components/tooltip#root} */
const Tooltip = TooltipPrimitive.Root;

/** @see {@link https://radix-ui.com/primitives/docs/components/tooltip#trigger} */
const TooltipTrigger = TooltipPrimitive.Trigger;

/** @see {@link https://radix-ui.com/primitives/docs/components/tooltip#content} */
const TooltipContent = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 8, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    collisionPadding={16}
    className={cn(
      'border-separator1 bg-bg2 text-fg1 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:border-separator2 dark:bg-bg3 z-50 overflow-hidden rounded border px-3 py-1.5 text-xs text-pretty drop-shadow-md select-none',
      className,
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

/** @see {@link https://radix-ui.com/primitives/docs/components/tooltip#portal} */
const TooltipPortal = TooltipPrimitive.Portal;

export type { TooltipContentProps } from '@radix-ui/react-tooltip';
export { Tooltip, TooltipContent, TooltipPortal, TooltipProvider, TooltipTrigger };
