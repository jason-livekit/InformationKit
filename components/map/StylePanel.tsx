'use client';

import * as React from 'react';
import { cn } from '@/lib/bytes/utils';
import type { MapTextSize } from '@/lib/repo/schemas';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/bytes/Popover';
import { TrashCanIcon } from '@/icons/react';
import { HUE_ANGLES, oklch } from './colors';
import { deleteColumn, deleteRow } from './grid';
import { useMap, useMapApi, type Selection } from './useMapStore';

const SIZES: Array<{ key: MapTextSize; label: string }> = [
  { key: 'small', label: 'Small' },
  { key: 'medium', label: 'Medium' },
  { key: 'large', label: 'Large' },
  { key: 'xlarge', label: 'Extra large' },
  { key: 'huge', label: 'Huge' },
];

interface PanelPos {
  left: number;
  top: number;
  above: boolean;
}

/** Locate the DOM element the panel should hover near for the current selection. */
function findAnchor(selection: Selection): Element | null {
  if (selection.kind === 'cell') {
    return document.querySelector(`[data-cellpos="${selection.row}:${selection.cell}"]`);
  }
  if (selection.kind === 'row') {
    return (
      document.querySelector(`[data-rowpos="${selection.row}"]`) ||
      document.querySelector(`[data-cellpos="${selection.row}:0"]`)
    );
  }
  if (selection.kind === 'column') {
    return document.querySelector(`[data-colpos="${selection.col}"]`);
  }
  return null;
}

