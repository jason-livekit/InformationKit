import * as React from 'react';
import * as _AlertDialog from '@radix-ui/react-alert-dialog';

import { CloseIcon } from '@/icons/react';
import { cn } from '@/lib/bytes/utils';
import { Button } from './Button';

/** @see {@link https://www.radix-ui.com/primitives/docs/components/alert-dialog#root} */
const AlertDialog = _AlertDialog.Root;

/** @see {@link https://www.radix-ui.com/primitives/docs/components/alert-dialog#trigger} */
const AlertDialogTrigger = _AlertDialog.Trigger;

/** @see {@link https://www.radix-ui.com/primitives/docs/components/alert-dialog#portal} */
const AlertDialogPortal = _AlertDialog.Portal;

/** @see {@link https://www.radix-ui.com/primitives/docs/components/alert-dialog#content} */
const AlertDialogContent = React.forwardRef<
  React.ComponentRef<typeof _AlertDialog.Content>,
  React.ComponentPropsWithoutRef<typeof _AlertDialog.Content>
>(({ className, children, ...props }, ref) => {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <_AlertDialog.Content
        className={cn(
          'data-[state=open]:animate-contentShow border-separator1 bg-bg1 fixed top-1/2 left-1/2 z-50 flex max-h-[85vh] max-w-[500px] min-w-72 translate-x-[-50%] translate-y-[-50%] flex-col gap-4 rounded-md border p-4 focus:outline-hidden',
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
        <AlertDialogCancel
          asChild
          className="className=data-[state=open]:bg-fgAccent1 data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-hidden active:outline-hidden disabled:pointer-events-none"
        >
          <Button variant="ghost" size="icon" leftIcon={<CloseIcon className="h-4 w-4" />}>
            <span className="sr-only">Close</span>
          </Button>
        </AlertDialogCancel>
      </_AlertDialog.Content>
    </AlertDialogPortal>
  );
});

/** @see {@link https://www.radix-ui.com/primitives/docs/components/alert-dialog#title} */
const AlertDialogTitle = React.forwardRef<
  React.ComponentRef<typeof _AlertDialog.Content>,
  React.ComponentPropsWithoutRef<typeof _AlertDialog.Content>
>(({ className, children, ...props }, ref) => {
  return (
    <_AlertDialog.Title
      ref={ref}
      className={cn('text-fg0 text-lg font-semibold', className)}
      {...props}
    >
      {children}
    </_AlertDialog.Title>
  );
});

/** @see {@link https://www.radix-ui.com/primitives/docs/components/alert-dialog#description} */
const AlertDialogDescription = React.forwardRef<
  React.ComponentRef<typeof _AlertDialog.Description>,
  React.ComponentPropsWithoutRef<typeof _AlertDialog.Description>
>(({ className, children, ...props }, ref) => {
  return (
    <_AlertDialog.Description
      ref={ref}
      className={cn('text-fg1 font-sans text-sm text-pretty', className)}
      {...props}
    >
      {children}
    </_AlertDialog.Description>
  );
});
/** @see {@link https://www.radix-ui.com/primitives/docs/components/alert-dialog#cancel} */
const AlertDialogCancel = _AlertDialog.Cancel;
/** @see {@link https://www.radix-ui.com/primitives/docs/components/alert-dialog#action} */
const AlertDialogAction = _AlertDialog.Action;

/** @see {@link https://www.radix-ui.com/primitives/docs/components/alert-dialog#overlay} */
const AlertDialogOverlay = React.forwardRef<
  React.ComponentRef<typeof _AlertDialog.AlertDialogOverlay>,
  React.ComponentPropsWithoutRef<typeof _AlertDialog.AlertDialogOverlay>
>(({ className, children, ...props }, ref) => {
  return (
    <_AlertDialog.AlertDialogOverlay
      ref={ref}
      className={cn(
        'bg-bg2/70 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 dark:bg-bg0/70 fixed inset-0 z-50 backdrop-blur-xs',
        className,
      )}
      {...props}
    >
      {children}
    </_AlertDialog.AlertDialogOverlay>
  );
});

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};
