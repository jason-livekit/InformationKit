import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '@/lib/utils';

const PanelTabsHeader = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex w-full items-center justify-between gap-4', className)}
        {...props}
      />
    );
  },
);

interface PanelTabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {}

const PanelTabsList = React.forwardRef<HTMLDivElement, PanelTabsListProps>(
  ({ className, ...props }, ref) => {
    return (
      <TabsPrimitive.List
        className={cn(
          'inline-flex items-center justify-start',
          'divide-separator1 border-separator1 divide-x border-e',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

interface PanelTabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {}

const PanelTabsTrigger = React.forwardRef<HTMLButtonElement, PanelTabsTriggerProps>(
  ({ className, ...props }, ref) => {
    return (
      <TabsPrimitive.Trigger
        className={cn(
          'inline-flex items-center justify-start gap-2 py-2 ps-3 pe-4 font-medium',
          'text-fg3 text-xs',
          'hover:bg-bg2 hover:cursor-pointer',
          'data-[state=active]:bg-bg2 data-[state=active]:text-fg0',
          'focus-visible:ring-fgActive focus-visible:ring-offset-bg1 focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:outline-hidden',
          'transition-colors',
          'disabled:pointer-events-none disabled:opacity-60',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

interface PanelTabsContentProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> {}

const PanelTabsContent = React.forwardRef<HTMLDivElement, PanelTabsContentProps>(
  ({ className, ...props }, ref) => {
    return <TabsPrimitive.Content ref={ref} className={cn('p-3', className)} {...props} />;
  },
);

interface PanelProps extends React.ComponentPropsWithRef<typeof TabsPrimitive.Root> {}

const Panel = React.forwardRef<HTMLDivElement, PanelProps>(({ className, ...props }, ref) => {
  return (
    <TabsPrimitive.Root
      className={cn(
        'border-separator1 flex flex-col overflow-hidden rounded-lg border shadow-2xs',
        'bg-bg1',
        'divide-separator1 divide-y',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Panel.displayName = 'Panel';

export { PanelTabsHeader, PanelTabsList, PanelTabsTrigger, PanelTabsContent, Panel };
export type { PanelTabsListProps, PanelTabsTriggerProps, PanelProps };
