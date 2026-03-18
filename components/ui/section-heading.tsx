import * as React from 'react';

import { cn } from '@/lib/utils';

export interface SectionHeadingProps {
  title: string;
  description?: React.ReactNode;
  id?: string;
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
}

export function SectionHeading({
  title,
  description,
  id,
  as: Component = 'h2',
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn('mb-4', className)}>
      <Component id={id} className="font-display text-fg0 mb-2 text-2xl text-pretty">
        {title}
      </Component>
      {description && <p className="text-fg3">{description}</p>}
    </div>
  );
}
