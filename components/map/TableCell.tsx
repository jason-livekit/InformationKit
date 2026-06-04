'use client';

import * as React from 'react';
import { cn } from '@/lib/bytes/utils';
import type { MapCell, MapTextSize } from '@/lib/repo/schemas';
import type { CellColor } from './colors';
import {
  type GridState,
  applyHeaderDashes,
  backspaceAtStart,
  deleteAtEnd,
  moveHorizontal,
  moveTab,
  moveVertical,
  setCellText,
  typeEnter,
  typePipe,
  typeShiftEnter,
} from './grid';
import { useMap, useMapApi } from './useMapStore';

const SIZE_CLASS: Record<MapTextSize, string> = {
  small: 'text-xs',
  medium: 'text-sm',
  large: 'text-base',
  xlarge: 'text-xl',
  huge: 'text-3xl',
};

/** Render inline markdown (**bold**, *italic*, ~~strike~~) for the read view. */
function renderInline(text: string): React.ReactNode {
  if (!text) return null;
  const nodes: React.ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|~~([^~]+)~~)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[2] != null) nodes.push(<strong key={key++}>{m[2]}</strong>);
    else if (m[3] != null) nodes.push(<em key={key++}>{m[3]}</em>);
    else if (m[4] != null) nodes.push(<s key={key++}>{m[4]}</s>);
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

interface TableCellProps {
  cell: MapCell;
  rowIndex: number;
  cellIndex: number;
  color: CellColor;
  textSize: MapTextSize;
  readOnly?: boolean;
}

export function TableCell({ cell, rowIndex, cellIndex, color, textSize, readOnly }: TableCellProps) {
  const api = useMapApi();
  const caret = useMap((s) => s.caret);
  const editing = useMap((s) => s.editing);
  const selection = useMap((s) => s.selection);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const isCaretCell = caret?.row === rowIndex && caret?.cell === cellIndex;
  const isEditingHere = isCaretCell && editing && !readOnly;
  const isSelected =
    (selection.kind === 'cell' && selection.row === rowIndex && selection.cell === cellIndex) ||
    (selection.kind === 'row' && selection.row === rowIndex) ||
    selection.kind === 'table';

  // Focus + restore caret offset when this becomes the active editing cell.
  React.useEffect(() => {
    if (isEditingHere && inputRef.current) {
      const el = inputRef.current;
      el.focus({ preventScroll: true });
      const off = Math.min(caret?.offset ?? el.value.length, el.value.length);
      try {
        el.setSelectionRange(off, off);
      } catch {
        /* noop */
      }
    }
  }, [isEditingHere, caret?.offset, caret?.row, caret?.cell]);

  function state(): GridState {
    return { table: api.getState().activeTable(), caret: { row: rowIndex, cell: cellIndex, offset: offset() } };
  }
  function offset(): number {
    return inputRef.current?.selectionStart ?? cell.text.length;
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const off = offset();
    const atStart = off === 0;
    const atEnd = off === cell.text.length;

    if (e.key === '|') {
      e.preventDefault();
      api.getState().applyGrid(typePipe(state()));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        api.getState().applyGrid(typeShiftEnter(state()));
        return;
      }
      // `---` separator → header row.
      if (cell.text === '---') {
        const dashed = applyHeaderDashes(state());
        if (dashed) {
          api.getState().applyGrid(dashed);
          return;
        }
      }
      api.getState().applyGrid(typeEnter(state()));
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      api.getState().applyGrid(moveTab(state(), e.shiftKey ? -1 : 1));
      return;
    }
    if (e.key === 'Backspace' && atStart) {
      const next = backspaceAtStart(state());
      if (next) {
        e.preventDefault();
        api.getState().applyGrid(next);
      }
      return;
    }
    if ((e.key === 'Delete' || (e.key === 'Backspace' && (e.metaKey || e.ctrlKey))) && atEnd) {
      const next = deleteAtEnd(state());
      if (next) {
        e.preventDefault();
        api.getState().applyGrid(next);
      }
      return;
    }
    if (e.key === 'ArrowLeft' && atStart) {
      e.preventDefault();
      api.getState().applyGrid(moveHorizontal(state(), -1));
      return;
    }
    if (e.key === 'ArrowRight' && atEnd) {
      e.preventDefault();
      api.getState().applyGrid(moveHorizontal(state(), 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      api.getState().applyGrid(moveVertical(state(), -1));
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      api.getState().applyGrid(moveVertical(state(), 1));
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      api.getState().setEditing(false);
      api.getState().select({ kind: 'cell', row: rowIndex, cell: cellIndex });
      inputRef.current?.blur();
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    const newOffset = e.target.selectionStart ?? value.length;
    api.getState().applyGrid(setCellText(state(), value, newOffset));
  }

  function handleMouseDown() {
    if (readOnly) return;
    // Single click enters edit mode directly (and selects the cell so the
    // style panel targets it).
    api.getState().select({ kind: 'cell', row: rowIndex, cell: cellIndex });
    api.getState().setCaret({ row: rowIndex, cell: cellIndex, offset: cell.text.length });
    api.getState().setEditing(true);
  }

  const sizeClass = SIZE_CLASS[textSize];
  const fontFamily = cell.mono ? 'font-mono' : 'font-sans';
  const weight = color.isHeader || cell.bold ? 'font-semibold' : 'font-normal';
  const align =
    cell.align === 'center' ? 'text-center' : cell.align === 'right' ? 'text-right' : 'text-left';

  const style: React.CSSProperties = color.isHeader
    ? { borderColor: 'var(--separator1)' }
    : { backgroundColor: color.fill, borderColor: color.border, color: color.text };

  return (
    <div
      data-cell
      onMouseDown={handleMouseDown}
      className={cn(
        'relative flex h-full min-w-0 items-start overflow-hidden border px-2 py-1.5',
        color.isHeader && 'bg-bg2 text-fg0',
        isSelected && !readOnly && 'outline outline-2 outline-[var(--fgAccent1)] -outline-offset-2',
        !readOnly && 'cursor-text',
      )}
      style={style}
    >
      {isEditingHere ? (
        <input
          ref={inputRef}
          value={cell.text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Add text"
          spellCheck={false}
          className={cn(
            'w-full bg-transparent leading-snug outline-none placeholder:text-[var(--fg4)]',
            sizeClass,
            fontFamily,
            weight,
            align,
          )}
        />
      ) : (
        <span
          className={cn(
            'w-full whitespace-pre-wrap break-words leading-snug',
            sizeClass,
            fontFamily,
            weight,
            align,
            cell.italic && 'italic',
            cell.strike && 'line-through',
          )}
        >
          {renderInline(cell.text)}
        </span>
      )}
    </div>
  );
}
