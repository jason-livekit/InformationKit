import type {
  JourneyMap,
  MapCard,
  MapColor,
  MapViz,
  Swimlane,
} from '@/lib/repo/schemas';
import { makeId } from '@/lib/repo/ids';

/**
 * Pure grid engine for journey maps. Every function takes a map and returns a
 * new map (immutably), never mutating the input. Invariants are maintained by
 * `normalize`, which runs at the end of every mutation:
 *
 *  1. A card's `level` equals its swimlane's index (row 0 = coarsest). This is
 *     what the zoom level-of-detail reveal keys off of.
 *  2. A card's `parentId` is the tightest card in the lane directly above whose
 *     column span *overlaps* this card, or null.
 *  3. Containment: a parent always spans at least the union of its children, so
 *     stretching/moving a child beyond a parent's edge stretches the parent.
 *
 * Placement is free — cards may have gaps between them, and moving a card drops
 * it wherever you let go. Resizing a card's right edge ripples the same-lane
 * cards to its right (with their descendants) so widening makes room and
 * narrowing pulls things back in; other lanes are left alone. The only upward
 * effect is parent containment (3).
 *
 * The grid is a single base grid of integer time columns shared across every
 * lane, so lanes always stay time-aligned.
 */

/** Smallest interactive width of the canvas, even when content is narrower. */
export const MIN_COLUMNS = 6;

export function laneIndex(map: JourneyMap, laneId: string): number {
  return map.swimlanes.findIndex((l) => l.id === laneId);
}

export function cardEnd(card: MapCard): number {
  return card.startCol + card.colSpan;
}

export function contentRightEdge(cards: MapCard[]): number {
  return cards.reduce((max, c) => Math.max(max, cardEnd(c)), 0);
}

export function findCard(map: JourneyMap, cardId: string): MapCard | undefined {
  return map.cards.find((c) => c.id === cardId);
}

/** All cards transitively parented to `cardId` (children, grandchildren, ...). */
export function collectDescendants(map: JourneyMap, cardId: string): MapCard[] {
  const out: MapCard[] = [];
  const stack = [cardId];
  while (stack.length) {
    const parent = stack.pop()!;
    for (const c of map.cards) {
      if (c.parentId === parent && !out.includes(c)) {
        out.push(c);
        stack.push(c.id);
      }
    }
  }
  return out;
}

/** Two column ranges [aStart,aEnd) and [bStart,bEnd) overlap. */
function spansOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Assign each card's parent: the tightest overlapping card in the lane above. */
function deriveParents(cards: MapCard[], swimlanes: Swimlane[]): MapCard[] {
  return cards.map((c) => {
    const idx = swimlanes.findIndex((l) => l.id === c.laneId);
    if (idx <= 0) return { ...c, parentId: null };
    const aboveLaneId = swimlanes[idx - 1]!.id;
    const cEnd = c.startCol + c.colSpan;
    const candidates = cards.filter(
      (o) =>
        o.laneId === aboveLaneId &&
        spansOverlap(o.startCol, o.startCol + o.colSpan, c.startCol, cEnd),
    );
    candidates.sort((a, b) => a.colSpan - b.colSpan);
    return { ...c, parentId: candidates[0]?.id ?? null };
  });
}

/**
 * Grow each parent (bottom lane upward) so it spans the union of its children.
 * Monotonic — only ever widens — so iterating to a fixed point converges.
 */
function growParents(cards: MapCard[], swimlanes: Swimlane[]): MapCard[] {
  const idxOf = (laneId: string) => swimlanes.findIndex((l) => l.id === laneId);
  const out = cards.map((c) => ({ ...c }));
  const byId = new Map(out.map((c) => [c.id, c]));
  const order = [...out].sort((a, b) => idxOf(b.laneId) - idxOf(a.laneId));
  for (const c of order) {
    if (!c.parentId) continue;
    const p = byId.get(c.parentId);
    if (!p) continue;
    const ns = Math.min(p.startCol, c.startCol);
    const ne = Math.max(p.startCol + p.colSpan, c.startCol + c.colSpan);
    p.startCol = ns;
    p.colSpan = ne - ns;
  }
  return out;
}

