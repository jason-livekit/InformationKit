'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDebouncedState } from '@/lib/debounce';
import { CircleInfoIcon, TriangleExclamationIcon } from '@/icons/react';

type IconType = 'info' | 'warning' | 'error';

const iconMap = {
  info: <CircleInfoIcon className="size-4 fill-transparent" />,
  warning: <TriangleExclamationIcon className="size-4 fill-transparent text-amber-500" />,
  error: <CircleInfoIcon className="text-fgSerious1 size-4 fill-transparent" />,
} as const;

export function InfoIconWithHoverPopover({
  type = 'info',
  children,
}: React.PropsWithChildren<{ type?: IconType }>) {
  const [open, setOpen] = React.useState(false);
  const [wasClosedByKeyboard, setWasClosedByKeyboard] = React.useState(false);
  const [isHovering, setIsHovering] = React.useState(false);
  const debouncedOpen = useDebouncedState(open, 200);

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (wasClosedByKeyboard) {
      setWasClosedByKeyboard(false);
      return;
    }
    setOpen(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  return (
    <Popover
      open={debouncedOpen}
      onOpenChange={(shouldOpen) => {
        if (isHovering && !shouldOpen) return;
        setOpen(shouldOpen);
      }}
    >
      <PopoverTrigger onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} asChild>
        <Button
          onFocus={handleMouseEnter}
          onBlur={handleMouseLeave}
          leftIcon={iconMap[type]}
          variant="ghost"
          size="icon"
          className="text-fg4 hover:text-fg3 h-min w-min cursor-help transition-colors"
          aria-label="Open info box"
        />
      </PopoverTrigger>
      <PopoverContent
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onKeyDown={(e) => {
          if (e.key === 'Tab' || e.key === 'Escape') {
            setWasClosedByKeyboard(true);
            setOpen(false);
          }
        }}
        className="text-fg1 max-w-56 rounded p-2 font-sans text-xs"
        sideOffset={5}
        side="bottom"
        asChild
      >
        <div>{children}</div>
      </PopoverContent>
    </Popover>
  );
}
