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
} from './grid';
import { useMap, useMapApi } from './useMapStore';

const SIZE_CLASS: Record<MapTextSize, string> = {
  small: 'text-xs',
  medium: 'text-sm',
  large: 'text-base',
  xlarge: 'text-xl',
  huge: 'text-3xl',
};

/** Render inline markdown (**bold**, *italic*, ~~strike~~) for one line. */
function renderInlineLine(text: string, keyBase: number): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|~~([^~]+)~~)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = keyBase * 1000;
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

/** Render multi-line text with inline markdown per line (read view). */
function renderMultiline(text: string): React.ReactNode {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, i) => (
    <React.Fragment key={i}>
      {i > 0 && <br />}
      {renderInlineLine(line, i)}
    </React.Fragment>
  ));
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
  const taRef = React.useRef<HTMLTextAreaElement>(null);

  const isCaretCell = caret?.row === rowIndex && caret?.cell === cellIndex;
  const isEditingHere = isCaretCell && editing && !readOnly;
  const isSelected =
    (selection.kind === 'cell' && selection.row === rowIndex && selection.cell === cellIndex) ||
    (selection.kind === 'row' && selection.row === rowIndex) ||
    selection.kind === 'table';

  // Auto-size the textarea to its content so the flex container can center it.
  React.useLayoutEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [cell.text, textSize, cell.mono, cell.bold]);

  // Focus + restore caret offset when keyboard navigation lands here.
  React.useEffect(() => {
    if (isEditingHere && taRef.current) {
      const el = taRef.current;
      el.focus({ preventScroll: true });
      const off = Math.min(caret?.offset ?? el.value.length, el.value.length);
      try {
        el.setSelectionRange(off, off);
      } catch {
        /* noop */
      }
    }
  }, [isEditingHere, caret?.offset, caret?.row, caret?.cell]);

  function gridState(off: number): GridState {
    return { table: api.getState().activeTable(), caret: { row: rowIndex, cell: cellIndex, offset: off } };
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const el = taRef.current;
    if (!el) return;
    const off = el.selectionStart ?? cell.text.length;
    const val = el.value;
    const atStart = off === 0 && el.selectionEnd === 0;
    const atEnd = off === val.length && el.selectionEnd === val.length;
    const atFirstLine = val.lastIndexOf('\n', off - 1) === -1;
    const atLastLine = val.indexOf('\n', off) === -1;

    if (e.key === '|') {
      e.preventDefault();
      api.getState().applyGrid(typePipe(gridState(off)));
      return;
    }
    if (e.key === 'Enter') {
      // Shift+Enter inserts a line break inside the cell (default behavior).
      if (e.shiftKey) return;
      e.preventDefault();
      if (cell.text === '---') {
        const dashed = applyHeaderDashes(gridState(off));
        if (dashed) {
          api.getState().applyGrid(dashed);
          return;
        }
      }
      api.getState().applyGrid(typeEnter(gridState(off)));
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      api.getState().applyGrid(moveTab(gridState(off), e.shiftKey ? -1 : 1));
      return;
    }
    if (e.key === 'Backspace' && atStart) {
      const next = backspaceAtStart(gridState(off));
      if (next) {
        e.preventDefault();
        api.getState().applyGrid(next);
      }
      return;
    }
    if ((e.key === 'Delete' || (e.key === 'Backspace' && (e.metaKey || e.ctrlKey))) && atEnd) {
      const next = deleteAtEnd(gridState(off));
      if (next) {
        e.preventDefault();
        api.getState().applyGrid(next);
      }
      return;
    }
    if (e.key === 'ArrowLeft' && atStart) {
      e.preventDefault();
      api.getState().applyGrid(moveHorizontal(gridState(off), -1));
      return;
    }
    if (e.key === 'ArrowRight' && atEnd) {
      e.preventDefault();
      api.getState().applyGrid(moveHorizontal(gridState(off), 1));
      return;
    }
    if (e.key === 'ArrowUp' && atFirstLine) {
      e.preventDefault();
      api.getState().applyGrid(moveVertical(gridState(off), -1));
      return;
    }
    if (e.key === 'ArrowDown' && atLastLine) {
      e.preventDefault();
      api.getState().applyGrid(moveVertical(gridState(off), 1));
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      api.getState().setEditing(false);
      api.getState().select({ kind: 'cell', row: rowIndex, cell: cellIndex });
      el.blur();
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    const newOffset = e.target.selectionStart ?? value.length;
    api.getState().applyGrid(setCellText(gridState(newOffset), value, newOffset));
  }

  function handleFocus() {
    if (readOnly) return;
    const st = api.getState();
    const already = st.caret?.row === rowIndex && st.caret?.cell === cellIndex && st.editing;
    if (!already) {
      st.select({ kind: 'cell', row: rowIndex, cell: cellIndex });
      st.setCaret({ row: rowIndex, cell: cellIndex, offset: cell.text.length });
      st.setEditing(true);
    }
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (readOnly) return;
    // Clicking anywhere in the cell (incl. padding) focuses the text field.
    if (e.target !== taRef.current) {
      e.preventDefault();
      const el = taRef.current;
      el?.focus({ preventScroll: true });
      const len = cell.text.length;
      requestAnimationFrame(() => {
        try {
          el?.setSelectionRange(len, len);
        } catch {
          /* noop */
        }
      });
    }
    const st = api.getState();
    st.select({ kind: 'cell', row: rowIndex, cell: cellIndex });
    st.setCaret({ row: rowIndex, cell: cellIndex, offset: cell.text.length });
    st.setEditing(true);
  }

  const sizeClass = SIZE_CLASS[textSize];
  const fontFamily = cell.mono ? 'font-mono' : 'font-sans';
  const weight = color.isHeader || cell.bold ? 'font-semibold' : 'font-normal';
  const alignClass =
    cell.align === 'left' ? 'text-left' : cell.align === 'right' ? 'text-right' : 'text-center';
  const justify =
    cell.align === 'left' ? 'justify-start' : cell.align === 'right' ? 'justify-end' : 'justify-center';

  return (
    <div
      data-cell
      data-cellpos={`${rowIndex}:${cellIndex}`}
      onMouseDown={handleMouseDown}
      className={cn(
        'relative flex h-full min-w-0 items-center overflow-hidden rounded-[2px] border px-3 py-2',
        justify,
        isSelected && !readOnly && 'outline outline-2 outline-[var(--fgAccent1)] -outline-offset-2',
        !readOnly && 'cursor-text',
      )}
      style={{ backgroundColor: color.fill, borderColor: color.border, color: color.text }}
    >
      {readOnly ? (
        <div
          className={cn(
            'w-full whitespace-pre-wrap break-words leading-snug',
            sizeClass,
            fontFamily,
            weight,
            alignClass,
            cell.italic && 'italic',
            cell.strike && 'line-through',
          )}
        >
          {renderMultiline(cell.text)}
        </div>
      ) : (
        <textarea
          ref={taRef}
          rows={1}
          value={cell.text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={isEditingHere ? 'Add text' : ''}
          spellCheck={false}
          className={cn(
            'w-full resize-none overflow-hidden bg-transparent leading-snug outline-none placeholder:text-[var(--fg4)]',
            sizeClass,
            fontFamily,
            weight,
            alignClass,
            cell.italic && 'italic',
            cell.strike && 'line-through',
          )}
        />
      )}
    </div>
  );
}
