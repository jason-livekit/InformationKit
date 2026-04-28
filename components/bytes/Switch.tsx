'use client';

import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';

import { CheckIcon } from '@/icons/react';
import { cn } from '@/lib/bytes/utils';

export type SwitchProps = React.ComponentProps<typeof SwitchPrimitives.Root> & {
  className?: string;
  stateLabels?: {
    on: string;
    off: string;
  };
};

const Switch = React.forwardRef<React.ComponentRef<typeof SwitchPrimitives.Root>, SwitchProps>(
  ({ className, stateLabels, ...props }, ref) => {
    return (
      <div className="inline-flex w-[60px] items-center">
        <SwitchPrimitives.Root
          onCheckedChange={(checked) => {
            props.onCheckedChange?.(checked);
          }}
          className={cn(
            'focus-visible:ring-ring group peer relative inline-flex shrink-0 cursor-pointer items-center rounded transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
            'focus-visible:ring-offset-bg1 data-[state=checked]:border-fgAccent1 data-[state=checked]:bg-fgAccent2 data-[state=unchecked]:bg-bg3 border border-separator2 data-[state=checked]:w-7',
            'h-4 w-8',
          )}
          {...props}
          ref={ref}
        >
          <SwitchPrimitives.Thumb
            className={cn(
              'border-fg4 bg-bg1 pointer-events-none flex h-4 w-4 items-center justify-center rounded-[3px] border ring-0 transition-transform',
              'data-[state=unchecked]:-translate-x-px data-[state=unchecked]:bg-bg0',
              'data-[state=checked]:border-fgAccent1 data-[state=checked]:translate-x-4',
            )}
          >
            <CheckIcon className="text-fgAccent1 hidden size-4 group-data-[state=checked]:block" />
          </SwitchPrimitives.Thumb>
          <div className="text-xxs absolute left-10 font-mono font-bold tracking-wider uppercase">
            <span className="text-fg1 hidden leading-none group-data-[state=checked]:block">
              {stateLabels?.on ?? 'On'}
            </span>
            <span className="text-fg3 hidden leading-none group-data-[state=unchecked]:block">
              {stateLabels?.off ?? 'Off'}
            </span>
          </div>
        </SwitchPrimitives.Root>
      </div>
    );
  },
);
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
