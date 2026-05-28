'use client';

import * as React from 'react';
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { cn } from '@/lib/bytes/utils';
import { TrashCanIcon, FolderBookmarksIcon, ReorderIcon } from '@/icons/react';
import { DotFill } from './dot-fill';

export interface GroupPanelProps {
  label: string;
  count: number;
  onRename: (label: string) => void;
  onDelete: () => void;
  className?: string;
  children: React.ReactNode;
  /** Sortable node ref + transform style, for reordering the group itself. */
  innerRef?: (el: HTMLDivElement | null) => void;
  style?: React.CSSProperties;
  attributes?: DraggableAttributes;
  /** Ref + listeners for the drag handle that reorders this group. */
  handleRef?: (el: HTMLElement | null) => void;
  handleListeners?: DraggableSyntheticListeners;
  isDragging?: boolean;
}

export function GroupPanel({
  label,
  count,
  onRename,
  onDelete,
  className,
  children,
  innerRef,
  style,
  attributes,
  handleRef,
  handleListeners,
  isDragging,
}: GroupPanelProps) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(label);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (editing) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [editing]);

  // Empty input reverts to the previous label (Figma-style — you can't have an empty
  // layer name). Auto-named groups skip edit-on-create entirely; user clicks to rename.
  const commit = () => {
    const next = draft.trim();
    if (next && next !== label) {
      onRename(next);
    } else {
      setDraft(label);
    }
    setEditing(false);
  };

  return (
    <div
      ref={innerRef}
      style={style}
      {...attributes}
      className={cn(
        'border-separator1 bg-bg1 relative flex w-full flex-col overflow-hidden rounded-lg border',
        isDragging && 'opacity-50',
        className,
      )}
    >
      <div className="border-b-separator1 relative flex items-center gap-2 border-b px-3 py-2.5">
        <DotFill tone="accent" opacity={0.18} className="opacity-30" spacing={5} />
        {handleListeners && (
          <button
            type="button"
            ref={handleRef}
            {...handleListeners}
            aria-label="Drag to reorder group"
            className="text-fg4 hover:text-fg2 relative -ml-1 inline-flex h-6 w-5 cursor-grab items-center justify-center rounded touch-none active:cursor-grabbing"
          >
            <ReorderIcon className="h-3.5 w-3.5" />
          </button>
        )}
        <FolderBookmarksIcon className="text-fg3 relative h-4 w-4 shrink-0" />
        <div className="relative flex min-w-0 flex-1 items-center gap-2">
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commit();
                } else if (e.key === 'Escape') {
                  setDraft(label);
                  setEditing(false);
                }
              }}
              placeholder="Group name…"
              className="text-fg0 placeholder:text-fg4 w-full bg-transparent text-sm font-semibold outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setDraft(label);
                setEditing(true);
              }}
              className="text-fg0 hover:text-fgAccent1 truncate text-left text-sm font-semibold"
            >
              {label}
            </button>
          )}
        </div>
        <span className="bg-bg2 text-fg3 relative inline-flex h-5 min-w-5 items-center justify-center rounded px-1 font-mono text-[10px] font-bold tabular-nums">
          {count}
        </span>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete group"
          className="text-fg4 hover:text-fgSerious1 hover:bg-bgSerious1 relative inline-flex h-6 w-6 items-center justify-center rounded transition-colors"
        >
          <TrashCanIcon className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="relative flex flex-1 flex-col gap-2 p-3">{children}</div>
    </div>
  );
}