/**
 * Recompute derived state (level, parentId, parent containment, columnCount).
 * Called at the end of every mutation so callers never maintain these by hand.
 */
export function normalize(map: JourneyMap): JourneyMap {
  let cards = map.cards.map((c) => {
    const idx = laneIndex(map, c.laneId);
    return reconcileDataPoints({ ...c, level: idx < 0 ? 0 : idx });
  });

  // Derive parents and grow them to contain their children, iterating to a
  // fixed point (growth can reveal new overlaps a lane further up).
  for (let iter = 0; iter <= map.swimlanes.length; iter++) {
    const parented = deriveParents(cards, map.swimlanes);
    const grown = growParents(parented, map.swimlanes);
    const changed = grown.some(
      (c, i) => c.startCol !== parented[i]!.startCol || c.colSpan !== parented[i]!.colSpan,
    );
    cards = grown;
    if (!changed) break;
  }

  // A data card grown by containment needs its points reconciled to its span.
  cards = cards.map(reconcileDataPoints);

  const columnCount = Math.max(contentRightEdge(cards), MIN_COLUMNS);
  return { ...map, cards, columnCount };
}

/** Default value used when a data card grows and needs a value for a new slot. */
const DEFAULT_POINT_VALUE = 50;

/**
 * Ensure a data card has exactly one point per column offset in its span
 * (0..colSpan-1). Existing values are preserved; new trailing slots created by
 * widening carry forward the previous slot's value so the chart extends
 * naturally. Points are stored as offsets within the card, so structural column
 * shifts never desync them.
 */
function reconcileDataPoints(card: MapCard): MapCard {
  if (card.kind !== 'data') return card;
  const series = card.series ?? [];
  const existing = new Map((card.points ?? []).map((p) => [p.col, p]));
  const carry: Record<string, number> = {};
  const points = Array.from({ length: card.colSpan }, (_, offset) => {
    const prev = existing.get(offset);
    if (prev) {
      for (const s of series) {
        const v = prev.values[s.id];
        if (typeof v === 'number') carry[s.id] = v;
      }
      return { col: offset, values: { ...prev.values } };
    }
    const values: Record<string, number> = {};
    for (const s of series) values[s.id] = carry[s.id] ?? DEFAULT_POINT_VALUE;
    return { col: offset, values };
  });
  return { ...card, points };
}

// --- Column-level structural edits ------------------------------------------

/**
 * Insert `count` empty columns at position `at`. Cards starting at/after `at`
 * shift right; cards spanning across `at` grow by `count` (so time stays
 * aligned across lanes). This is the "everything shifts" behavior.
 */
export function insertColumns(map: JourneyMap, at: number, count: number): JourneyMap {
  if (count <= 0) return map;
  const cards = map.cards.map((c) => {
    if (c.startCol >= at) return { ...c, startCol: c.startCol + count };
    if (c.startCol < at && cardEnd(c) > at) return { ...c, colSpan: c.colSpan + count };
    return c;
  });
  return normalize({ ...map, cards });
}

/**
 * Remove the column range [at, at + count). Cards entirely after it shift left;
 * cards overlapping it shrink (clamped to a minimum width of 1); cards entirely
 * within the removed range are clamped to width 1 at the cut.
 */
export function removeColumns(map: JourneyMap, at: number, count: number): JourneyMap {
  if (count <= 0) return map;
  const end = at + count;
  const cards = map.cards.map((c) => {
    const start = c.startCol;
    const finish = cardEnd(c);
    if (start >= end) return { ...c, startCol: start - count };
    if (finish <= at) return c;
    // Overlaps the removed range.
    const overlap = Math.min(finish, end) - Math.max(start, at);
    const newSpan = Math.max(1, c.colSpan - overlap);
    const newStart = start >= at ? at : start;
    return { ...c, startCol: newStart, colSpan: newSpan };
  });
  return normalize({ ...map, cards });
}

// --- Card edits --------------------------------------------------------------

