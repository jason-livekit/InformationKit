'use client';

import * as React from 'react';
import * as HoverCardPrimitive from '@radix-ui/react-hover-card';

import { cn } from '@/lib/bytes/utils';

/** @see {@link https://www.radix-ui.com/primitives/docs/components/hover-card#root} */
const HoverCard = HoverCardPrimitive.Root;

/** @see {@link https://www.radix-ui.com/primitives/docs/components/hover-card#trigger} */
const HoverCardTrigger = HoverCardPrimitive.Trigger;

/** @see {@link https://www.radix-ui.com/primitives/docs/components/hover-card#content} */
const HoverCardContent = React.forwardRef<
  React.ComponentRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content> & { withoutArrow?: boolean }
>(
  (
    { className, align = 'center', sideOffset = 4, side, withoutArrow, children, ...props },
    ref,
  ) => (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={16}
        side={side ?? 'top'}
        className={cn(
          'border-separator2 bg-bg3 text-fg1 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 rounded border p-4 text-base outline-hidden drop-shadow-md',
          className,
        )}
        {...props}
      >
        {children}
        {!withoutArrow && (
          <HoverCardPrimitive.Arrow className="fill-separator1 stroke-separator1" />
        )}
      </HoverCardPrimitive.Content>
    </HoverCardPrimitive.Portal>
  ),
);
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName;

export { HoverCard, HoverCardContent, HoverCardTrigger };
