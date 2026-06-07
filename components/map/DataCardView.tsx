'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import type { MapCard, MapViz } from '@/lib/repo/schemas';
import { COLOR_HEX } from './colors';
import type { MapActions } from './use-map-store';

const PAD = 6;

function useSize(ref: React.RefObject<HTMLDivElement | null>) {
  const [size, setSize] = React.useState({ w: 0, h: 0 });
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (r) setSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

interface DataCardViewProps {
  card: MapCard;
  actions: MapActions;
}

interface ActivePoint {
  col: number;
  x: number;
  y: number;
}

interface PointDrag {
  col: number;
  seriesId: string;
  startY: number;
  startX: number;
  plotTop: number;
  plotH: number;
  maxVal: number;
  moved: boolean;
}

export function DataCardView({ card, actions }: DataCardViewProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const { w, h } = useSize(ref);
  const [active, setActive] = React.useState<ActivePoint | null>(null);
  const dragRef = React.useRef<PointDrag | null>(null);
  const justDragged = React.useRef(false);

  React.useEffect(() => {
    setActive(null);
  }, [card.colSpan, card.startCol]);

  const series = React.useMemo(() => card.series ?? [], [card.series]);
  const points = React.useMemo(
    () => [...(card.points ?? [])].sort((a, b) => a.col - b.col),
    [card.points],
  );
  const viz: MapViz = card.viz ?? 'line';

  const maxVal = React.useMemo(() => {
    let max = 0;
    for (const p of points) {
      if (viz === 'stackedBars') {
        const sum = series.reduce((acc, s) => acc + (p.values[s.id] ?? 0), 0);
        max = Math.max(max, sum);
      } else {
        for (const s of series) max = Math.max(max, p.values[s.id] ?? 0);
      }
    }
    return max <= 0 ? 1 : max * 1.15;
  }, [points, series, viz]);

  const plotW = Math.max(0, w - PAD * 2);
  const plotH = Math.max(0, h - PAD * 2);
  const xFor = (offset: number) => PAD + ((offset + 0.5) / card.colSpan) * plotW;
  const yFor = (v: number) => PAD + (1 - v / maxVal) * plotH;

  const showLines = viz === 'line' || viz === 'multiLine' || viz === 'lineWithPoints';
  const showDots = viz === 'scatter' || viz === 'lineWithPoints';
  const showBars = viz === 'bars' || viz === 'stackedBars';

  // Vertical drag to change a point's value.
  React.useEffect(() => {
    function onMove(e: PointerEvent) {
      const d = dragRef.current;
      if (!d) return;
      if (Math.abs(e.clientY - d.startY) > 3 || Math.abs(e.clientX - d.startX) > 3) d.moved = true;
      if (!d.moved) return;
      const v = Math.max(0, Math.round(d.maxVal * (1 - (e.clientY - d.plotTop) / Math.max(1, d.plotH))));
      actions.setPointValue(card.id, d.col, d.seriesId, v);
    }
    function onUp() {
      const d = dragRef.current;
      if (!d) return;
      justDragged.current = d.moved;
      dragRef.current = null;
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [actions, card.id]);

  function startPointDrag(e: React.PointerEvent, col: number) {
    e.stopPropagation();
    const point = points.find((p) => p.col === col);
    if (!point) return;
    const svg = (e.currentTarget as SVGElement).ownerSVGElement;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const localY = e.clientY - r.top;
    // Pick the series whose marker is nearest the cursor.
    let seriesId = series[0]?.id ?? '';
    let best = Infinity;
    for (const s of series) {
      const d = Math.abs(yFor(point.values[s.id] ?? 0) - localY);
      if (d < best) {
        best = d;
        seriesId = s.id;
      }
    }
    dragRef.current = {
      col,
      seriesId,
      startY: e.clientY,
      startX: e.clientX,
      plotTop: r.top + PAD,
      plotH,
      maxVal,
      moved: false,
    };
  }

  const slotW = plotW / card.colSpan;

  return (
    <div className="relative h-full w-full">
      <div ref={ref} className="h-full w-full">
        {w > 0 && h > 0 && (
          <svg width={w} height={h} className="overflow-visible">
            <line
              x1={PAD}
              y1={h - PAD}
              x2={w - PAD}
              y2={h - PAD}
              className="stroke-separator2"
              strokeWidth={0.5}
            />

            {showBars &&
              points.map((p) => {
                const barGroupX = xFor(p.col) - slotW * 0.35;
                const barW = (slotW * 0.7) / (viz === 'stackedBars' ? 1 : Math.max(1, series.length));
                if (viz === 'stackedBars') {
                  let yBase = h - PAD;
                  return (
                    <g key={p.col}>
                      {series.map((s) => {
                        const v = p.values[s.id] ?? 0;
                        const barH = (v / maxVal) * plotH;
                        const y = yBase - barH;
                        const rect = (
                          <rect
                            key={s.id}
                            x={barGroupX}
                            y={y}
                            width={barW}
                            height={Math.max(0, barH)}
                            fill={COLOR_HEX[s.color]}
                            opacity={0.85}
                          />
                        );
                        yBase = y;
                        return rect;
                      })}
                    </g>
                  );
                }
                return (
                  <g key={p.col}>
                    {series.map((s, si) => {
                      const v = p.values[s.id] ?? 0;
                      const barH = (v / maxVal) * plotH;
                      return (
                        <rect
                          key={s.id}
                          x={barGroupX + si * barW}
                          y={h - PAD - barH}
                          width={Math.max(0, barW - 1)}
                          height={Math.max(0, barH)}
                          fill={COLOR_HEX[s.color]}
                          opacity={0.85}
                        />
                      );
                    })}
                  </g>
                );
              })}

            {showLines &&
              series.map((s) => {
                const d = points
                  .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(p.col)} ${yFor(p.values[s.id] ?? 0)}`)
                  .join(' ');
                return (
                  <path
                    key={s.id}
                    d={d}
                    fill="none"
                    stroke={COLOR_HEX[s.color]}
                    strokeWidth={1.5}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                );
              })}

            {showDots &&
              series.map((s) =>
                points.map((p) => (
                  <circle
                    key={`${s.id}-${p.col}`}
                    cx={xFor(p.col)}
                    cy={yFor(p.values[s.id] ?? 0)}
                    r={2}
                    fill={COLOR_HEX[s.color]}
                  />
                )),
              )}

            {/* Drag (up/down) or click per column to edit values */}
            {points.map((p) => (
              <g key={`hit-${p.col}`}>
                <rect
                  data-no-drag
                  x={xFor(p.col) - slotW / 2}
                  y={PAD}
                  width={slotW}
                  height={plotH}
                  fill="transparent"
                  className="cursor-ns-resize"
                  onPointerDown={(e) => startPointDrag(e, p.col)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (justDragged.current) {
                      justDragged.current = false;
                      return;
                    }
                    const r = (e.currentTarget as SVGRectElement).getBoundingClientRect();
                    setActive((cur) =>
                      cur?.col === p.col ? null : { col: p.col, x: r.left + r.width / 2, y: r.top },
                    );
                  }}
                />
                {series.map((s) => (
                  <circle
                    key={`marker-${s.id}-${p.col}`}
                    cx={xFor(p.col)}
                    cy={yFor(p.values[s.id] ?? 0)}
                    r={active?.col === p.col ? 3 : 0}
                    fill={COLOR_HEX[s.color]}
                    stroke="white"
                    strokeWidth={0.75}
                    className="pointer-events-none"
                  />
                ))}
              </g>
            ))}
          </svg>
        )}
      </div>

      {active && (
        <PointEditorPortal
          card={card}
          col={active.col}
          anchorX={active.x}
          anchorY={active.y}
          actions={actions}
          onClose={() => setActive(null)}
        />
      )}
    </div>
  );
}

function PointEditorPortal({
  card,
  col,
  anchorX,
  anchorY,
  actions,
  onClose,
}: {
  card: MapCard;
  col: number;
  anchorX: number;
  anchorY: number;
  actions: MapActions;
  onClose: () => void;
}) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!mounted) return null;
  const point = (card.points ?? []).find((p) => p.col === col);
  const series = card.series ?? [];
  if (!point) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60]" onPointerDown={onClose}>
      <div
        data-no-drag
        onPointerDown={(e) => e.stopPropagation()}
        className="border-separator2 bg-bg2 absolute flex w-max flex-col gap-1 rounded-md border p-1.5 shadow-lg"
        style={{ left: anchorX, top: anchorY - 8, transform: 'translate(-50%, -100%)' }}
      >
        <div className="text-fg3 px-0.5 font-mono text-[9px] uppercase tracking-wide">
          t{card.startCol + col}
        </div>
        {series.map((s) => (
          <label key={s.id} className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ background: COLOR_HEX[s.color] }} />
            <input
              type="number"
              autoFocus={s.id === series[0]?.id}
              value={point.values[s.id] ?? 0}
              onChange={(e) => actions.setPointValue(card.id, col, s.id, Number(e.target.value) || 0)}
              className="border-separator1 bg-bg1 text-fg0 h-6 w-16 rounded border px-1 text-xs outline-none"
            />
          </label>
        ))}
        <button type="button" onClick={onClose} className="text-fg3 hover:text-fg1 mt-0.5 text-[9px]">
          done
        </button>
      </div>
    </div>,
    document.body,
  );
}
