'use client';

import * as React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/lib/bytes/utils';

export interface ColumnProps {
  id: string;
  cardIds: string[];
  className?: string;
  children?: React.ReactNode;
  /** Show a drop highlight when active. */
  isOver?: boolean;
  /** Reduce min height — used for inline portion of split column. */
  flush?: boolean;
}

/**
 * Generic vertical droppable + sortable column. Used for: unsorted (top), notUseful (bottom),
 * and each user-created group.
 */
export function Column({ id, cardIds, className, children, isOver, flush }: ColumnProps) {
  const { setNodeRef, isOver: dropIsOver } = useDroppable({
    id,
    data: { type: 'container', containerId: id },
  });
  const showOver = isOver ?? dropIsOver;

  return (
    <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        data-over={showOver || undefined}
        className={cn(
          'flex w-full flex-col gap-2 transition-colors',
          !flush && 'min-h-12',
          className,
        )}
      >
        {children}
      </div>
    </SortableContext>
  );
}
