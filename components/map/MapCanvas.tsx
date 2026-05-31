'use client';

import * as React from 'react';
import { AnimatePresence } from 'motion/react';
import type { JourneyMap } from '@/lib/repo/schemas';
import { cn } from '@/lib/bytes/utils';
import { PlusSmallIcon, TrashCanIcon } from '@/icons/react';
import {
  COL_W,
  LANE_H,
  LANE_LABEL_W,
  type Transform,
  clampScale,
} from './constants';
import { MapCardView } from './MapCardView';
import type { MapActions } from './use-map-store';

type DrawKind = 'card' | 'data';

interface DragState {
  kind: 'move' | 'resize-left' | 'resize-right' | 'create';
  cardId?: string;
  startClientX: number;
  startClientY: number;
  scale: number;
  origStartCol: number;
  origColSpan: number;
  origLaneIdx: number;
  moved: boolean;
}

interface Preview {
  cardId?: string;
  laneIndex: number;
  startCol: number;
  colSpan: number;
}

interface MapCanvasProps {
  map: JourneyMap;
  actions: MapActions;
  transform: Transform;
  setTransform: React.Dispatch<React.SetStateAction<Transform>>;
  visibleLevel: number;
  drawKind: DrawKind;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
}

export function MapCanvas({
  map,
  actions,
  transform,
  setTransform,
  visibleLevel,
  drawKind,
  selectedId,
  setSelectedId,
}: MapCanvasProps) {
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const dragRef = React.useRef<DragState | null>(null);
  const [preview, setPreview] = React.useState<Preview | null>(null);
  const [hoverCol, setHoverCol] = React.useState<number | null>(null);

  const laneCount = map.swimlanes.length;
  const worldW = map.columnCount * COL_W;
  const worldH = laneCount * LANE_H;

  // Native non-passive wheel listener: trackpad pinch (ctrl/meta) zooms toward
  // the cursor; plain two-finger scroll pans.
  React.useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      if (e.ctrlKey || e.metaKey) {
        setTransform((t) => {
          const ns = clampScale(t.scale * Math.exp(-e.deltaY * 0.01));
          const k = ns / t.scale;
          return { scale: ns, tx: sx - (sx - t.tx) * k, ty: sy - (sy - t.ty) * k };
        });
      } else {
        setTransform((t) => ({ ...t, tx: t.tx - e.deltaX, ty: t.ty - e.deltaY }));
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [setTransform]);

  function clientToCell(clientX: number, clientY: number) {
    const rect = viewportRef.current!.getBoundingClientRect();
    const wx = (clientX - rect.left - transform.tx) / transform.scale;
    const wy = (clientY - rect.top - transform.ty) / transform.scale;
    return {
      col: Math.floor(wx / COL_W),
      laneIdx: Math.floor(wy / LANE_H),
    };
  }

  // --- Drag lifecycle --------------------------------------------------------
  const endDrag = React.useCallback(() => {
    const d = dragRef.current;
    const p = previewRef.current;
    dragRef.current = null;
    setPreview(null);
    if (!d) return;

    if (d.kind === 'create') {
      if (!p) return;
      const id = actions.addCard({
        laneId: map.swimlanes[p.laneIndex]?.id ?? map.swimlanes[0]!.id,
        startCol: p.startCol,
        colSpan: p.colSpan,
        kind: drawKind,
      });
      setSelectedId(id);
      return;
    }
    if (!d.moved || !p || !d.cardId) return;
    if (d.kind === 'move') {
      actions.moveCard(d.cardId, map.swimlanes[p.laneIndex]!.id, p.startCol);
    } else if (d.kind === 'resize-right') {
      actions.resizeCard(d.cardId, p.colSpan);
    } else if (d.kind === 'resize-left') {
      actions.resizeCardLeft(d.cardId, p.startCol);
    }
  }, [actions, map.swimlanes, drawKind, setSelectedId]);

  // Keep a ref to preview so endDrag (bound once) reads the latest value.
  const previewRef = React.useRef<Preview | null>(null);
  previewRef.current = preview;

  React.useEffect(() => {
    function onMove(e: PointerEvent) {
      const d = dragRef.current;
      if (!d) return;
      const dCol = Math.round((e.clientX - d.startClientX) / (COL_W * d.scale));
      const dLane = Math.round((e.clientY - d.startClientY) / (LANE_H * d.scale));
      if (Math.abs(e.clientX - d.startClientX) > 3 || Math.abs(e.clientY - d.startClientY) > 3) {
        d.moved = true;
      }
      if (d.kind === 'create') {
        const cur = clientToCell(e.clientX, e.clientY);
        const curCol = Math.max(0, cur.col);
        const startCol = Math.min(d.origStartCol, curCol);
        const colSpan = Math.abs(curCol - d.origStartCol) + 1;
        setPreview({ laneIndex: d.origLaneIdx, startCol, colSpan });
        return;
      }
      if (d.kind === 'move') {
        const laneIndex = Math.min(Math.max(0, d.origLaneIdx + dLane), laneCount - 1);
        const startCol = Math.max(0, d.origStartCol + dCol);
        setPreview({ cardId: d.cardId, laneIndex, startCol, colSpan: d.origColSpan });
      } else if (d.kind === 'resize-right') {
        const colSpan = Math.max(1, d.origColSpan + dCol);
        setPreview({ cardId: d.cardId, laneIndex: d.origLaneIdx, startCol: d.origStartCol, colSpan });
      } else if (d.kind === 'resize-left') {
        const startCol = Math.min(Math.max(0, d.origStartCol + dCol), d.origStartCol + d.origColSpan - 1);
        const colSpan = d.origColSpan + (d.origStartCol - startCol);
        setPreview({ cardId: d.cardId, laneIndex: d.origLaneIdx, startCol, colSpan });
      }
    }
    function onUp() {
      if (dragRef.current) endDrag();
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endDrag, laneCount, transform.scale, transform.tx, transform.ty]);

  function startCardDrag(e: React.PointerEvent, cardId: string, kind: DragState['kind']) {
    const card = map.cards.find((c) => c.id === cardId);
    if (!card) return;
    const laneIdx = map.swimlanes.findIndex((l) => l.id === card.laneId);
    dragRef.current = {
      kind,
      cardId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      scale: transform.scale,
      origStartCol: card.startCol,
      origColSpan: card.colSpan,
      origLaneIdx: laneIdx,
      moved: false,
    };
  }

  function onLanePointerDown(e: React.PointerEvent, laneIdx: number) {
    if ((e.target as HTMLElement).closest('[data-card-id]')) return;
    const { col } = clientToCell(e.clientX, e.clientY);
    const startCol = Math.max(0, col);
    dragRef.current = {
      kind: 'create',
      startClientX: e.clientX,
      startClientY: e.clientY,
      scale: transform.scale,
      origStartCol: startCol,
      origColSpan: 1,
      origLaneIdx: laneIdx,
      moved: false,
    };
    setPreview({ laneIndex: laneIdx, startCol, colSpan: 1 });
    setSelectedId(null);
  }

  function onViewportPointerMove(e: React.PointerEvent) {
    if (dragRef.current) return;
    const { col } = clientToCell(e.clientX, e.clientY);
    setHoverCol(col >= 0 && col < map.columnCount ? col : null);
  }

  return (
    <div
      ref={viewportRef}
      className="bg-bg0 relative h-full w-full overflow-hidden"
      style={{ touchAction: 'none' }}
      onPointerMove={onViewportPointerMove}
      onPointerLeave={() => setHoverCol(null)}
      onPointerDown={(e) => {
        if (!(e.target as HTMLElement).closest('[data-card-id]')) setSelectedId(null);
      }}
    >
      {/* Transformed world */}
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          width: worldW,
          height: worldH,
          transform: `translate(${transform.tx}px, ${transform.ty}px) scale(${transform.scale})`,
        }}
      >
        <GridLines
          worldW={worldW}
          worldH={worldH}
          columnCount={map.columnCount}
          laneCount={laneCount}
          visibleLevel={visibleLevel}
        />

        {/* Playhead column highlight */}
        {hoverCol != null && (
          <div
            className="bg-fgAccent1/5 pointer-events-none absolute top-0"
            style={{ left: hoverCol * COL_W, width: COL_W, height: worldH }}
          />
        )}
        {hoverCol != null && (
          <div
            className="bg-fgAccent1/60 pointer-events-none absolute top-0"
            style={{ left: hoverCol * COL_W + COL_W / 2 - 0.5, width: 1, height: worldH }}
          />
        )}

        {/* Lane backgrounds (click/drag to add cards) */}
        {map.swimlanes.map((lane, laneIdx) => (
          <div
            key={lane.id}
            className={cn(
              'absolute left-0',
              laneIdx > visibleLevel && 'opacity-40',
            )}
            style={{ top: laneIdx * LANE_H, width: worldW, height: LANE_H }}
            onPointerDown={(e) => onLanePointerDown(e, laneIdx)}
          />
        ))}

        {/* Create preview ghost */}
        {preview && !preview.cardId && (
          <div
            className="border-fgAccent1 bg-fgAccent1/10 pointer-events-none absolute rounded-lg border-2 border-dashed"
            style={{
              left: preview.startCol * COL_W + 4,
              top: preview.laneIndex * LANE_H + 4,
              width: preview.colSpan * COL_W - 8,
              height: LANE_H - 8,
            }}
          />
        )}

        {/* Cards (level-of-detail filtered) */}
        <AnimatePresence>
          {map.cards
            .filter((c) => c.level <= visibleLevel)
            .map((card) => {
              const laneIdx = map.swimlanes.findIndex((l) => l.id === card.laneId);
              const cardPreview =
                preview && preview.cardId === card.id
                  ? { laneIndex: preview.laneIndex, startCol: preview.startCol, colSpan: preview.colSpan }
                  : null;
              return (
                <MapCardView
                  key={card.id}
                  card={card}
                  laneIndex={laneIdx}
                  columnCount={map.columnCount}
                  selected={selectedId === card.id}
                  dimmed={false}
                  actions={actions}
                  onSelect={() => setSelectedId(card.id)}
                  onBodyPointerDown={(e) => startCardDrag(e, card.id, 'move')}
                  onResizeStart={(e, side) =>
                    startCardDrag(e, card.id, side === 'left' ? 'resize-left' : 'resize-right')
                  }
                  preview={cardPreview}
                />
              );
            })}
        </AnimatePresence>
      </div>

      {/* Left lane rail (fixed horizontally, tracks vertical transform) */}
      <LaneRail
        map={map}
        transform={transform}
        visibleLevel={visibleLevel}
        actions={actions}
      />
    </div>
  );
}

