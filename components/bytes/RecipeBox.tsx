'use client';

import NextLink from 'next/link';
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { SiGithub } from '@icons-pack/react-simple-icons';

import ExternalLinkIcon from '@/icons/react/central-line/ArrowUpRightIcon';
import { cn } from '@/lib/bytes/utils';
import { NewBadge } from './NewBadge';
import { RecipeLabel, type RecipeVariant } from './RecipeLabel';

export interface RecipeBoxLabel {
  text: string;
  variant?: RecipeVariant;
}

export interface RecipeBoxProps<T extends ElementType = 'a'> {
  /** The title of the recipe box */
  title: string;
  /** URL for the link - used for external link detection and repo extraction */
  url: string;
  /** Link target attribute */
  target?: string;
  /** Link rel attribute */
  rel?: string;
  /** Visual element (icon, image, etc.) displayed at the top */
  visual?: ReactNode;
  /** Show "New" badge */
  isNew?: boolean;
  /** Show GitHub repo badge (extracts from url) */
  showRepo?: boolean;
  /** Array of labels to display */
  labels?: RecipeBoxLabel[];
  /** Description content */
  children?: ReactNode;
  /** Additional className for the container */
  className?: string;
}

type RecipeBoxPropsWithAs<T extends ElementType> = RecipeBoxProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof RecipeBoxProps<T>>;

export function RecipeBox<T extends ElementType = 'a'>({
  title,
  url,
  target,
  rel,
  visual,
  showRepo = false,
  isNew,
  labels,
  children,
  className,
  ...props
}: RecipeBoxPropsWithAs<T>) {
  const isGithubRepo = url.includes('github.com');
  const repo = isGithubRepo ? url.split('github.com/')[1]?.split('/').slice(0, 2).join('/') : null;
  const isUrlExternal = url.startsWith('http');
  const finalTarget = target ?? (isUrlExternal ? '_blank' : '_self');
  const finalRel = rel ?? (finalTarget === '_blank' ? 'noopener noreferrer' : undefined);

  // For standard anchor tags, use href; for other components, pass url via href prop
  const linkProps = { href: url, target: finalTarget, rel: finalRel };

  return (
    <NextLink
      {...linkProps}
      {...props}
      data-component="recipe-box"
      className={cn(
        'group border-separator1 bg-bg1 hover:border-separator2 hover:bg-bg2 hover:text-fg0 relative flex h-full w-full flex-col gap-4 rounded-lg border p-4 transition-all ease-out active:scale-[0.99]',
        className,
      )}
    >
      {(visual || labels || isNew) && (
        <div className="relative">
          {visual}
          {isNew && (
            <div className="absolute top-0 right-0 flex flex-wrap justify-end gap-2">
              <NewBadge />
            </div>
          )}
        </div>
      )}
      <div className="flex flex-grow flex-col gap-1">
        <h2 className="text-fg0 text-sm font-semibold">{title}</h2>
        <div className="text-fg3 line-clamp-3 h-full overflow-hidden text-sm break-words overflow-ellipsis">
          {children}
        </div>
      </div>
      {showRepo && isGithubRepo && (
        <div className="bg-bg2 group-hover:bg-bg3 flex w-fit max-w-full shrink-0 items-center gap-2 rounded-full p-1 pr-2 text-xs">
          <SiGithub className="h-4 w-4 flex-shrink-0" />
          <span className="text-fg3 min-w-0 truncate">{repo}</span>
        </div>
      )}
      {labels && labels.length > 0 && (
        <div className="flex flex-wrap justify-start gap-1">
          {labels.map((label, idx) => (
            <RecipeLabel key={idx} text={label.text} variant={label.variant} />
          ))}
        </div>
      )}
      {isUrlExternal && (
        <div className="absolute top-0 right-0 p-4">
          <ExternalLinkIcon className="h-4 w-4 flex-shrink-0" />
        </div>
      )}
    </NextLink>
  );
}
