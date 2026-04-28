'use client';

import * as React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/bytes/utils';
import type { Card as CardItem } from '@/lib/card-sort/types';
import { DotFill } from './dot-fill';
import { ReorderIcon } from '@/icons/react';

export interface SortableCardProps {
  card: CardItem;
  /** 1-based order to display in the corner. Pass null to omit. */
  order: number | null;
  /** "ok" for default, "danger" for not-useful tinting */
  tone?: 'ok' | 'danger';
  /** Used when this card is rendered in a group container */
  groupId?: string;
  /** Container id for dnd-kit data */
  containerId: string;
}

export const SortableCard = React.forwardRef<HTMLDivElement, SortableCardProps>(
  function SortableCard({ card, order, tone = 'ok', containerId, groupId }, _ref) {
    const sortable = useSortable({
      id: card.id,
      data: { type: 'card', containerId, groupId },
    });
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;

    const style: React.CSSProperties = {
      transform: CSS.Translate.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        data-dragging={isDragging || undefined}
        className={cn(
          'group/card relative isolate flex h-12 cursor-grab items-center gap-3 overflow-hidden rounded-md border px-3 select-none touch-none transition-colors',
          'data-[dragging=true]:cursor-grabbing data-[dragging=true]:z-30 data-[dragging=true]:opacity-90 data-[dragging=true]:shadow-[0_8px_24px_rgba(0,0,0,0.18)]',
          'active:cursor-grabbing',
          tone === 'ok' && 'border-separator1 bg-bg1 text-fg0 hover:border-separator2 hover:bg-bg2',
          tone === 'danger' &&
            'border-separatorSerious2 bg-bgSerious1 text-fgSerious1 hover:border-fgSerious2',
        )}
      >
        {tone === 'danger' && <DotFill tone="serious" opacity={0.45} />}
        <div className="relative flex min-w-0 flex-1 items-center gap-3">
          <ReorderIcon
            className={cn(
              'h-3.5 w-3.5 shrink-0',
              tone === 'ok' ? 'text-fg4' : 'text-fgSerious1/70',
            )}
          />
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="truncate text-sm font-medium leading-tight">{card.label}</div>
            {card.context && (
              <div
                className={cn(
                  'truncate font-mono text-[10px] uppercase tracking-wider leading-tight',
                  tone === 'ok' ? 'text-fg4' : 'text-fgSerious1/70',
                )}
              >
                {card.context}
              </div>
            )}
          </div>
        </div>
        <div
          className={cn(
            'relative ml-2 inline-flex h-6 min-w-6 items-center justify-center rounded font-mono text-[10px] font-bold tracking-wider tabular-nums',
            order !== null
              ? tone === 'ok'
                ? 'bg-bg2 text-fg2 px-1.5'
                : 'bg-bgSerious2 text-fgSerious1 px-1.5'
              : 'opacity-0',
          )}
          aria-hidden={order === null}
        >
          {order !== null ? order : ''}
        </div>
      </div>
    );
  },
);
