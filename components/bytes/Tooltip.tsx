'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { cn } from '@/lib/bytes/utils';

const TooltipProvider = TooltipPrimitive.Provider;

// Standard container for tooltip content that can be shared across the codebase.
export function TooltipContentContainer({
  className,
  sideOffset = 8,
  ...props
}: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>) {
  return (
    <div
      className={cn(
        'border-separator1 bg-bg2 text-fg1 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:border-separator2 dark:bg-bg3 z-50 select-none overflow-hidden text-pretty rounded border px-3 py-1.5 text-xs drop-shadow-md',
        className,
      )}
      {...props}
    />
  );
}

/** @see {@link https://radix-ui.com/primitives/docs/components/tooltip#root} */
const Tooltip = TooltipPrimitive.Root;

/** @see {@link https://radix-ui.com/primitives/docs/components/tooltip#trigger} */
const TooltipTrigger = TooltipPrimitive.Trigger;

/** @see {@link https://radix-ui.com/primitives/docs/components/tooltip#content} */
const TooltipContent = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 8, children, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    asChild
    sideOffset={sideOffset}
    collisionPadding={16}
    {...props}
  >
    <TooltipContentContainer className={className}>{children}</TooltipContentContainer>
  </TooltipPrimitive.Content>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

/** @see {@link https://radix-ui.com/primitives/docs/components/tooltip#portal} */
const TooltipPortal = TooltipPrimitive.Portal;

export type { TooltipContentProps } from '@radix-ui/react-tooltip';
export { Tooltip, TooltipContent, TooltipPortal, TooltipProvider, TooltipTrigger };
