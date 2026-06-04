'use client';

import * as React from 'react';
import { cn } from '@/lib/bytes/utils';
import type { MapTable, MapTextSize } from '@/lib/repo/schemas';
import { computeTableColors } from './colors';
import {
  cellRanges,
  addColumn,
  addRow,
  moveColumn,
  moveRow,
  setColumnWidth,
  setRowHeight,
} from './grid';
import { TableCell } from './TableCell';
import { useMap, useMapApi } from './useMapStore';

const HANDLE = 14;
const ADD_BTN = 26;

interface MapTableViewProps {
  table: MapTable;
  /** Horizontal width multiplier (zoom). Row heights are NOT scaled. */
  zoom: number;
  /** Level-of-detail: how many top rows are visible. */
  revealCount: number;
  readOnly?: boolean;
}

export function MapTableView({ table, zoom, revealCount, readOnly }: MapTableViewProps) {
  const api = useMapApi();
  const selection = useMap((s) => s.selection);
  const textSize: MapTextSize = table.textSize ?? 'small';

  const colW = table.columnWidths.map((w) => w * zoom);
  const colOffsets = prefix(colW);
  const visibleRows = table.rows.slice(0, Math.max(1, revealCount));
  const rowH = visibleRows.map((r) => r.height);
  const rowOffsets = prefix(rowH);
  const tableW = sum(colW);
  const tableH = sum(rowH);
  const colors = computeTableColors(table);

  const tableSelected = selection.kind === 'table' && !readOnly;

  function dragReorder(
    e: React.PointerEvent,
    axis: 'row' | 'col',
    index: number,
  ) {
    if (readOnly) return;
    const startX = e.clientX;
    const startY = e.clientY;
    let moved = false;
    const onMove = (ev: PointerEvent) => {
      if (Math.abs(ev.clientX - startX) + Math.abs(ev.clientY - startY) > 4) moved = true;
    };
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (!moved) {
        api.getState().setEditing(false);
        api.getState().select(axis === 'row' ? { kind: 'row', row: index } : { kind: 'column', col: index });
        return;
      }
      if (axis === 'row') {
        const delta = ev.clientY - startY;
        const target = clamp(index + Math.round(delta / Math.max(1, rowH[index] ?? 48)), 0, table.rows.length - 1);
        if (target !== index) api.getState().replaceTable(moveRow(table, index, target));
      } else {
        const delta = ev.clientX - startX;
        const target = clamp(index + Math.round(delta / Math.max(1, colW[index] ?? 140)), 0, table.columnCount - 1);
        if (target !== index) api.getState().replaceTable(moveColumn(table, index, target));
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  function resizeColumn(e: React.PointerEvent, col: number) {
    if (readOnly) return;
    e.stopPropagation();
    const startX = e.clientX;
    const startW = table.columnWidths[col] ?? 140;
    const onMove = (ev: PointerEvent) => {
      const next = startW + (ev.clientX - startX) / zoom;
      api.getState().replaceTable(setColumnWidth(api.getState().activeTable(), col, next));
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  function resizeRow(e: React.PointerEvent, row: number) {
    if (readOnly) return;
    e.stopPropagation();
    const startY = e.clientY;
    const startH = table.rows[row]?.height ?? 48;
    const onMove = (ev: PointerEvent) => {
      api.getState().replaceTable(setRowHeight(api.getState().activeTable(), row, startH + (ev.clientY - startY)));
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  return (
    <div className="relative" style={{ width: tableW, height: tableH }}>
      {/* Cells */}
      {visibleRows.map((row, r) => {
        const ranges = cellRanges(row);
        return row.cells.map((cell, i) => {
          const start = ranges[i]!.start;
          const span = cell.colSpan;
          const x = colOffsets[start] ?? 0;
          const w = sum(colW.slice(start, start + span));
          return (
            <div
              key={cell.id}
              className="absolute"
              style={{ left: x, top: rowOffsets[r], width: w, height: rowH[r] }}
            >
              <TableCell
                cell={cell}
                rowIndex={r}
                cellIndex={i}
                color={colors[r]?.[i] ?? { fill: '', border: '', text: '', isHeader: false }}
                textSize={textSize}
                readOnly={readOnly}
              />
            </div>
          );
        });
      })}

      {!readOnly && (
        <>
          {/* Column handles (top) — click to select, drag to reorder */}
          {colW.map((w, c) => (
            <div
              key={`ch-${c}`}
              onPointerDown={(e) => dragReorder(e, 'col', c)}
              title="Select / drag column"
              className={cn(
                'bg-bg3 hover:bg-fgAccent1/40 absolute cursor-grab rounded-t-sm transition-colors',
                selection.kind === 'column' && selection.col === c && 'bg-fgAccent1',
              )}
              style={{ left: colOffsets[c], top: -HANDLE - 2, width: w - 2, height: HANDLE }}
            />
          ))}

          {/* Row handles (left) */}
          {rowH.map((h, r) => (
            <div
              key={`rh-${r}`}
              onPointerDown={(e) => dragReorder(e, 'row', r)}
              title="Select / drag row"
              className={cn(
                'bg-bg3 hover:bg-fgAccent1/40 absolute cursor-grab rounded-l-sm transition-colors',
                selection.kind === 'row' && selection.row === r && 'bg-fgAccent1',
              )}
              style={{ left: -HANDLE - 2, top: rowOffsets[r], width: HANDLE, height: h - 2 }}
            />
          ))}

          {/* Column resizers */}
          {colW.map((_, c) => (
            <div
              key={`crz-${c}`}
              onPointerDown={(e) => resizeColumn(e, c)}
              className="hover:bg-fgAccent1/50 absolute z-10 cursor-col-resize"
              style={{ left: (colOffsets[c + 1] ?? tableW) - 3, top: 0, width: 6, height: tableH }}
            />
          ))}

          {/* Row resizers */}
          {rowH.map((_, r) => (
            <div
              key={`rrz-${r}`}
              onPointerDown={(e) => resizeRow(e, r)}
              className="hover:bg-fgAccent1/50 absolute z-10 cursor-row-resize"
              style={{ left: 0, top: (rowOffsets[r + 1] ?? tableH) - 3, width: tableW, height: 6 }}
            />
          ))}

          {/* Add column (right) */}
          <button
            type="button"
            onClick={() => api.getState().applyGrid(addColumn({ table, caret: { row: 0, cell: 0, offset: 0 } }))}
            title="Add column"
            className="bg-fgAccent1 text-bg1 hover:bg-fgAccent2 absolute flex items-center justify-center rounded-md text-lg leading-none shadow-sm"
            style={{ left: tableW + 8, top: tableH / 2 - ADD_BTN / 2, width: ADD_BTN, height: Math.min(tableH, 120) }}
          >
            +
          </button>

          {/* Add row (bottom) */}
          <button
            type="button"
            onClick={() => api.getState().applyGrid(addRow({ table, caret: { row: 0, cell: 0, offset: 0 } }))}
            title="Add row"
            className="bg-fgAccent1/20 text-fgAccent1 hover:bg-fgAccent1/30 absolute flex items-center justify-center rounded-md text-lg leading-none"
            style={{ left: 0, top: tableH + 8, width: tableW, height: ADD_BTN }}
          >
            +
          </button>

          {/* Table selection corner handles */}
          {tableSelected &&
            corners(tableW, tableH).map((pos, i) => (
              <div
                key={`corner-${i}`}
                className="border-fgAccent1 bg-bg0 absolute h-2.5 w-2.5 rounded-sm border"
                style={{ left: pos.x - 5, top: pos.y - 5, cursor: pos.cursor }}
              />
            ))}
        </>
      )}
    </div>
  );
}

function prefix(arr: number[]): number[] {
  const out: number[] = [0];
  for (let i = 0; i < arr.length; i++) out.push(out[i]! + arr[i]!);
  return out;
}
function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}
function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
function corners(w: number, h: number) {
  return [
    { x: 0, y: 0, cursor: 'nwse-resize' },
    { x: w, y: 0, cursor: 'nesw-resize' },
    { x: 0, y: h, cursor: 'nesw-resize' },
    { x: w, y: h, cursor: 'nwse-resize' },
  ];
}
