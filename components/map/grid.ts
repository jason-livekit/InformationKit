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
 * new map (immutably), never mutating the input. Two invariants are maintained
 * by `normalize`, which runs at the end of every mutation:
 *
 *  1. A card's `level` equals its swimlane's index (row 0 = coarsest). This is
 *     what the zoom level-of-detail reveal keys off of.
 *  2. A card's `parentId` is the card in the lane directly above whose column
 *     span contains this card's horizontal center, or null.
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

/**
 * Recompute derived state (level, parentId, columnCount). Called at the end of
 * every mutation so callers never have to maintain these by hand.
 */
export function normalize(map: JourneyMap): JourneyMap {
  const withLevels = map.cards.map((c) => {
    const idx = laneIndex(map, c.laneId);
    return { ...c, level: idx < 0 ? 0 : idx };
  });

  const cards = withLevels.map((c) => {
    const idx = laneIndex(map, c.laneId);
    if (idx <= 0) return { ...c, parentId: null };
    const aboveLaneId = map.swimlanes[idx - 1]!.id;
    const center = c.startCol + c.colSpan / 2;
    const candidates = withLevels.filter(
      (o) =>
        o.laneId === aboveLaneId &&
        o.startCol <= center &&
        center <= o.startCol + o.colSpan,
    );
    // Prefer the tightest container (smallest span) when several overlap.
    candidates.sort((a, b) => a.colSpan - b.colSpan);
    return { ...c, parentId: candidates[0]?.id ?? null };
  });

  const columnCount = Math.max(contentRightEdge(cards), MIN_COLUMNS);
  return { ...map, cards, columnCount };
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
    base.points = Array.from({ length: colSpan }, (_, i) => ({
      col: startCol + i,
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

/**
 * Resize a card to `newSpan` columns (>= 1). Widening inserts columns at the
 * card's right edge (pushing everything after it right); narrowing removes them
 * (pulling everything after it left). Descendants stay nested.
 */
export function resizeCard(map: JourneyMap, cardId: string, newSpan: number): JourneyMap {
  const card = findCard(map, cardId);
  if (!card) return map;
  const span = Math.max(1, Math.round(newSpan));
  const delta = span - card.colSpan;
  if (delta === 0) return normalize(map);
  const rightEdge = cardEnd(card);

  if (delta > 0) {
    const shifted = insertColumns(map, rightEdge, delta);
    return updateCard(shifted, cardId, { colSpan: span });
  }
  // Narrow: drop the trailing columns; removeColumns shrinks this card too.
  const d = -delta;
  const newRightEdge = card.startCol + span;
  return removeColumns(map, newRightEdge, d);
}

/**
 * Move a card's left edge while keeping its right edge fixed (left-handle
 * resize): widen-left inserts columns before the card, narrow-left removes them.
 */
export function resizeCardLeft(map: JourneyMap, cardId: string, newStartCol: number): JourneyMap {
  const card = findCard(map, cardId);
  if (!card) return map;
  const right = cardEnd(card);
  const start = Math.max(0, Math.min(Math.round(newStartCol), right - 1));
  const delta = card.startCol - start; // positive => grow to the left
  if (delta === 0) return normalize(map);

  if (delta > 0) {
    const shifted = insertColumns(map, card.startCol, delta);
    // After insert, this card's startCol shifted right by delta; pull it back.
    return updateCard(shifted, cardId, { startCol: start, colSpan: card.colSpan + delta });
  }
  const d = -delta; // shrink from the left
  return removeColumns(map, card.startCol, d);
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

/** Remove a lane and every card in it. */
export function removeLane(map: JourneyMap, laneId: string): JourneyMap {
  const swimlanes = map.swimlanes.filter((l) => l.id !== laneId);
  const cards = map.cards.filter((c) => c.laneId !== laneId);
  return normalize({ ...map, swimlanes, cards });
}
