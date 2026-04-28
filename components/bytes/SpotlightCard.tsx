'use client';

import type { ComponentPropsWithoutRef, ElementType } from 'react';

import ExternalLinkIcon from '@/icons/react/central-line/ArrowUpRightIcon';
import { cn } from '@/lib/bytes/utils';
import { BrowserChrome } from './BrowserChrome';
import { isExternalLink } from '@/lib/bytes/is-external-link';

export interface SpotlightCardProps<T extends ElementType = 'a'> {
  /** The title of the card */
  title: string;
  /** URL for the link - used for external link detection */
  href: string;
  /** Link rel attribute */
  rel?: string;
  /** Link target attribute */
  target?: string;
  /** Visual icon to be displayed in the card */
  icon?: React.ReactNode;
  /** Tags */
  tags?: string[];
  /** Visual element displayed in the browser chrome frame */
  visual?: React.ReactNode;
  /** Description content */
  children: React.ReactNode;
  /** Additional className for the container */
  className?: string;
  /**
   * The component to use for the link wrapper. Defaults to 'a' but can be Next.js Link, React
   * Router Link, etc.
   */
  as?: T;
}

type SpotlightCardPropsWithAs<T extends ElementType> = SpotlightCardProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof SpotlightCardProps<T>>;

export function SpotlightCard<T extends ElementType = 'a'>({
  rel,
  href,
  icon,
  tags,
  title,
  target,
  visual,
  children,
  className,
  as,
  ...props
}: SpotlightCardPropsWithAs<T>) {
  const Component = as || 'a';
  const isUrlExternal = isExternalLink(href);
  const finalTarget = target ?? (isUrlExternal ? '_blank' : '_self');
  const finalRel = rel ?? (finalTarget === '_blank' ? 'noopener noreferrer' : undefined);

  return (
    <Component
      {...props}
      href={href}
      rel={finalRel}
      target={finalTarget}
      data-component="spotlight-card"
      className={cn(
        'border-separator1 bg-bg1 hover:border-separator2 hover:bg-bg2 hover:text-fg0 group w-full overflow-hidden rounded border transition-all ease-out active:scale-[0.99]',
        className,
      )}
    >
      {visual && (
        <div className="border-separator1 bg-bg1 relative aspect-video w-full overflow-hidden border-b">
          <div className="bg-fg0 group-hover:bg-fgAccent1 group-hover:blur-0 absolute h-full w-full -translate-x-2/3 -translate-y-2/3 rounded-full opacity-10 blur-3xl transition-all duration-250 ease-out group-hover:translate-x-0 group-hover:translate-y-0 group-hover:scale-150 group-hover:opacity-100 group-hover:ease-in" />
          <div>
            <BrowserChrome
              bgColor="bg-bg2 dark:bg-bg1"
              className="group-hover:border-separator2 absolute top-6 left-6 aspect-video w-full opacity-80 transition-all duration-300 group-hover:-translate-x-3 group-hover:-translate-y-3 group-hover:opacity-100"
            >
              {visual}
            </BrowserChrome>
          </div>
        </div>
      )}

      <div className="relative flex h-full flex-col space-y-1 p-4">
        <div className="shrink-0">{icon}</div>
        <h2 className="text-fg0 text-sm font-semibold text-pretty">
          <div className="line-clamp-2 overflow-hidden text-ellipsis">{title}</div>
        </h2>
        <div className="text-fg3 line-clamp-3 h-full overflow-hidden text-sm wrap-break-word text-ellipsis">
          {children}
        </div>

        {isUrlExternal && (
          <div className="absolute top-0 right-0 grow p-4">
            <ExternalLinkIcon className="h-4 w-4 shrink-0" />
          </div>
        )}

        {tags && (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="bg-bg2 text-xxs text-fg3 cursor-pointer rounded-md px-2 py-1.5 font-mono leading-none font-bold tracking-wide uppercase"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Component>
  );
}
