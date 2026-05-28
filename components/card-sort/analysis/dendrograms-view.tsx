'use client';

import * as React from 'react';
import type { AnalysisModel } from '@/lib/card-sort/analysis';
import { leafOrder, type DendroNode } from '@/lib/card-sort/cluster';
import { ViewHeader } from './view-header';

export function DendrogramsView({ model }: { model: AnalysisModel }) {
  const labelById = React.useMemo(
    () => new Map(model.cards.map((c) => [c.id, c.label])),
    [model.cards],
  );

  return (
    <div className="flex flex-col gap-6">
      <ViewHeader
        title="Dendrograms"
        description="Hierarchical clustering of cards by how often participants grouped them together. The earlier (further left) cards join, the stronger the agreement."
        help="Hover the chart to cut the tree at any agreement level — the clusters that hold together at that threshold light up. Click anywhere on the chart to pin a threshold; click again to unlock. Actual agreement is skeptical; best merge makes softer assumptions and works better with few participants."
      />

      <Method
        title="Actual agreement method"
        blurb="Only depicts absolutely factual relationships (complete linkage). Best with 30+ participants."
        node={model.dendrograms.actual}
        labelById={labelById}
      />
      <Method
        title="Best merge method"
        blurb="Assumes larger clusters from individual pair relationships (average linkage). Often better with fewer participants."
        node={model.dendrograms.bestMerge}
        labelById={labelById}
      />
    </div>
  );
}

function Method({
  title,
  blurb,
  node,
  labelById,
}: {
  title: string;
  blurb: string;
  node: DendroNode | null;
  labelById: Map<string, string>;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div>
        <h3 className="text-fg1 text-sm font-semibold">{title}</h3>
        <p className="text-fg4 max-w-2xl text-xs">{blurb}</p>
      </div>
      <div className="border-separator1 bg-bg1 overflow-x-auto rounded-lg border p-4">
        {node ? <Dendrogram node={node} labelById={labelById} /> : <Empty />}
      </div>
    </section>
  );
}

function Empty() {
  return (
    <div className="text-fg4 px-4 py-8 text-center text-sm">Not enough data to cluster yet.</div>
  );
}

// ── Layout constants ──────────────────────────────────────────────────────────
const ROW_H = 30;
const LABEL_W = 180;
const PLOT_W = 540;
const TOP_PAD = 22; // room for the hover "%" badge
const AXIS_H = 22; // room for the bottom % axis
const STUB = 16; // small inset so 100%-agreement merges aren't flush with labels
const PAD_R = 16;

// Distinct, dark/light-friendly cluster colors (cycled top→bottom).
const PALETTE = [
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#22c55e', // green
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ef4444', // red
  '#14b8a6', // teal
  '#a855f7', // purple
];

const mapX = (agreement: number) => STUB + ((100 - agreement) / 100) * (PLOT_W - STUB);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

interface Seg {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
interface Internal {
  x: number;
  height: number;
  leaves: string[];
  children: { ax: number; ay: number; leaves: string[] }[];
}
interface Hover {
  pct: number;
  cutX: number;
  y: number;
}

function Dendrogram({ node, labelById }: { node: DendroNode; labelById: Map<string, string> }) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [hover, setHover] = React.useState<Hover | null>(null);
  const [locked, setLocked] = React.useState<Hover | null>(null);

  // Static layout: leaf rows, internal-node positions, and the gray base tree.
  const layout = React.useMemo(() => {
    const order = leafOrder(node);
    const leafY = new Map(order.map((id, i) => [id, TOP_PAD + i * ROW_H + ROW_H / 2]));
    const internals: Internal[] = [];
    const baseSegs: Seg[] = [];

    function walk(n: DendroNode): { y: number; anchorX: number; leaves: string[] } {
      if (n.kind === 'leaf') return { y: leafY.get(n.cardId)!, anchorX: 0, leaves: [n.cardId] };
      const L = walk(n.left);
      const R = walk(n.right);
      const x = mapX(n.height);
      internals.push({
        x,
        height: n.height,
        leaves: n.leaves,
        children: [
          { ax: L.anchorX, ay: L.y, leaves: L.leaves },
          { ax: R.anchorX, ay: R.y, leaves: R.leaves },
        ],
      });
      // base (gray) segments: vertical bracket + the two horizontal connectors
      baseSegs.push({ x1: x, y1: L.y, x2: x, y2: R.y });
      baseSegs.push({ x1: L.anchorX, y1: L.y, x2: x, y2: L.y });
      baseSegs.push({ x1: R.anchorX, y1: R.y, x2: x, y2: R.y });
      return { y: (L.y + R.y) / 2, anchorX: x, leaves: n.leaves };
    }
    walk(node);

    return { order, leafY, internals, baseSegs, height: order.length * ROW_H };
  }, [node]);