export interface AddCardInput {
  laneId: string;
  startCol: number;
  colSpan?: number;
  kind?: MapCard['kind'];
  title?: string;
  color?: MapColor;
  viz?: MapViz;
}

export function addCard(map: JourneyMap, input: AddCardInput): { map: JourneyMap; cardId: string } {
  const id = makeId('mc_');
  const kind = input.kind ?? 'card';
  const colSpan = Math.max(1, Math.round(input.colSpan ?? 1));
  const startCol = Math.max(0, Math.round(input.startCol));

  const base: MapCard = {
    id,
    kind,
    laneId: input.laneId,
    startCol,
    colSpan,
    level: 0,
    parentId: null,
    title: input.title ?? '',
    color: input.color ?? 'neutral',
  };

  if (kind === 'data') {
    const seriesId = makeId('s_');
    base.viz = input.viz ?? 'line';
    base.color = input.color ?? 'blue';
    base.series = [{ id: seriesId, label: 'Series 1', color: base.color }];
    // Points are offsets within the card (0..colSpan-1), not absolute columns,
    // so they survive any column insert/remove/move.
    base.points = Array.from({ length: colSpan }, (_, i) => ({
      col: i,
      values: { [seriesId]: Math.round(30 + Math.random() * 60) },
    }));
  }

  return { map: normalize({ ...map, cards: [...map.cards, base] }), cardId: id };
}

export function updateCard(
  map: JourneyMap,
  cardId: string,
  patch: Partial<MapCard>,
): JourneyMap {
  const cards = map.cards.map((c) => (c.id === cardId ? { ...c, ...patch, id: c.id } : c));
  return normalize({ ...map, cards });
}

/**
 * Insert a new 1-wide card at column `col` in a lane. If that column already
 * holds a card (i.e. you're inserting between/adjacent cards), a fresh time
 * column is opened first so nothing overlaps — the journey-map analogue of
 * inserting a lane. Gaps just receive the card directly.
 */
export function insertCardAt(
  map: JourneyMap,
  laneId: string,
  col: number,
  kind: MapCard['kind'] = 'card',
): { map: JourneyMap; cardId: string } {
  const at = Math.max(0, Math.round(col));
  const occupied = map.cards.some(
    (c) => c.laneId === laneId && c.startCol <= at && at < cardEnd(c),
  );
  const m = occupied ? insertColumns(map, at, 1) : map;
  return addCard(m, { laneId, startCol: at, colSpan: 1, kind });
}

export function removeCard(map: JourneyMap, cardId: string): JourneyMap {
  const cards = map.cards.filter((c) => c.id !== cardId);
  return normalize({ ...map, cards });
}

/**
 * Move a card to a new lane / start column. The card's descendants follow by
 * the same column delta (keeping their own lanes), and the whole group is
 * clamped so nothing goes before column 0.
 */
export function moveCard(
  map: JourneyMap,
  cardId: string,
  targetLaneId: string,
  targetStartCol: number,
): JourneyMap {
  const card = findCard(map, cardId);
  if (!card) return map;
  const descendants = collectDescendants(map, cardId);
  const group = [card, ...descendants];
  const groupIds = new Set(group.map((c) => c.id));

  let delta = Math.round(targetStartCol) - card.startCol;
  const minStart = group.reduce((m, c) => Math.min(m, c.startCol), Infinity);
  if (minStart + delta < 0) delta = -minStart;

  const cards = map.cards.map((c) => {
    if (c.id === cardId) return { ...c, laneId: targetLaneId, startCol: c.startCol + delta };
    if (groupIds.has(c.id)) return { ...c, startCol: c.startCol + delta };
    return c;
  });
  return normalize({ ...map, cards });
}

/** The right edge of the closest same-lane card that ends to the left of `card`. */
function prevSiblingEnd(map: JourneyMap, card: MapCard): number {
  const ends = map.cards
    .filter((c) => c.id !== card.id && c.laneId === card.laneId && c.startCol < card.startCol)
    .map((c) => cardEnd(c));
  return ends.length ? Math.max(...ends) : 0;
}

