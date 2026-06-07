'use client';

import * as React from 'react';
import { AnimatePresence } from 'motion/react';
import type { JourneyMap, MapCard } from '@/lib/repo/schemas';
import { PlusSmallIcon, TrashCanIcon, ChevronGrabberVerticalIcon } from '@/icons/react';
import { cn } from '@/lib/bytes/utils';
import {
  COL_W,
  WORLD_PAD,
  LANE_LABEL_MIN,
  LANE_LABEL_MAX,
  type Transform,
  clampScale,
  clampTransform,
  fitScale,
  levelRevealScale,
  visibleLevelForScale,
} from './constants';
import { computeLayout, laneIndexForY } from './layout';
import { MapCardView } from './MapCardView';
import { CardToolbar } from './CardToolbar';
import { DataToolbar } from './DataToolbar';
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

export interface ViewportBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface MapCanvasProps {
  map: JourneyMap;
  actions: MapActions;
  transform: Transform;
  setTransform: React.Dispatch<React.SetStateAction<Transform>>;
  drawKind: DrawKind;
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  laneLabelW: number;
  setLaneLabelW: (w: number) => void;
}

export function MapCanvas({
  map,
  actions,
  transform,
  setTransform,
  drawKind,
  selectedIds,
  setSelectedIds,
  laneLabelW,
  setLaneLabelW,
}: MapCanvasProps) {
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const dragRef = React.useRef<DragState | null>(null);
  const transformRef = React.useRef<Transform>(transform);
  const pointerRef = React.useRef<{ x: number; y: number } | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const [preview, setPreview] = React.useState<Preview | null>(null);
  const [hoverX, setHoverX] = React.useState<number | null>(null);
  const [hoverCol, setHoverCol] = React.useState<number | null>(null);
  const [hoverCell, setHoverCell] = React.useState<{ laneIdx: number; col: number; occupied: boolean } | null>(null);
  const [hoverCardId, setHoverCardId] = React.useState<string | null>(null);
  const [hoverLaneId, setHoverLaneId] = React.useState<string | null>(null);
  const [viewport, setViewport] = React.useState({ w: 0, h: 0 });
  const [origin, setOrigin] = React.useState({ x: 0, y: 0 });
  const didInit = React.useRef(false);

  const layout = React.useMemo(() => computeLayout(map), [map]);
  const worldW = map.columnCount * COL_W;
  const worldH = layout.worldH;

  const scale = transform.scale;
  const colPx = COL_W * scale;
  const screenW = worldW * scale;
  const selSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);
  transformRef.current = transform;

  const maxLevel = map.swimlanes.length - 1;
  const visibleLevel = visibleLevelForScale(scale, maxLevel);
  const isVisible = React.useCallback(
    (card: MapCard) => card.level <= visibleLevel,
    [visibleLevel],
  );

  React.useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (r) setViewport({ w: r.width, h: r.height });
    });
    ro.observe(el);
    setViewport({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  React.useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setOrigin((o) => (o.x !== r.left || o.y !== r.top ? { x: r.left, y: r.top } : o));
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  });

  React.useEffect(() => {
    if (didInit.current || viewport.w === 0) return;
    didInit.current = true;
    const s = Math.min(1.1, fitScale(worldW, viewport.w, laneLabelW));
    setTransform(
      clampTransform(
        { scale: s, tx: laneLabelW + WORLD_PAD, ty: WORLD_PAD },
        worldW,
        worldH,
        viewport.w,
        viewport.h,
        laneLabelW,
      ),
    );
  }, [viewport.w, viewport.h, worldW, worldH, laneLabelW, setTransform]);

  React.useEffect(() => {
    if (viewport.w === 0) return;
    // While dragging we deliberately let the view scroll past the content edge
    // (so you can stretch a card beyond the current timeline); re-clamp on drop.
    if (dragRef.current) return;
    const c = clampTransform(transform, worldW, worldH, viewport.w, viewport.h, laneLabelW);
    if (c.scale !== transform.scale || c.tx !== transform.tx || c.ty !== transform.ty) {
      setTransform(c);
    }
  }, [transform, worldW, worldH, viewport.w, viewport.h, laneLabelW, setTransform]);

  React.useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      setTransform((t) => {
        let next: Transform;
        if (e.ctrlKey || e.metaKey) {
          const ns = clampScale(t.scale * Math.exp(-e.deltaY * 0.01));
          const k = ns / t.scale;
          next = { scale: ns, tx: sx - (sx - t.tx) * k, ty: t.ty };
        } else {
          next = { ...t, tx: t.tx - e.deltaX, ty: t.ty - e.deltaY };
        }
        return clampTransform(next, worldW, worldH, rect.width, rect.height, laneLabelW);
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [setTransform, worldW, worldH, laneLabelW]);

  function cellAt(clientX: number, clientY: number, t: Transform) {
    const rect = viewportRef.current!.getBoundingClientRect();
    const x = clientX - rect.left - t.tx;
    const y = clientY - rect.top - t.ty;
    return {
      col: Math.floor(x / (COL_W * t.scale)),
      laneIdx: laneIndexForY(y, layout.laneTops, layout.laneHeights),
    };
  }

  function clientToCell(clientX: number, clientY: number) {
    return cellAt(clientX, clientY, transform);
  }

  function revealCard(card: MapCard) {
    const idx = map.swimlanes.findIndex((l) => l.id === card.laneId);
    const targetScale = clampScale(Math.max(scale, levelRevealScale(card.level) + 0.05));
    const centerWorldX = (card.startCol + card.colSpan / 2) * COL_W;
    const laneCenterY = (layout.laneTops[idx] ?? 0) + (layout.laneHeights[idx] ?? 0) / 2;
    setTransform(
      clampTransform(
        {
          scale: targetScale,
          tx: viewport.w / 2 - centerWorldX * targetScale,
          ty: viewport.h / 2 - laneCenterY,
        },
        worldW,
        worldH,
        viewport.w,
        viewport.h,
        laneLabelW,
      ),
    );
  }

  function selectCard(cardId: string, additive: boolean) {
    setSelectedIds((prev) => {
      if (additive) {
        return prev.includes(cardId) ? prev.filter((i) => i !== cardId) : [...prev, cardId];
      }
      return [cardId];
    });
  }

  function insertAdjacent(card: MapCard, side: 'before' | 'after') {
    const col = side === 'before' ? card.startCol : card.startCol + card.colSpan;
    const id = actions.insertCardAt(card.laneId, col, 'card');
    setSelectedIds([id]);
  }

  const previewRef = React.useRef<Preview | null>(null);
  previewRef.current = preview;

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
      setSelectedIds([id]);
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
  }, [actions, map.swimlanes, drawKind, setSelectedIds]);

  // Update the live preview from a pointer position using the latest transform
  // (so it stays correct while the view auto-pans). Resize/create use absolute
  // cursor columns; move keeps its grab-relative delta.
  function applyDragAt(clientX: number, clientY: number) {
    const d = dragRef.current;
    if (!d) return;
    const t = transformRef.current;
    if (d.kind === 'create') {
      const curCol = Math.max(0, cellAt(clientX, clientY, t).col);
      const startCol = Math.min(d.origStartCol, curCol);
      const colSpan = Math.abs(curCol - d.origStartCol) + 1;
      setPreview({ laneIndex: d.origLaneIdx, startCol, colSpan });
    } else if (d.kind === 'move') {
      const dCol = Math.round((clientX - d.startClientX) / (COL_W * d.scale));
      const laneIndex = cellAt(clientX, clientY, t).laneIdx;
      const startCol = Math.max(0, d.origStartCol + dCol);
      setPreview({ cardId: d.cardId, laneIndex, startCol, colSpan: d.origColSpan });
    } else if (d.kind === 'resize-right') {
      const colSpan = Math.max(1, cellAt(clientX, clientY, t).col + 1 - d.origStartCol);
      setPreview({ cardId: d.cardId, laneIndex: d.origLaneIdx, startCol: d.origStartCol, colSpan });
    } else if (d.kind === 'resize-left') {
      const right = d.origStartCol + d.origColSpan;
      // Allow negative columns so the left edge can be dragged past the origin
      // (the timeline grows leftward on drop).
      const startCol = Math.min(cellAt(clientX, clientY, t).col, right - 1);
      setPreview({ cardId: d.cardId, laneIndex: d.origLaneIdx, startCol, colSpan: right - startCol });
    }
  }

  // While creating/resizing, pan the view when the cursor nears an edge so you
  // can extend a card past the current timeline (the map grows on drop).
  function autoPanStep() {
    const d = dragRef.current;
    if (!d) {
      rafRef.current = null;
      return;
    }
    const p = pointerRef.current;
    const panKind = d.kind === 'create' || d.kind === 'resize-right' || d.kind === 'resize-left';
    // Only auto-pan once an actual drag is underway, and only toward the edge the
    // cursor is actively pushing past its grab point — so click-holding the
    // right-most card doesn't start widening, and dragging inward never does.
    if (p && panKind && d.moved) {
      const rect = viewportRef.current?.getBoundingClientRect();
      if (rect) {
        const EDGE = 56;
        const SPEED = 16;
        const maxTx = laneLabelW + WORLD_PAD;
        let dtx = 0;
        if (p.x > rect.right - EDGE && p.x > d.startClientX) dtx = -SPEED;
        else if (p.x < rect.left + laneLabelW + EDGE && p.x < d.startClientX) dtx = SPEED;
        if (dtx !== 0) {
          // A left-edge resize may scroll past the origin to reveal room for the
          // card to grow leftward; everything else stays pinned at the origin.
          const allowPastOrigin = d.kind === 'resize-left' && dtx > 0;
          let ntx = transformRef.current.tx + dtx;
          if (!allowPastOrigin) ntx = Math.min(maxTx, ntx);
          const nt = { ...transformRef.current, tx: ntx };
          transformRef.current = nt;
          setTransform(nt);
        }
      }
      applyDragAt(p.x, p.y);
    }
    rafRef.current = requestAnimationFrame(autoPanStep);
  }

  function startAutoPan(clientX: number, clientY: number) {
    pointerRef.current = { x: clientX, y: clientY };
    if (rafRef.current == null) rafRef.current = requestAnimationFrame(autoPanStep);
  }

  function stopAutoPan() {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    pointerRef.current = null;
  }

  React.useEffect(() => {
    function onMove(e: PointerEvent) {
      const d = dragRef.current;
      if (!d) return;
      if (Math.abs(e.clientX - d.startClientX) > 3 || Math.abs(e.clientY - d.startClientY) > 3) {
        d.moved = true;
      }
      pointerRef.current = { x: e.clientX, y: e.clientY };
      applyDragAt(e.clientX, e.clientY);
    }
    function onUp() {
      if (dragRef.current) endDrag();
      stopAutoPan();
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endDrag, layout, laneLabelW]);

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
    startAutoPan(e.clientX, e.clientY);
  }

  function onLanePointerDown(e: React.PointerEvent, laneIdx: number) {
    if ((e.target as HTMLElement).closest('[data-card-id]')) return;
    const { col } = clientToCell(e.clientX, e.clientY);
    const startCol = Math.max(0, col);
    const laneId = map.swimlanes[laneIdx]?.id;

    const occupant = map.cards.find(
      (c) => c.laneId === laneId && c.startCol <= startCol && startCol < c.startCol + c.colSpan,
    );
    if (occupant) {
      setSelectedIds([occupant.id]);
      if (!isVisible(occupant)) revealCard(occupant);
      return;
    }

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
    setSelectedIds([]);
    startAutoPan(e.clientX, e.clientY);
  }

  function onViewportPointerMove(e: React.PointerEvent) {
    if (dragRef.current) {
      setHoverX(null);
      return;
    }
    const rect = viewportRef.current!.getBoundingClientRect();
    setHoverX(e.clientX - rect.left);
    const overCard = !!(e.target as HTMLElement).closest('[data-card-id]');
    const { col, laneIdx } = clientToCell(e.clientX, e.clientY);
    const inGrid = col >= 0 && col < map.columnCount;
    setHoverCol(inGrid ? col : null);
    if (overCard || !inGrid) {
      setHoverCell(null);
      return;
    }
    const laneId = map.swimlanes[laneIdx]?.id;
    const occupied = map.cards.some(
      (c) => c.laneId === laneId && c.startCol <= col && col < c.startCol + c.colSpan,
    );
    setHoverCell({ laneIdx, col, occupied });
  }

  // Selection geometry for the floating toolbar.
  const selectedCards = map.cards.filter((c) => selSet.has(c.id));
  const visibleSelected = selectedCards.filter(isVisible);
  const toolbar = React.useMemo(() => {
    if (visibleSelected.length === 0) return null;
    let minCol = Infinity;
    let maxCol = -Infinity;
    let minTop = Infinity;
    let maxBottom = -Infinity;
    for (const c of visibleSelected) {
      const idx = map.swimlanes.findIndex((l) => l.id === c.laneId);
      minCol = Math.min(minCol, c.startCol);
      maxCol = Math.max(maxCol, c.startCol + c.colSpan);
      minTop = Math.min(minTop, layout.laneTops[idx] ?? 0);
      maxBottom = Math.max(maxBottom, (layout.laneTops[idx] ?? 0) + (layout.laneHeights[idx] ?? 0));
    }
    return {
      anchorX: origin.x + transform.tx + ((minCol + maxCol) / 2) * colPx,
      anchorTop: origin.y + transform.ty + minTop,
      anchorBottom: origin.y + transform.ty + maxBottom,
    };
  }, [visibleSelected, origin, transform.tx, transform.ty, colPx, layout, map.swimlanes]);

  const bounds: ViewportBounds = { left: origin.x, top: origin.y, width: viewport.w, height: viewport.h };
  const singleData =
    visibleSelected.length === 1 && visibleSelected[0]!.kind === 'data' ? visibleSelected[0]! : null;

  const highlightedIds = React.useMemo(() => {
    if (hoverCardId) return new Set([hoverCardId]);
    if (hoverLaneId) {
      return new Set(map.cards.filter((c) => c.laneId === hoverLaneId).map((c) => c.id));
    }
    if (hoverCol != null) {
      return new Set(
        map.cards
          .filter(
            (c) =>
              c.level <= visibleLevel &&
              c.startCol <= hoverCol &&
              hoverCol < c.startCol + c.colSpan,
          )
          .map((c) => c.id),
      );
    }
    return new Set<string>();
  }, [hoverCardId, hoverLaneId, hoverCol, map.cards, visibleLevel]);

  return (
    <div
      ref={viewportRef}
      className="bg-bg0 relative h-full w-full overflow-hidden"
      style={{ touchAction: 'none' }}
      onPointerMove={onViewportPointerMove}
      onPointerLeave={() => {
        setHoverX(null);
        setHoverCol(null);
        setHoverCell(null);
      }}
      onPointerDown={(e) => {
        if (!(e.target as HTMLElement).closest('[data-card-id]')) setSelectedIds([]);
      }}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          width: screenW,
          height: worldH,
          transform: `translate(${transform.tx}px, ${transform.ty}px)`,
        }}
      >
        {/* Lane backgrounds. Lanes deeper than the current zoom's detail level
            are dimmed to signal "zoom in to reveal" their cards. */}
        {map.swimlanes.map((lane, laneIdx) => (
          <div
            key={lane.id}
            className={cn(
              'absolute left-0 transition-colors',
              laneIdx > visibleLevel && 'bg-bg1/40',
            )}
            style={{ top: layout.laneTops[laneIdx], width: screenW, height: layout.laneHeights[laneIdx] }}
            onPointerDown={(e) => onLanePointerDown(e, laneIdx)}
          />
        ))}

        {/* Hover add-cell affordance: empty vs occupied look different */}
        {hoverCell && !preview && (
          <div
            className={
              hoverCell.occupied
                ? 'border-fgAccent1/40 bg-fgAccent1/15 pointer-events-none absolute flex items-center justify-center rounded-lg border'
                : 'border-fgAccent1/60 pointer-events-none absolute flex items-center justify-center rounded-lg border-2 border-dashed'
            }
            style={{
              left: hoverCell.col * colPx + 3,
              top: (layout.laneTops[hoverCell.laneIdx] ?? 0) + 3,
              width: colPx - 6,
              height: (layout.laneHeights[hoverCell.laneIdx] ?? 0) - 6,
            }}
          >
            {hoverCell.occupied ? (
              <span className="bg-fgAccent1/70 h-2 w-2 rounded-full" />
            ) : (
              <PlusSmallIcon className="text-fgAccent1/70 h-4 w-4" />
            )}
          </div>
        )}

        {/* Create preview ghost */}
        {preview && !preview.cardId && (
          <div
            className="border-fgAccent1 bg-fgAccent1/10 pointer-events-none absolute rounded-lg border-2 border-dashed"
            style={{
              left: preview.startCol * colPx + 4,
              top: (layout.laneTops[preview.laneIndex] ?? 0) + 4,
              width: preview.colSpan * colPx - 8,
              height: (layout.laneHeights[preview.laneIndex] ?? 0) - 8,
            }}
          />
        )}

        {/* Cards */}
        <AnimatePresence>
          {map.cards
            .filter(isVisible)
            .map((card) => {
              const laneIdx = map.swimlanes.findIndex((l) => l.id === card.laneId);
              const cardPreview =
                preview && preview.cardId === card.id
                  ? { laneIndex: preview.laneIndex, startCol: preview.startCol, colSpan: preview.colSpan }
                  : null;
              const renderLane = cardPreview?.laneIndex ?? laneIdx;
              return (
                <MapCardView
                  key={card.id}
                  card={card}
                  top={layout.laneTops[renderLane] ?? 0}
                  height={layout.laneHeights[renderLane] ?? 0}
                  colPx={colPx}
                  selected={selSet.has(card.id)}
                  highlighted={highlightedIds.has(card.id)}
                  actions={actions}
                  onSelect={(additive) => selectCard(card.id, additive)}
                  onHoverChange={(h) =>
                    setHoverCardId((cur) => (h ? card.id : cur === card.id ? null : cur))
                  }
                  onBodyPointerDown={(e) => startCardDrag(e, card.id, 'move')}
                  onResizeStart={(e, side) =>
                    startCardDrag(e, card.id, side === 'left' ? 'resize-left' : 'resize-right')
                  }
                  onInsertAdjacent={(side) => insertAdjacent(card, side)}
                  preview={cardPreview}
                />
              );
            })}
        </AnimatePresence>
      </div>

      {/* Playhead: full viewport height, follows the cursor smoothly, on top. */}
      {hoverX != null && (
        <div
          className="bg-fgAccent1/70 pointer-events-none absolute top-0 bottom-0 z-30"
          style={{ left: hoverX - 0.5, width: 1 }}
        />
      )}

      {/* Left lane rail */}
      <LaneRail
        map={map}
        transform={transform}
        laneTops={layout.laneTops}
        laneHeights={layout.laneHeights}
        laneLabelW={laneLabelW}
        setLaneLabelW={setLaneLabelW}
        actions={actions}
        onHoverLane={setHoverLaneId}
        visibleLevel={visibleLevel}
      />

      {/* Floating toolbar above the selection */}
      {toolbar &&
        (singleData ? (
          <DataToolbar
            card={singleData}
            anchorX={toolbar.anchorX}
            anchorTop={toolbar.anchorTop}
            anchorBottom={toolbar.anchorBottom}
            bounds={bounds}
            actions={actions}
          />
        ) : (
          <CardToolbar
            card={visibleSelected[visibleSelected.length - 1]!}
            cardIds={visibleSelected.map((c) => c.id)}
            anchorX={toolbar.anchorX}
            anchorTop={toolbar.anchorTop}
            anchorBottom={toolbar.anchorBottom}
            bounds={bounds}
            actions={actions}
          />
        ))}
    </div>
  );
}