  const totalW = LABEL_W + PLOT_W + PAD_R;
  const svgH = TOP_PAD + layout.height + AXIS_H;

  // The displayed cut: a locked threshold takes precedence over the live cursor.
  const active = locked ?? hover;

  // Clusters, colored segments, and per-leaf colors for the active cut.
  const hoverData = React.useMemo(() => {
    if (!active) return null;
    const { pct: t, cutX } = active;

    // Cut the tree at threshold t: subtrees whose merges are all ≥ t are clusters.
    const clusters: DendroNode[] = [];
    (function collect(n: DendroNode) {
      if (n.kind === 'leaf' || n.height >= t) {
        clusters.push(n);
        return;
      }
      collect(n.left);
      collect(n.right);
    })(node);

    const leafColor = new Map<string, string>();
    clusters.forEach((c, i) => {
      const col = PALETTE[i % PALETTE.length]!;
      for (const id of c.leaves) leafColor.set(id, col);
    });

    // Color the part of the tree to the LEFT of the cut, grouped by cluster.
    const segs: (Seg & { color: string })[] = [];
    for (const m of layout.internals) {
      if (m.x <= cutX) {
        // intra-cluster merge — colour the whole bracket + connectors
        const col = leafColor.get(m.leaves[0]!)!;
        segs.push({ x1: m.x, y1: m.children[0]!.ay, x2: m.x, y2: m.children[1]!.ay, color: col });
        for (const c of m.children) {
          segs.push({ x1: c.ax, y1: c.ay, x2: m.x, y2: c.ay, color: col });
        }
      } else {
        // inter-cluster merge — only colour each child's stub up to the cut
        for (const c of m.children) {
          if (c.ax < cutX) {
            segs.push({ x1: c.ax, y1: c.ay, x2: cutX, y2: c.ay, color: leafColor.get(c.leaves[0]!)! });
          }
        }
      }
    }

    return { leafColor, segs, clusterCount: clusters.length };
  }, [active, node, layout]);

