'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

import { CloseIcon } from '@/icons/react';
import { cn } from '@/lib/bytes/utils';

export type * from '@radix-ui/react-dialog';

type DrawerSide = 'top' | 'bottom' | 'left' | 'right';

interface DrawerContentProps extends React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
> {
  side?: DrawerSide;
}

const Drawer = DialogPrimitive.Root;

const DrawerTrigger = DialogPrimitive.Trigger;

const DrawerPortal = DialogPrimitive.Portal;

const DrawerClose = DialogPrimitive.Close;

const DrawerOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      // We only apply the animation classes to the `first:` overlay to remove flickering when opening a drawer inside another drawer.
      // There is probably a better way to do this but no time.
      'data-[state=open]:first:animate-in data-[state=open]:first:fade-in-0',
      'data-[state=closed]:first:animate-out data-[state=closed]:first:fade-out-0',
      'bg-bg2/70 dark:bg-bg0/70 fixed inset-0 z-50 backdrop-blur-xs duration-500',
      className,
    )}
    {...props}
  />
));
DrawerOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DrawerContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  DrawerContentProps
>(({ side = 'right', className, children, ...props }, ref) => {
  // Animation classes based on side
  const sideAnimationClasses = {
    top: 'data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top',
    bottom: 'data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
    left: 'data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left',
    right: 'data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right',
  };

  // Positioning classes based on side
  const sidePositionClasses = {
    top: 'inset-x-0 top-0 w-full max-w-screen mt-0 border-x-none',
    bottom: 'inset-x-0 bottom-0 w-full max-w-screen mb-0 border-x-none',
    left: 'inset-y-0 left-0 h-full max-h-screen ml-0 border-y-none',
    right: 'inset-y-0 right-0 h-full max-h-screen mr-0 border-y-none',
  };

  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'bg-bg1 fixed z-50 flex flex-col border shadow-lg outline-hidden',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          sideAnimationClasses[side],
          sidePositionClasses[side],
          'duration-300',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="data-[state=open]:bg-fgAccent1 absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
          <CloseIcon className="text-fg3 h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DrawerPortal>
  );
});
DrawerContent.displayName = 'DrawerContent';

const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />
);
DrawerHeader.displayName = 'DrawerHeader';

const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex justify-end gap-2 p-6', className)} {...props} />
);
DrawerFooter.displayName = 'DrawerFooter';

const DrawerTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-fg0 text-lg font-semibold', className)}
    {...props}
  />
));
DrawerTitle.displayName = DialogPrimitive.Title.displayName;

const DrawerDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-fg3 text-sm text-pretty', className)}
    {...props}
  />
));
DrawerDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  type DrawerSide,
};