function LaneRail({
  map,
  transform,
  laneTops,
  laneHeights,
  laneLabelW,
  setLaneLabelW,
  actions,
  onHoverLane,
  visibleLevel,
}: {
  map: JourneyMap;
  transform: Transform;
  laneTops: number[];
  laneHeights: number[];
  laneLabelW: number;
  setLaneLabelW: (w: number) => void;
  actions: MapActions;
  onHoverLane: (laneId: string | null) => void;
  visibleLevel: number;
}) {
  const railRef = React.useRef<HTMLDivElement | null>(null);
  const worldH = (laneTops[laneTops.length - 1] ?? 0) + (laneHeights[laneHeights.length - 1] ?? 0);
  const [drag, setDrag] = React.useState<{ from: number; over: number } | null>(null);

  function startResize(e: React.PointerEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = laneLabelW;
    function onMove(ev: PointerEvent) {
      const w = Math.max(LANE_LABEL_MIN, Math.min(LANE_LABEL_MAX, startW + (ev.clientX - startX)));
      setLaneLabelW(w);
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  function startLaneDrag(e: React.PointerEvent, fromIdx: number) {
    e.preventDefault();
    e.stopPropagation();
    onHoverLane(null);
    setDrag({ from: fromIdx, over: fromIdx });
    function onMove(ev: PointerEvent) {
      const rect = railRef.current!.getBoundingClientRect();
      const y = ev.clientY - rect.top - transform.ty;
      setDrag((cur) => (cur ? { ...cur, over: laneIndexForY(y, laneTops, laneHeights) } : cur));
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setDrag((cur) => {
        if (cur && cur.over !== cur.from) actions.moveLane(cur.from, cur.over);
        return null;
      });
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  const boundaries = [...laneTops, worldH];

  return (
    <div
      ref={railRef}
      className="border-separator1 bg-bg1/95 absolute left-0 top-0 bottom-0 z-10 border-r backdrop-blur"
      style={{ width: laneLabelW }}
    >
      {map.swimlanes.map((lane, idx) => {
        const top = transform.ty + (laneTops[idx] ?? 0);
        const height = laneHeights[idx] ?? 0;
        return (
          <LaneLabel
            key={lane.id}
            laneId={lane.id}
            name={lane.name}
            index={idx}
            top={top}
            height={height}
            width={laneLabelW}
            canRemove={map.swimlanes.length > 1}
            dragging={drag?.from === idx}
            dimmed={idx > visibleLevel}
            actions={actions}
            onHoverLane={onHoverLane}
            onDragStart={(e) => startLaneDrag(e, idx)}
          />
        );
      })}

      {/* Drop indicator while reordering */}
      {drag && (
        <div
          className="bg-fgAccent1 pointer-events-none absolute left-1 right-1 z-30 h-0.5 rounded"
          style={{ top: transform.ty + (boundaries[drag.over] ?? 0) - 1 }}
        />
      )}

      {/* Insert-lane hover zones at each boundary */}
      {!drag &&
        boundaries.map((y, idx) => (
          <InsertLaneZone
            key={`ins-${idx}`}
            top={transform.ty + y}
            width={laneLabelW}
            onInsert={() => actions.addLane('', idx)}
          />
        ))}

      <div
        onPointerDown={startResize}
        className="hover:bg-fgAccent1/40 absolute right-0 top-0 bottom-0 z-20 w-1.5 cursor-col-resize"
        style={{ touchAction: 'none' }}
        aria-label="Resize lane rail"
      />
    </div>
  );
}

function InsertLaneZone({
  top,
  width,
  onInsert,
}: {
  top: number;
  width: number;
  onInsert: () => void;
}) {
  return (
    <button
      type="button"
      aria-label="Insert lane here"
      onClick={onInsert}
      className="group absolute left-0 flex items-center justify-center"
      style={{ top: top - 7, height: 14, width }}
    >
      <span className="bg-fgAccent1 absolute left-2 right-2 h-0.5 rounded opacity-0 transition-opacity group-hover:opacity-100" />
      <span className="bg-fgAccent1 text-bg1 relative z-10 inline-flex h-4 w-4 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100">
        <PlusSmallIcon className="h-3 w-3" />
      </span>
    </button>
  );
}

function LaneLabel({
  laneId,
  name,
  index,
  top,
  height,
  width,
  canRemove,
  dragging,
  dimmed,
  actions,
  onHoverLane,
  onDragStart,
}: {
  laneId: string;
  name: string;
  index: number;
  top: number;
  height: number;
  width: number;
  canRemove: boolean;
  dragging: boolean;
  dimmed: boolean;
  actions: MapActions;
  onHoverLane: (laneId: string | null) => void;
  onDragStart: (e: React.PointerEvent) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(name);
  React.useEffect(() => {
    if (!editing) setDraft(name);
  }, [name, editing]);

  return (
    <div
      className={cnLabel(dragging, dimmed)}
      style={{ top, height, width }}
      onPointerEnter={() => onHoverLane(laneId)}
      onPointerLeave={() => onHoverLane(null)}
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Drag to reorder lane"
          onPointerDown={onDragStart}
          className="text-fg4 hover:text-fg2 -ml-1 shrink-0 cursor-grab opacity-0 transition-opacity group-hover:opacity-100"
          style={{ touchAction: 'none' }}
        >
          <ChevronGrabberVerticalIcon className="h-3.5 w-3.5" />
        </button>
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
      <span className="sr-only">Lane {index + 1}</span>
    </div>
  );
}

function cnLabel(dragging: boolean, dimmed: boolean): string {
  return [
    'group absolute left-0 flex flex-col justify-center gap-0.5 px-3 transition-opacity',
    dragging ? 'bg-fgAccent1/10 opacity-70' : dimmed ? 'opacity-40' : '',
  ]
    .filter(Boolean)
    .join(' ');
}
