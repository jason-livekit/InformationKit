'use client';

import * as React from 'react';
import { cn } from '@/lib/bytes/utils';
import type { MapTable } from '@/lib/repo/schemas';
import { DEFAULT_COL_WIDTH, createInitialTable } from './grid';
import { MapTableView } from './MapTableView';
import { useMap, useMapApi } from './useMapStore';

const EDGE = 64; // viewport breathing room
const HANDLE_PAD = 40; // space around the table for chrome handles

interface MapCanvasProps {
  table: MapTable;
  readOnly?: boolean;
}

export function MapCanvas({ table, readOnly }: MapCanvasProps) {
  const api = useMapApi();
  const focusTarget = useMap((s) => s.focusTarget);
  const caret = useMap((s) => s.caret);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const [vp, setVp] = React.useState({ w: 1000, h: 700 });
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [settling, setSettling] = React.useState(true);
  const settleTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedFor = React.useRef<string>('');

  const baseWidth = sum(table.columnWidths) || DEFAULT_COL_WIDTH;
  const rowCount = Math.max(1, table.rows.length);

  const zFit = (vp.w - 2 * EDGE) / Math.max(1, baseWidth);
  const zMin = clamp(zFit, 0.25, 1.2);
  const zMax = Math.max(zMin + 0.6, zMin + rowCount * 0.55 + 0.4);

  const revealCount = clamp(
    Math.round(1 + (rowCount - 1) * ((zoom - zMin) / Math.max(0.0001, zMax - zMin))),
    1,
    rowCount,
  );

  const colW = table.columnWidths.map((w) => w * zoom);
  const tableW = sum(colW);
  const tableH = sumRowHeights(table, revealCount);

  // Mirror live values into refs for the stable native gesture listeners.
  const zoomRef = React.useRef(zoom);
  const zMinRef = React.useRef(zMin);
  const zMaxRef = React.useRef(zMax);
  zoomRef.current = zoom;
  zMinRef.current = zMin;
  zMaxRef.current = zMax;

  // Measure viewport.
  React.useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setVp({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setVp({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // Center on first layout / when switching pages.
  const pageKey = `${table.rows.length}:${baseWidth}`;
  React.useEffect(() => {
    if (initializedFor.current === pageKey && initializedFor.current !== '') return;
    initializedFor.current = pageKey || 'x';
    setZoom(zMin);
    // center after a tick when dims are known
    requestAnimationFrame(() => centerTable(zMin));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageKey]);

  function centerTable(z = zoom) {
    const w = sum(table.columnWidths.map((x) => x * z));
    const h = sumRowHeights(table, rowCountForZoom(z));
    setSettling(true);
    setPan({
      x: vp.w / 2 - w / 2 - HANDLE_PAD,
      y: vp.h / 2 - h / 2 - HANDLE_PAD,
    });
  }

  function rowCountForZoom(z: number) {
    return clamp(Math.round(1 + (rowCount - 1) * ((z - zMin) / Math.max(0.0001, zMax - zMin))), 1, rowCount);
  }

  function clampPan(p: { x: number; y: number }, w: number, h: number) {
    const out = { ...p };
    // X axis
    if (w + 2 * HANDLE_PAD <= vp.w - 2 * EDGE) {
      out.x = vp.w / 2 - w / 2 - HANDLE_PAD;
    } else {
      const max = EDGE - HANDLE_PAD;
      const min = vp.w - EDGE - HANDLE_PAD - w;
      out.x = clamp(out.x, min, max);
    }
    // Y axis
    if (h + 2 * HANDLE_PAD <= vp.h - 2 * EDGE) {
      out.y = vp.h / 2 - h / 2 - HANDLE_PAD;
    } else {
      const max = EDGE - HANDLE_PAD;
      const min = vp.h - EDGE - HANDLE_PAD - h;
      out.y = clamp(out.y, min, max);
    }
    return out;
  }

  function scheduleSettle() {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      setSettling(true);
      setPan((p) => clampPan(p, tableW, tableH));
    }, 140);
  }

  // Keep the latest wheel logic in a ref so the (stable) native listener never
  // sees a stale closure for zMin/zMax/etc.
  const onWheelRef = React.useRef<(e: WheelEvent) => void>(() => {});
  onWheelRef.current = (e: WheelEvent) => {
    // Always prevent default so the *page* never scrolls or pinch-zooms while
    // the pointer is over the canvas — the canvas owns the gesture.
    e.preventDefault();
    setSettling(false);
    if (e.ctrlKey || e.metaKey) {
      const factor = Math.exp(-e.deltaY * 0.0015);
      setZoom((z) => clamp(z * factor, zMin * 0.85, zMax * 1.15));
    } else {
      setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
    scheduleSettle();
  };

  // Native, non-passive wheel + Safari gesture listeners. React's synthetic
  // onWheel is passive, so its preventDefault() can't stop browser page zoom.
  React.useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => onWheelRef.current(e);
    let gestureStartZoom = 1;
    const gestureStart = (e: Event) => {
      e.preventDefault();
      gestureStartZoom = zoomRef.current;
    };
    const gestureChange = (e: Event) => {
      e.preventDefault();
      const scale = (e as unknown as { scale: number }).scale || 1;
      setSettling(false);
      setZoom(clamp(gestureStartZoom * scale, zMinRef.current * 0.85, zMaxRef.current * 1.15));
      scheduleSettle();
    };
    el.addEventListener('wheel', wheel, { passive: false });
    el.addEventListener('gesturestart', gestureStart as EventListener, { passive: false });
    el.addEventListener('gesturechange', gestureChange as EventListener, { passive: false });
    return () => {
      el.removeEventListener('wheel', wheel);
      el.removeEventListener('gesturestart', gestureStart as EventListener);
      el.removeEventListener('gesturechange', gestureChange as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Background drag-to-pan.
  function handlePointerDown(e: React.PointerEvent) {
    const target = e.target as HTMLElement;
    if (target.closest('[data-cell]') || target.closest('button')) return;
    if (!readOnly) {
      api.getState().setEditing(false);
      api.getState().select({ kind: 'none' });
    }
    const startX = e.clientX;
    const startY = e.clientY;
    const startPan = { ...pan };
    setSettling(false);
    const onMove = (ev: PointerEvent) => {
      setPan({ x: startPan.x + (ev.clientX - startX), y: startPan.y + (ev.clientY - startY) });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      scheduleSettle();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  function zForReveal(n: number) {
    if (rowCount <= 1) return zMax;
    return zMin + ((n - 1) / (rowCount - 1)) * (zMax - zMin);
  }

  function revealNext() {
    const target = Math.min(rowCount, revealCount + 1);
    setSettling(true);
    setZoom(zForReveal(target));
    requestAnimationFrame(() => setPan((p) => clampPan(p, tableW, tableH)));
  }

  // Find-on-page: focus a specific cell.
  React.useEffect(() => {
    if (!focusTarget) return;
    const targetReveal = Math.min(rowCount, focusTarget.row + 1);
    const z = Math.max(zoom, zForReveal(targetReveal));
    setSettling(true);
    setZoom(z);
    requestAnimationFrame(() => {
      const cw = table.columnWidths.map((x) => x * z);
      const offs = prefix(cw);
      const ranges = table.rows[focusTarget.row]
        ? cellRangesQuick(table, focusTarget.row)
        : [];
      const start = ranges[focusTarget.cell]?.start ?? 0;
      const cx = (offs[start] ?? 0) + (cw[start] ?? 0) / 2;
      const cy = sumRowHeights(table, focusTarget.row) + (table.rows[focusTarget.row]?.height ?? 48) / 2;
      setPan({ x: vp.w / 2 - cx - HANDLE_PAD, y: vp.h / 2 - cy - HANDLE_PAD });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusTarget?.nonce]);

  // Auto-reveal: if the caret moves to (or a row is added at) a row hidden by
  // the level-of-detail zoom, zoom in just enough to show it. This keeps newly
  // added / edited rows visible instead of being hidden below the fold.
  React.useEffect(() => {
    if (!caret) return;
    const needed = caret.row + 1;
    if (needed > revealCount) {
      setSettling(true);
      setZoom(zForReveal(needed));
      requestAnimationFrame(() => setPan((p) => clampPan(p, tableW, tableH)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caret?.row, table.rows.length]);

  const isEmpty = table.rows.length === 0;

  return (
    <div
      ref={viewportRef}
      onPointerDown={handlePointerDown}
      className="map-canvas relative h-full w-full touch-none overflow-hidden overscroll-none"
      style={{
        background:
          'radial-gradient(var(--separator1) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
      }}
    >
      {isEmpty ? (
        <button
          type="button"
          disabled={readOnly}
          onClick={() => !readOnly && api.getState().applyGrid(startTyping())}
          className="text-fg3 hover:text-fg1 absolute inset-0 m-auto flex h-fit w-fit flex-col items-center gap-2 text-sm disabled:opacity-60"
        >
          <span className="border-separator2 bg-bg1 rounded-lg border border-dashed px-6 py-5">
            Click to start your table — then type{' '}
            <code className="font-mono">| like | this |</code>
          </span>
        </button>
      ) : (
        <div
          className={cn('absolute left-0 top-0 origin-top-left', settling && 'transition-transform duration-300 ease-out')}
          style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
        >
          <div style={{ paddingLeft: HANDLE_PAD, paddingTop: HANDLE_PAD }}>
            <MapTableView table={table} zoom={zoom} revealCount={revealCount} readOnly={readOnly} />
          </div>
        </div>
      )}

      {/* Ellipsis "more below" pill — stays horizontally centered in the view. */}
      {!isEmpty && revealCount < rowCount && (
        <button
          type="button"
          onClick={revealNext}
          title="Show more rows"
          className="group bg-bg1/70 hover:bg-bg1 text-fg3 hover:text-fg1 absolute bottom-6 left-1/2 flex h-7 -translate-x-1/2 items-center justify-center rounded-full px-3 text-base backdrop-blur transition-all"
        >
          <span className="opacity-60 group-hover:opacity-100">⋯</span>
        </button>
      )}

      {/* Zoom readout */}
      {!isEmpty && (
        <div className="text-fg4 bg-bg1/60 absolute bottom-3 right-3 rounded px-2 py-1 font-mono text-[10px] backdrop-blur">
          {revealCount}/{rowCount} rows
        </div>
      )}
    </div>
  );
}

function startTyping() {
  const init = createInitialTable();
  return init;
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
function sumRowHeights(table: MapTable, count: number): number {
  let h = 0;
  for (let i = 0; i < Math.min(count, table.rows.length); i++) h += table.rows[i]!.height;
  return h;
}
function cellRangesQuick(table: MapTable, rowIndex: number) {
  const row = table.rows[rowIndex];
  if (!row) return [];
  const out: Array<{ start: number; end: number }> = [];
  let s = 0;
  for (const c of row.cells) {
    out.push({ start: s, end: s + c.colSpan });
    s += c.colSpan;
  }
  return out;
}
