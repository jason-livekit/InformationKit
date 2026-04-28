'use client';

import * as React from 'react';
import { cn } from '@/lib/bytes/utils';

export interface NotUsefulDividerProps {
  /** Called continuously while the user drags the divider, with the new clientY position. */
  onDrag: (clientY: number) => void;
  /** Called once when drag starts. */
  onDragStart?: () => void;
  /** Called once when drag ends. */
  onDragEnd?: () => void;
}

/**
 * The red "not useful" divider line. Acts as both a visual separator AND a drag handle.
 *
 * Pointer events fire continuously while dragging; consumer maps clientY → split index.
 */
export function NotUsefulDivider({ onDrag, onDragStart, onDragEnd }: NotUsefulDividerProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const draggingRef = React.useRef(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    onDragStart?.();
    onDrag(e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    e.preventDefault();
    onDrag(e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    onDragEnd?.();
  };

  return (
    <div
      ref={ref}
      role="separator"
      aria-orientation="horizontal"
      aria-label="Not useful divider — drag up to mark cards below as not useful"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={cn(
        'group/divider relative isolate my-1 flex h-7 cursor-ns-resize items-center select-none touch-none',
        'transition-colors',
      )}
    >
      <div className="relative flex w-full items-center gap-2">
        <div className="bg-fgSerious2 h-px flex-1" />
        <div
          className={cn(
            'border-separatorSerious2 bg-bgSerious1 text-fgSerious1 relative inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider',
            'shadow-[0_2px_6px_rgba(0,0,0,0.05)] transition-colors',
            'group-hover/divider:bg-bgSerious2 group-active/divider:bg-bgSerious2',
          )}
        >
          <DragGripIcon className="h-3 w-3" />
          Not useful
        </div>
        <div className="bg-fgSerious2 h-px flex-1" />
      </div>
    </div>
  );
}

function DragGripIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="3" cy="3" r="1" fill="currentColor" />
      <circle cx="9" cy="3" r="1" fill="currentColor" />
      <circle cx="3" cy="6" r="1" fill="currentColor" />
      <circle cx="9" cy="6" r="1" fill="currentColor" />
      <circle cx="3" cy="9" r="1" fill="currentColor" />
      <circle cx="9" cy="9" r="1" fill="currentColor" />
    </svg>
  );
}
