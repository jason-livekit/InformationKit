import * as React from 'react';

import { cn } from '@/lib/bytes/utils';

export interface SectionHeadingProps {
  /** The heading title text */
  title: string;
  /** Optional description displayed below the title */
  description?: React.ReactNode;
  /** Optional id for the heading element (useful for aria-labelledby) */
  id?: string;
  /** The heading level to render (default: h2) */
  as?: 'h1' | 'h2' | 'h3';
  /** Additional className for the container */
  className?: string;
}

/**
 * Section heading component matching the docs site style. Use for consistent section headers with
 * title and optional description.
 *
 * @example
 *
 * ```tsx
 * <SectionHeading
 *   title="Featured Guides"
 *   description="Our top recommended guides to get you started."
 *   id="featured-guides-heading"
 * />;
 * ```
 */
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
