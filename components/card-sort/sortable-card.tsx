'use client';

import * as React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/bytes/utils';
import type { Card as CardItem } from '@/lib/card-sort/types';
import { DotFill } from './dot-fill';
import { CircleInfoIcon, ReorderIcon } from '@/icons/react';
import { ToggleTip } from '@/components/bytes/ToggleTip';

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
  /** True when rendered inside the DragOverlay (the copy that follows the cursor). */
  overlay?: boolean;
}

export const SortableCard = React.forwardRef<HTMLDivElement, SortableCardProps>(
  function SortableCard({ card, order, tone = 'ok', containerId, groupId, overlay = false }, _ref) {
    const sortable = useSortable({
      id: card.id,
      data: { type: 'card', containerId, groupId },
    });
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;

    // The overlay copy follows the cursor; the in-list origin becomes a flat placeholder.
    const dragging = isDragging && !overlay;

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
        data-dragging={dragging || undefined}
        className={cn(
          'group/card relative isolate flex h-12 shrink-0 cursor-grab items-center gap-3 overflow-hidden rounded-md border px-3 select-none touch-none transition-colors',
          'active:cursor-grabbing',
          tone === 'ok' && 'border-separator1 bg-bg1 text-fg0 hover:border-separator2 hover:bg-bg2',
          tone === 'danger' &&
            'border-separatorSerious2 bg-bgSerious1 text-fgSerious1 hover:border-fgSerious2',
          // In-list origin: ephemeral + inline → grey, flat, dashed, no shadow.
          'data-[dragging=true]:cursor-grabbing data-[dragging=true]:opacity-60 data-[dragging=true]:border-dashed data-[dragging=true]:border-separator2 data-[dragging=true]:bg-bg2 data-[dragging=true]:text-fg3 data-[dragging=true]:shadow-none',
          // Floating overlay: lifted → bright surface + elevation shadow.
          overlay && 'z-30 cursor-grabbing shadow-[0_12px_32px_rgba(0,0,0,0.24)]',
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
        {card.description && (
          <span
            className="relative flex shrink-0 items-center"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <ToggleTip
              label={`About ${card.label}`}
              tooltipPosition="top"
              trigger={
                <button
                  type="button"
                  aria-label={`About ${card.label}`}
                  className={cn(
                    'inline-flex h-6 w-6 cursor-help items-center justify-center rounded-full transition-colors',
                    tone === 'ok'
                      ? 'text-fg4 hover:bg-bg2 hover:text-fg2'
                      : 'text-fgSerious1/70 hover:bg-bgSerious2 hover:text-fgSerious1',
                  )}
                >
                  <CircleInfoIcon className="h-3.5 w-3.5" />
                </button>
              }
            >
              <div className="flex flex-col gap-1">
                <div className="text-fg0 text-xs font-semibold">
                  {card.context ? `${card.context} · ${card.label}` : card.label}
                </div>
                <p className="text-fg2 text-xs leading-snug">{card.description}</p>
              </div>
            </ToggleTip>
          </span>
        )}
        {order !== null && (
          <div
            className={cn(
              'relative ml-1 inline-flex h-6 min-w-6 items-center justify-center rounded px-1.5 font-mono text-[10px] font-bold tracking-wider tabular-nums',
              tone === 'ok' ? 'bg-bg2 text-fg2' : 'bg-bgSerious2 text-fgSerious1',
            )}
          >
            {order}
          </div>
        )}
      </div>
    );
  },
);
