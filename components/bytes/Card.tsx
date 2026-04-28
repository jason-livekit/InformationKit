import * as React from 'react';

import { cn } from '@/lib/bytes/utils';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
}

export function Card({
  title,
  description,
  className = '',
  children,
  footer,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'border-separator1 flex max-w-lg min-w-100 flex-col gap-10 rounded-lg border p-6 pt-8',
      )}
      {...props}
    >
      <hgroup className="flex flex-col items-start justify-start gap-2">
        <h1 className="font-display text-fg0 text-xl leading-[30px]">{title}</h1>
        {description ? <p className="text-fg3 text-sm font-normal">{description}</p> : null}
      </hgroup>
      {children && <div className="flex flex-col gap-6">{children}</div>}
      {footer}
    </div>
  );
}