function GridLines({
  worldW,
  worldH,
  columnCount,
  laneCount,
  visibleLevel,
}: {
  worldW: number;
  worldH: number;
  columnCount: number;
  laneCount: number;
  visibleLevel: number;
}) {
  const cols = Array.from({ length: columnCount + 1 }, (_, i) => i);
  const lanes = Array.from({ length: laneCount + 1 }, (_, i) => i);
  return (
    <svg
      width={worldW}
      height={worldH}
      className="pointer-events-none absolute left-0 top-0"
      aria-hidden
    >
      {cols.map((i) => (
        <line
          key={`c${i}`}
          x1={i * COL_W}
          y1={0}
          x2={i * COL_W}
          y2={worldH}
          className={i % 4 === 0 ? 'stroke-separator2' : 'stroke-separator1'}
          strokeWidth={i % 4 === 0 ? 1 : 0.5}
        />
      ))}
      {/* Finer subdivisions appear as you zoom in */}
      {visibleLevel >= 1 &&
        cols.slice(0, -1).map((i) => (
          <line
            key={`h${i}`}
            x1={i * COL_W + COL_W / 2}
            y1={0}
            x2={i * COL_W + COL_W / 2}
            y2={worldH}
            className="stroke-separator1"
            strokeWidth={0.25}
            strokeDasharray="2 4"
          />
        ))}
      {lanes.map((i) => (
        <line
          key={`l${i}`}
          x1={0}
          y1={i * LANE_H}
          x2={worldW}
          y2={i * LANE_H}
          className="stroke-separator1"
          strokeWidth={0.5}
        />
      ))}
    </svg>
  );
}