export function StylePanel() {
  const api = useMapApi();
  const selection = useMap((s) => s.selection);
  const editing = useMap((s) => s.editing);
  const caret = useMap((s) => s.caret);
  const table = useMap((s) => s.activePage().table);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState<PanelPos | null>(null);

  const visible = selection.kind !== 'none' || editing;

  // Glue the panel to the selected element (above, or below if no room),
  // following the canvas as it pans/zooms via a per-frame measurement.
  React.useEffect(() => {
    if (!visible) {
      setPos(null);
      return;
    }
    let raf = 0;
    const tick = () => {
      const anchor = findAnchor(selection);
      const panelH = panelRef.current?.offsetHeight ?? 48;
      if (anchor) {
        const r = anchor.getBoundingClientRect();
        const gap = 10;
        const above = r.top > panelH + gap + 8;
        const top = above ? r.top - gap : r.bottom + gap;
        const left = Math.min(Math.max(r.left + r.width / 2, 160), window.innerWidth - 160);
        setPos({ left, top, above });
      } else {
        // Table / fallback: pinned to the top-center of the viewport.
        setPos(null);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, selection.kind, (selection as { row?: number }).row, (selection as { col?: number }).col, (selection as { cell?: number }).cell, caret?.row, caret?.cell]);

  if (!visible) return null;

  const scopeLabel =
    selection.kind === 'table'
      ? 'Table'
      : selection.kind === 'row'
        ? 'Row'
        : selection.kind === 'column'
          ? 'Column'
          : 'Cell';

  const currentSize: MapTextSize = table.textSize ?? 'small';

  const floatingStyle: React.CSSProperties = pos
    ? {
        position: 'fixed',
        left: pos.left,
        top: pos.top,
        transform: `translate(-50%, ${pos.above ? '-100%' : '0'})`,
      }
    : { position: 'absolute', left: '50%', top: 16, transform: 'translateX(-50%)' };

  return (
    <div
      ref={panelRef}
      style={floatingStyle}
      className="border-separator1 bg-bg0/95 dark:bg-bg3 z-30 flex items-center gap-1 rounded-xl border p-1.5 shadow-lg backdrop-blur">
      <span className="text-fg4 px-2 font-mono text-[10px] uppercase tracking-wider">{scopeLabel}</span>
      <Divider />

      {/* Color hue picker */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            title="Color"
            className="border-separator1 hover:bg-bg2 flex h-7 items-center gap-1 rounded-md border px-1.5"
          >
            <span
              className="border-separator2 h-4 w-4 rounded-full border"
              style={{ background: oklch(0.85, 0.06, 60) }}
            />
            <span className="text-fg3 text-[10px]">▾</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          <div className="grid grid-cols-7 gap-1.5">
            <button
              type="button"
              onClick={() => api.getState().applyHue(null)}
              title="Automatic"
              className="border-separator2 text-fg3 flex h-6 w-6 items-center justify-center rounded-full border text-[10px]"
            >
              A
            </button>
            {HUE_ANGLES.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => api.getState().applyHue(h)}
                title={`Hue ${h}`}
                className="border-separator2 h-6 w-6 rounded-full border transition-transform hover:scale-110"
                style={{ background: oklch(0.78, 0.13, h) }}
              />
            ))}
          </div>
          <p className="text-fg4 mt-2 text-[10px]">
            Lightness stays automatic (dark top → light bottom). Picking a hue cascades to aligned
            cells.
          </p>
        </PopoverContent>
      </Popover>

      <Divider />

      {/* Font family (Aa) */}
      <ToggleBtn
        label="Aa"
        title="Toggle monospace"
        onClick={() => api.getState().toggleMark('mono')}
      />

      {/* Text size */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="border-separator1 hover:bg-bg2 text-fg1 flex h-7 items-center gap-2 rounded-md border px-2 text-xs"
          >
            {SIZES.find((s) => s.key === currentSize)?.label ?? 'Small'}
            <span className="text-fg3 text-[10px]">▾</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-1" align="start">
          {SIZES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => api.getState().setTextSize(s.key)}
              className={cn(
                'hover:bg-bg2 flex w-full items-center justify-between rounded px-2 py-1.5 text-sm',
                currentSize === s.key && 'text-fgAccent1',
              )}
            >
              {s.label}
              {currentSize === s.key && <span>✓</span>}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      <Divider />

      <ToggleBtn label="B" title="Bold" bold onClick={() => api.getState().toggleMark('bold')} />
      <ToggleBtn label="I" title="Italic" italic onClick={() => api.getState().toggleMark('italic')} />
      <ToggleBtn label="S" title="Strikethrough" strike onClick={() => api.getState().toggleMark('strike')} />

      <Divider />

      <ToggleBtn label="⟸" title="Align left" onClick={() => api.getState().setAlign('left')} />
      <ToggleBtn label="≡" title="Align center" onClick={() => api.getState().setAlign('center')} />
      <ToggleBtn label="⟹" title="Align right" onClick={() => api.getState().setAlign('right')} />

      {(selection.kind === 'row' || selection.kind === 'column') && (
        <>
          <Divider />
          <button
            type="button"
            title={`Delete ${selection.kind}`}
            onClick={() => {
              const t = api.getState().activeTable();
              if (selection.kind === 'row') {
                api.getState().applyGrid(
                  deleteRow({ table: t, caret: { row: selection.row, cell: 0, offset: 0 } }, selection.row),
                );
              } else if (selection.kind === 'column') {
                api.getState().applyGrid(
                  deleteColumn({ table: t, caret: { row: 0, cell: 0, offset: 0 } }, selection.col),
                );
              }
              api.getState().select({ kind: 'none' });
            }}
            className="text-fgSerious1 hover:bg-bgSerious2 flex h-7 min-w-7 items-center justify-center rounded-md px-1.5"
          >
            <TrashCanIcon className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}

function Divider() {
  return <span className="bg-separator1 mx-0.5 h-5 w-px" />;
}

function ToggleBtn({
  label,
  title,
  onClick,
  bold,
  italic,
  strike,
}: {
  label: string;
  title: string;
  onClick: () => void;
  bold?: boolean;
  italic?: boolean;
  strike?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        'hover:bg-bg2 text-fg1 flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-sm',
        bold && 'font-bold',
        italic && 'italic',
        strike && 'line-through',
      )}
    >
      {label}
    </button>
  );
}
