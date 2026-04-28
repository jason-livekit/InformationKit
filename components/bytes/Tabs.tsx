import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/bytes/utils';

const tabsListVariants = cva('group/list inline-flex w-full items-start justify-start gap-6', {
  variants: {
    variant: {
      default: '',
      segmented: [
        'grid auto-cols-fr grid-flow-col gap-0',
        '[&_button]:bg-bg1 [&_button]:text-fg3 [&_button]:px-3 [&_button]:text-xs [&_button]:leading-7 [&_button]:font-semibold [&_button+button]:-ml-px',
        '[&_button]:border-separator1 [&_button]:justify-center [&_button]:border [&_button]:outline-hidden [&_button:first-child]:rounded-l [&_button:last-child]:rounded-r',
        '[&_[data-state=active]]:border-separatorAccent [&_[data-state=active]]:bg-bgAccent1 [&_[data-state=active]]:text-fgAccent1 **:data-[state=active]:z-10',
        '[&_button]:ring-fgAccent1 [&_button]:ring-offset-bg0 [&_button]:ring-offset-1 [&_button:focus-visible]:ring-1',
      ],
      underline:
        'border-separator1 [&_[data-state=active]]:border-b-fgAccent1 border-b [&_button]:border-b [&_button]:border-b-transparent [&_button]:pb-2',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface TabsListProps
  extends
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <TabsPrimitive.List
        className={cn(tabsListVariants({ variant }), className)}
        data-variant={variant}
        ref={ref}
        {...props}
      />
    );
  },
);

const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'group/v-underline text-fg3 relative inline-flex items-center justify-start gap-1 leading-tight font-medium transition-colors',
        'data-[state=active]:text-fg1',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

const TabsContent = TabsPrimitive.Content;

export interface TabsProps extends React.ComponentPropsWithRef<typeof TabsPrimitive.Root> {}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(({ className, ...props }, ref) => {
  return (
    <TabsPrimitive.Root
      className={cn('inline-flex w-full flex-col items-start justify-start gap-2', className)}
      ref={ref}
      {...props}
    />
  );
});
Tabs.displayName = 'Tabs';

export { Tabs, TabsList, TabsTrigger, TabsContent };