function LaneRail({
  map,
  transform,
  visibleLevel,
  actions,
}: {
  map: JourneyMap;
  transform: Transform;
  visibleLevel: number;
  actions: MapActions;
}) {
  return (
    <div
      className="border-separator1 bg-bg1/95 absolute left-0 top-0 bottom-0 z-10 border-r backdrop-blur"
      style={{ width: LANE_LABEL_W }}
    >
      {map.swimlanes.map((lane, idx) => {
        const top = transform.ty + idx * LANE_H * transform.scale;
        const height = LANE_H * transform.scale;
        return (
          <LaneLabel
            key={lane.id}
            laneId={lane.id}
            name={lane.name}
            index={idx}
            dimmed={idx > visibleLevel}
            top={top}
            height={height}
            canRemove={map.swimlanes.length > 1}
            actions={actions}
          />
        );
      })}
      <button
        type="button"
        onClick={() => actions.addLane('')}
        className="text-fg3 hover:text-fg1 hover:bg-bg2 absolute bottom-2 left-2 right-2 inline-flex items-center justify-center gap-1 rounded border border-dashed border-separator2 py-1.5 text-xs"
      >
        <PlusSmallIcon className="h-3 w-3" /> Add lane
      </button>
    </div>
  );
}

function LaneLabel({
  laneId,
  name,
  index,
  dimmed,
  top,
  height,
  canRemove,
  actions,
}: {
  laneId: string;
  name: string;
  index: number;
  dimmed: boolean;
  top: number;
  height: number;
  canRemove: boolean;
  actions: MapActions;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(name);
  React.useEffect(() => {
    if (!editing) setDraft(name);
  }, [name, editing]);

  return (
    <div
      className={cn(
        'group absolute left-0 flex flex-col justify-center gap-0.5 px-3',
        dimmed && 'opacity-40',
      )}
      style={{ top, height, width: LANE_LABEL_W }}
    >
      <span className="text-fg4 font-mono text-[9px] uppercase tracking-wider">Lane {index + 1}</span>
      <div className="flex items-center gap-1">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              setEditing(false);
              if (draft !== name) actions.renameLane(laneId, draft);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              if (e.key === 'Escape') {
                setDraft(name);
                setEditing(false);
              }
            }}
            className="border-separatorAccent bg-bg2 text-fg0 w-full rounded border px-1 py-0.5 text-xs outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-fg1 hover:text-fg0 truncate text-left text-xs font-semibold"
          >
            {name || <span className="text-fg4">Unnamed lane</span>}
          </button>
        )}
        {canRemove && (
          <button
            type="button"
            aria-label="Remove lane"
            onClick={() => {
              if (window.confirm('Remove this lane and its cards?')) actions.removeLane(laneId);
            }}
            className="text-fg4 hover:text-fgSerious1 ml-auto opacity-0 transition-opacity group-hover:opacity-100"
          >
            <TrashCanIcon className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
