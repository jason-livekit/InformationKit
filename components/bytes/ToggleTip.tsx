'use client';

import { useEffect, useId, useRef, useState, type MouseEvent, type PointerEvent } from 'react';
import {
  Button,
  cn,
  InfoIcon,
  Popover,
  PopoverContent,
  PopoverTrigger,
  TooltipContentContainer,
} from '@/components/bytes';

interface ToggleTipProps {
  label?: string;
  trigger?: React.ReactNode;
  tooltipPosition?: Parameters<typeof PopoverContent>[0]['side'];
  className?: string;
  triggerClassName?: string;
  children: React.ReactNode;
}

export function ToggleTip({
  label = 'Help',
  trigger,
  tooltipPosition = 'bottom',
  className,
  triggerClassName,
  children,
}: ToggleTipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const pointerTypeRef = useRef('');
  const hoverCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const closedByHoverRef = useRef(false);

  useEffect(() => {
    // Cleanup the timeout when the component unmounts
    return () => clearTimeout(hoverCloseTimeoutRef.current);
  }, []);

  const cancelHoverClose = () => clearTimeout(hoverCloseTimeoutRef.current);

  const scheduleHoverClose = () => {
    hoverCloseTimeoutRef.current = setTimeout(() => {
      closedByHoverRef.current = true;
      setOpen(false);
    }, 100);
  };

  // Track the pointer type that initiated the interaction so handleClick
  // can distinguish mouse clicks (blocked) from touch/keyboard (allowed).
  const handleTriggerPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    pointerTypeRef.current = e.pointerType;
  };

  const handleTriggerClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (pointerTypeRef.current === 'mouse') {
      // Prevent Radix's click-to-toggle for mouse — hover handles it.
      e.preventDefault();
    }
    pointerTypeRef.current = '';
  };

  const handleTriggerPointerEnter = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'mouse') {
      cancelHoverClose();
      setOpen(true);
    }
  };

  const handleTriggerPointerLeave = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'mouse') {
      scheduleHoverClose();
    }
  };

  const handleContentPointerEnter = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse') {
      cancelHoverClose();
    }
  };

  const handleContentPointerLeave = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse') {
      scheduleHoverClose();
    }
  };

  const handleContentCloseAutoFocus = (e: Event) => {
    if (closedByHoverRef.current) {
      e.preventDefault();
      closedByHoverRef.current = false;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        asChild
        onClick={handleTriggerClick}
        onPointerDown={handleTriggerPointerDown}
        onPointerEnter={handleTriggerPointerEnter}
        onPointerLeave={handleTriggerPointerLeave}
      >
        {trigger ?? (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={label}
            aria-describedby={open ? id : undefined}
            className={cn(
              'text-fg4 hover:text-fg3 focus:text-fg3 h-min w-min cursor-help rounded-full transition-colors',
              triggerClassName,
            )}
          >
            <InfoIcon aria-hidden className="size-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        id={id}
        asChild
        role="status"
        sideOffset={5}
        side={tooltipPosition}
        onPointerEnter={handleContentPointerEnter}
        onPointerLeave={handleContentPointerLeave}
        onCloseAutoFocus={handleContentCloseAutoFocus}
      >
        <TooltipContentContainer className={cn('max-w-64', className)}>
          {children}
        </TooltipContentContainer>
      </PopoverContent>
    </Popover>
  );
}