/**
 * Resize a card's right edge to `newSpan` columns (>= 1). Same-lane cards to the
 * right of this card ripple by the same delta (with their descendants), so
 * widening pushes everything over to make room and narrowing pulls it back in.
 * Other lanes are untouched, so stretching into empty space below a wide card
 * doesn't disturb it unless the card grows past the parent's edge (in which case
 * `normalize` grows the parent to contain it).
 */
export function resizeCard(map: JourneyMap, cardId: string, newSpan: number): JourneyMap {
  const card = findCard(map, cardId);
  if (!card) return map;
  const span = Math.max(1, Math.round(newSpan));
  const delta = span - card.colSpan;
  if (delta === 0) return normalize(map);

  const oldEnd = cardEnd(card);
  const shiftIds = new Set<string>();
  for (const c of map.cards) {
    if (c.id !== card.id && c.laneId === card.laneId && c.startCol >= oldEnd) {
      shiftIds.add(c.id);
      for (const d of collectDescendants(map, c.id)) shiftIds.add(d.id);
    }
  }

  const cards = map.cards.map((c) => {
    if (c.id === card.id) return { ...c, colSpan: span };
    if (shiftIds.has(c.id)) return { ...c, startCol: Math.max(0, c.startCol + delta) };
    return c;
  });
  return normalize({ ...map, cards });
}

/**
 * Move a card's left edge while keeping its right edge fixed (left-handle
 * resize). Dragging in (rightward) narrows it; dragging out (leftward) widens
 * it, consuming any gap up to the previous sibling. Pulling the left edge past
 * column 0 extends the timeline leftward: fresh columns are opened at the origin
 * (everything shifts right) so the card grows while coordinates stay >= 0.
 */
export function resizeCardLeft(map: JourneyMap, cardId: string, newStartCol: number): JourneyMap {
  const card = findCard(map, cardId);
  if (!card) return map;
  const right = cardEnd(card);
  const target = Math.min(Math.round(newStartCol), right - 1);

  if (target < 0) {
    const shift = -target;
    const shifted = insertColumns(map, 0, shift); // shifts every card right by `shift`
    return updateCard(shifted, cardId, { startCol: 0, colSpan: right + shift });
  }

  const floor = Math.max(0, prevSiblingEnd(map, card));
  const start = Math.max(target, floor);
  if (start === card.startCol) return normalize(map);
  return updateCard(map, cardId, { startCol: start, colSpan: right - start });
}

// --- Swimlane edits ----------------------------------------------------------

export function addLane(map: JourneyMap, name = '', atIndex?: number): JourneyMap {
  const lane: Swimlane = { id: makeId('lane_'), name };
  const swimlanes = [...map.swimlanes];
  const idx = atIndex == null ? swimlanes.length : Math.max(0, Math.min(atIndex, swimlanes.length));
  swimlanes.splice(idx, 0, lane);
  return normalize({ ...map, swimlanes });
}

export function renameLane(map: JourneyMap, laneId: string, name: string): JourneyMap {
  const swimlanes = map.swimlanes.map((l) => (l.id === laneId ? { ...l, name } : l));
  return normalize({ ...map, swimlanes });
}

/** Reorder a lane from `fromIndex` to `toIndex`. Levels/parents recompute. */
export function moveLane(map: JourneyMap, fromIndex: number, toIndex: number): JourneyMap {
  const n = map.swimlanes.length;
  if (fromIndex < 0 || fromIndex >= n) return map;
  const to = Math.max(0, Math.min(Math.round(toIndex), n - 1));
  if (to === fromIndex) return normalize(map);
  const swimlanes = [...map.swimlanes];
  const [moved] = swimlanes.splice(fromIndex, 1);
  swimlanes.splice(to, 0, moved!);
  return normalize({ ...map, swimlanes });
}

/** Remove a lane and every card in it. */
export function removeLane(map: JourneyMap, laneId: string): JourneyMap {
  const swimlanes = map.swimlanes.filter((l) => l.id !== laneId);
  const cards = map.cards.filter((c) => c.laneId !== laneId);
  return normalize({ ...map, swimlanes, cards });
}
