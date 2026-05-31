'use client';

import * as React from 'react';
import type { MapCard, MapViz } from '@/lib/repo/schemas';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/bytes/DropdownMenu';
import { COLOR_HEX } from './colors';
import type { MapActions } from './use-map-store';

const PAD = 6;

const VIZ_LABELS: Record<MapViz, string> = {
  line: 'Line',
  multiLine: 'Multiple lines',
  bars: 'Bars',
  stackedBars: 'Stacked bars',
  scatter: 'Scatter',
  lineWithPoints: 'Line + points',
};
const VIZ_ORDER: MapViz[] = ['line', 'multiLine', 'bars', 'stackedBars', 'scatter', 'lineWithPoints'];

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
  columnCount: number;
  actions: MapActions;
}

export function DataCardView({ card, actions }: DataCardViewProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const { w, h } = useSize(ref);
  const [activeCol, setActiveCol] = React.useState<number | null>(null);

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
  const xFor = (col: number) =>
    PAD + ((col - card.startCol + 0.5) / card.colSpan) * plotW;
  const yFor = (v: number) => PAD + (1 - v / maxVal) * plotH;

  const showLines = viz === 'line' || viz === 'multiLine' || viz === 'lineWithPoints';
  const showDots = viz === 'scatter' || viz === 'lineWithPoints';
  const showBars = viz === 'bars' || viz === 'stackedBars';

  return (
    <div className="relative h-full w-full">
      {/* Viz type switcher (only interactive; sits in the corner) */}
      <div data-no-drag className="absolute right-0 top-0 z-10" onPointerDown={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="bg-bg1/70 text-fg3 hover:text-fg1 rounded border border-separator2 px-1 text-[9px] leading-tight backdrop-blur"
            >
              {VIZ_LABELS[viz]}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {VIZ_ORDER.map((v) => (
              <DropdownMenuItem
                key={v}
                onSelect={() => {
                  actions.setViz(card.id, v);
                  if (v === 'multiLine' && series.length < 2) actions.addSeries(card.id);
                  if (v === 'stackedBars' && series.length < 2) actions.addSeries(card.id);
                }}
              >
                {VIZ_LABELS[v]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div ref={ref} className="h-full w-full">
        {w > 0 && h > 0 && (
          <svg width={w} height={h} className="overflow-visible">
            {/* baseline */}
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
                const slotW = plotW / card.colSpan;
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

            {/* Hover/click hit targets per column */}
            {points.map((p) => (
              <g key={`hit-${p.col}`}>
                <rect
                  data-no-drag
                  x={xFor(p.col) - plotW / card.colSpan / 2}
                  y={PAD}
                  width={plotW / card.colSpan}
                  height={plotH}
                  fill="transparent"
                  className="cursor-pointer"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveCol((c) => (c === p.col ? null : p.col));
                  }}
                />
                {series.map((s) => (
                  <circle
                    key={`marker-${s.id}-${p.col}`}
                    cx={xFor(p.col)}
                    cy={yFor(p.values[s.id] ?? 0)}
                    r={activeCol === p.col ? 3 : 0}
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

      {/* Inline point editor */}
      {activeCol != null && (
        <PointEditor
          card={card}
          col={activeCol}
          x={xFor(activeCol)}
          actions={actions}
          onClose={() => setActiveCol(null)}
        />
      )}
    </div>
  );
}

function PointEditor({
  card,
  col,
  x,
  actions,
  onClose,
}: {
  card: MapCard;
  col: number;
  x: number;
  actions: MapActions;
  onClose: () => void;
}) {
  const point = (card.points ?? []).find((p) => p.col === col);
  const series = card.series ?? [];
  if (!point) return null;
  return (
    <div
      data-no-drag
      onPointerDown={(e) => e.stopPropagation()}
      className="border-separator2 bg-bg2 absolute z-20 flex w-max flex-col gap-1 rounded-md border p-1.5 shadow-lg"
      style={{ left: x, top: -4, transform: 'translate(-50%, -100%)' }}
    >
      <div className="text-fg3 px-0.5 text-[9px] font-mono uppercase tracking-wide">t{col}</div>
      {series.map((s) => (
        <label key={s.id} className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full" style={{ background: COLOR_HEX[s.color] }} />
          <input
            type="number"
            value={point.values[s.id] ?? 0}
            onChange={(e) => actions.setPointValue(card.id, col, s.id, Number(e.target.value) || 0)}
            className="border-separator1 bg-bg1 text-fg0 h-5 w-14 rounded border px-1 text-[10px] outline-none"
          />
        </label>
      ))}
      <button
        type="button"
        onClick={onClose}
        className="text-fg3 hover:text-fg1 mt-0.5 text-[9px]"
      >
        done
      </button>
    </div>
  );
}