  // Convert a mouse event into a cut at the cursor. Uses the SVG's CTM so the
  // mapping is exact no matter how the chart is scaled to fit its column — a
  // width-only scale factor drifts vertically the further down you move.
  function cutFromEvent(e: React.MouseEvent): Hover | null {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(ctm.inverse());
    const plotX = p.x - LABEL_W;
    if (plotX < 0) return null;
    const cutX = clamp(plotX, STUB, PLOT_W);
    const pct = Math.round(100 - ((cutX - STUB) / (PLOT_W - STUB)) * 100);
    const y = clamp(p.y, TOP_PAD + 8, TOP_PAD + layout.height - 8);
    return { pct, cutX, y };
  }

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    setHover(cutFromEvent(e));
  }

  // Click anywhere on the chart to lock the threshold under the cursor; click
  // again to unlock. No need to hit the padlock — it just marks the cut.
  function onClick(e: React.MouseEvent<SVGSVGElement>) {
    setLocked((cur) => (cur ? null : cutFromEvent(e)));
  }

  return (
    <svg
      ref={svgRef}
      width={totalW}
      height={svgH}
      viewBox={`0 0 ${totalW} ${svgH}`}
      className="text-fg4 min-w-full cursor-crosshair"
      role="img"
      aria-label="Dendrogram (hover to cut at an agreement level, click to lock)"
      onMouseMove={onMove}
      onMouseLeave={() => setHover(null)}
      onClick={onClick}
    >
      <g transform={`translate(${LABEL_W},0)`}>
        {/* gridlines + bottom axis */}
        {[100, 75, 50, 25, 0].map((pct) => {
          const x = mapX(pct);
          return (
            <g key={pct}>
              <line
                x1={x}
                y1={TOP_PAD}
                x2={x}
                y2={TOP_PAD + layout.height}
                stroke="var(--color-separator1)"
                strokeDasharray="2 3"
              />
              <text
                x={x}
                y={TOP_PAD + layout.height + 14}
                textAnchor="middle"
                className="fill-[var(--color-fg4)] font-mono text-[9px]"
              >
                {pct}%
              </text>
            </g>
          );
        })}

        {/* base tree (gray) */}
        {layout.baseSegs.map((s, i) => (
          <line
            key={i}
            x1={s.x1}
            y1={s.y1}
            x2={s.x2}
            y2={s.y2}
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        ))}

        {/* colored cluster overlay on hover */}
        {hoverData?.segs.map((s, i) => (
          <line
            key={i}
            x1={s.x1}
            y1={s.y1}
            x2={s.x2}
            y2={s.y2}
            stroke={s.color}
            strokeWidth={2}
            strokeLinecap="round"
          />
        ))}

        {/* cut line + % badge + lock handle (locked or following the cursor) */}
        {active && (
          <g>
            <line
              x1={active.cutX}
              y1={TOP_PAD - 4}
              x2={active.cutX}
              y2={TOP_PAD + layout.height}
              stroke={locked ? 'var(--color-fgAccent1)' : 'var(--color-fg2)'}
              strokeDasharray="3 3"
              strokeWidth={1}
            />
            <text
              x={active.cutX}
              y={TOP_PAD - 9}
              textAnchor="middle"
              className="text-[11px] font-semibold"
              fill={locked ? 'var(--color-fgAccent1)' : 'var(--color-fg1)'}
            >
              {active.pct}%
            </text>
            <LockHandle x={active.cutX} y={active.y} pct={active.pct} locked={!!locked} />
          </g>
        )}
      </g>

      {/* leaf labels (colored by cluster on hover) */}
      {layout.order.map((id) => (
        <text
          key={id}
          x={LABEL_W - 12}
          y={layout.leafY.get(id)! + 3}
          textAnchor="end"
          className="text-[11px]"
          fill={hoverData?.leafColor.get(id) ?? 'var(--color-fg1)'}
          fontWeight={hoverData?.leafColor.get(id) ? 600 : 400}
        >
          {labelById.get(id) ?? id}
        </text>
      ))}
    </svg>
  );
}

/** Padlock indicator on the cut line — lock/unlock is handled by chart click. */
function LockHandle({
  x,
  y,
  pct,
  locked,
}: {
  x: number;
  y: number;
  pct: number;
  locked: boolean;
}) {
  const stroke = locked ? 'var(--color-fgAccent1)' : 'var(--color-fg2)';
  const label = locked ? `Locked at ${pct}% — click chart to unlock` : `Following cursor at ${pct}% — click chart to lock`;
  return (
    <g transform={`translate(${x},${y})`} pointerEvents="none" aria-hidden="true">
      <title>{label}</title>
      {/* enlarged transparent hit target */}
      <circle r={15} fill="transparent" />
      <circle
        r={11}
        fill={locked ? 'var(--color-bgAccent1)' : 'var(--color-bg1)'}
        stroke={stroke}
        strokeWidth={1.2}
      />
      {/* shackle: closed when locked, ajar (open) when following the cursor */}
      <path
        d={
          locked
            ? 'M -2.6 -1 v-1.4 a2.6 2.6 0 0 1 5.2 0 v1.4'
            : 'M -2.6 -1 v-1.4 a2.6 2.6 0 0 1 5.2 0'
        }
        fill="none"
        stroke={stroke}
        strokeWidth={1.2}
      />
      <rect x={-3.4} y={-1} width={6.8} height={5.4} rx={1.2} fill={stroke} />
    </g>
  );
}
