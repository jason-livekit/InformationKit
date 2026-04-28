'use client';

import * as React from 'react';
import { Toaster as Sonner, toast as sonnerToast, type Action } from 'sonner';

import {
  CircleCheckIcon,
  CircleInfoIcon,
  CloseIcon,
  TriangleExclamationIcon,
} from '@/icons/react';
import { cn } from '@/lib/bytes/utils';
import { Button } from './Button';
import { CopyToClipboard } from './CopyToClipboard';
import { Spinner } from './Spinner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Styled wrapper around the Sonner Toaster component.
 *
 * @see {@link https://sonner.emilkowal.ski/toast | Sonner docs}
 */
export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      closeButton={false}
      className="pointer-events-auto"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: 'w-full',
        },
      }}
      {...props}
    />
  );
}

function ToastLayout(props: {
  id: string | number;
  message: Parameters<typeof sonnerToast.success>[0];
  description: NonNullable<Parameters<typeof sonnerToast.success>[1]>['description'];
  action: NonNullable<Parameters<typeof sonnerToast.success>[1]>['action'];
  className: string;
  icon?: React.ReactNode;
  withCopyToClipboard?: boolean;
}) {
  const message = typeof props.message === 'function' ? props.message() : props.message;
  const description =
    typeof props.description === 'function' ? props.description() : props.description;
  const combinedMessage = `${message}${description ? `: ${description}` : ''}`;
  const withCopyToClipboard = props.withCopyToClipboard ?? false;

  const action = props.action;
  const hasAction =
    action !== null &&
    typeof action === 'object' &&
    'label' in action &&
    typeof action.label === 'string' &&
    'onClick' in action &&
    typeof action.onClick === 'function';

  return (
    <div
      className={cn(
        'toast group/toast bg-bg2 text-fg1 flex w-full min-w-full flex-col gap-2 rounded border p-4 text-sm shadow-2xs dark:shadow-lg',
        props.className,
      )}
    >
      <div className="grid grid-cols-[minmax(0,16px)_minmax(0,1fr)_minmax(0,16px)_minmax(0,16px)] grid-rows-1 items-start gap-3">
        {props.icon}
        <p className="line-clamp-3 font-semibold" title={message?.toString()}>
          {message}
        </p>
        {withCopyToClipboard && (
          <CopyToClipboard
            className="size-5 p-0.5 text-current transition-opacity active:scale-90"
            textToCopy={combinedMessage}
            withPortal={false}
          />
        )}
        <Button
          aria-label="Dismiss toast"
          variant="ghost"
          size="icon"
          className="col-start-4 size-4 p-0 text-current transition-transform active:scale-90"
          onClick={() => sonnerToast.dismiss(props.id)}
        >
          <CloseIcon className="size-4" />
        </Button>
      </div>
      {description && <div className="text-sm font-normal text-pretty">{description}</div>}
      {hasAction && (
        <div className="flex gap-4">
          {hasAction && (
            <Button
              variant="secondary"
              size="sm"
              className="transition-transform active:scale-90"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

type Toasts = {
  /** Success toast with a short title and an optional description and action. */
  success: typeof sonnerToast.success;
  /** Warning toast with a short title and an optional description and action. */
  warning: typeof sonnerToast.warning;
  /** Error toast with a short title and an optional description and action. */
  error: typeof sonnerToast.error;
  /** Info toast with a short title and an optional description and action. */
  info: typeof sonnerToast.info;
  /** Loading toast with a short title and an optional description and action. */
  loading: typeof sonnerToast.loading;
  /**
   * Custom toast. Do whatever the f*** you want. 🤘
   *
   * @see {@link https://sonner.emilkowal.ski/toast#custom | Custom toast docs}
   */
  custom: typeof sonnerToast.custom;
  /** Dismiss a toast by its id. */
  dismiss: (id: string | number) => void;
  // TODO: Add promise toast
  // promise: typeof sonnerToast.promise;
};

/** @see {@link https://sonner.emilkowal.ski/toast | Sonner docs} */
export const toast: Toasts = {
  success: (
    title: Parameters<typeof sonnerToast.success>[0],
    data?: Parameters<typeof sonnerToast.success>[1],
  ) => {
    const { description, action, ...rest } = data ?? {};
    return sonnerToast.custom(
      (id) => {
        return (
          <ToastLayout
            id={id}
            message={title}
            description={description}
            action={action}
            className="border-separatorSuccess bg-bgSuccess1 text-fgSuccess"
            icon={<CircleCheckIcon className="size-5" />}
          />
        );
      },
      { ...rest },
    );
  },
  warning: (
    title: Parameters<typeof sonnerToast.warning>[0],
    data?: Parameters<typeof sonnerToast.warning>[1],
  ) => {
    const { description, action, ...rest } = data ?? {};
    return sonnerToast.custom(
      (id) => {
        return (
          <ToastLayout
            id={id}
            message={title}
            description={description}
            action={action}
            className="border-separatorModerate bg-bgModerate1 text-fgModerate"
            icon={<TriangleExclamationIcon className="size-5" />}
            withCopyToClipboard={true}
          />
        );
      },
      { duration: Infinity, ...rest },
    );
  },
  error: (
    title: Parameters<typeof sonnerToast.error>[0],
    data?: Parameters<typeof sonnerToast.error>[1],
  ) => {
    const { description, action, ...rest } = data ?? {};
    return sonnerToast.custom(
      (id) => {
        return (
          <ToastLayout
            id={id}
            message={title}
            description={description}
            action={action}
            className="border-separatorSerious1 bg-bgSerious1 text-fgSerious1"
            icon={<TriangleExclamationIcon className="size-5" />}
            withCopyToClipboard={true}
          />
        );
      },
      { duration: Infinity, ...rest },
    );
  },
  info: (
    title: Parameters<typeof sonnerToast.info>[0],
    data?: Parameters<typeof sonnerToast.info>[1],
  ) => {
    const { description, action, ...rest } = data ?? {};
    return sonnerToast.custom(
      (id) => {
        return (
          <ToastLayout
            id={id}
            message={title}
            description={description}
            action={action}
            className="border-separator1 bg-bg2 text-fg1 dark:border-separator2"
            icon={<CircleInfoIcon className="size-5" />}
          />
        );
      },
      { ...rest },
    );
  },
  loading: (
    title: Parameters<typeof sonnerToast.loading>[0],
    data?: Parameters<typeof sonnerToast.loading>[1],
  ) => {
    const { description, action, ...rest } = data ?? {};
    return sonnerToast.custom(
      (id) => {
        return (
          <ToastLayout
            id={id}
            message={title}
            description={description}
            action={action}
            className="border-separator1 bg-bg2 text-fg1 dark:border-separator2"
            icon={<Spinner className="size-4" />}
          />
        );
      },
      { ...rest },
    );
  },
  custom: (
    message: Parameters<typeof sonnerToast.custom>[0],
    data?: Parameters<typeof sonnerToast.custom>[1],
  ) => {
    return sonnerToast.custom(message, data);
  },
  dismiss: (id: string | number) => {
    sonnerToast.dismiss(id);
  },
};
