import type { JourneyMap } from '@/lib/repo/schemas';
import { COL_W, LANE_H, fontScaleMult } from './constants';
import { fitCardTitle } from './text-fit';

export interface MapLayout {
  /** Height of each swimlane in world units (>= LANE_H, grows for tall cards). */
  laneHeights: number[];
  /** Y offset of the top of each lane in world units. */
  laneTops: number[];
  /** Total map height in world units. */
  worldH: number;
  /** Per-card content height in world units (drives lane height). */
  cardHeight: Map<string, number>;
}

/**
 * Compute lane heights and offsets. A lane is as tall as its tallest card; a
 * card is as tall as its wrapped title needs (data cards use the base height).
 * Computed over all cards (not just visible ones) so the layout doesn't reflow
 * as zoom reveals/hides detail levels.
 */
export function computeLayout(map: JourneyMap): MapLayout {
  const laneHeights = map.swimlanes.map(() => LANE_H);
  const cardHeight = new Map<string, number>();

  for (const card of map.cards) {
    const idx = map.swimlanes.findIndex((l) => l.id === card.laneId);
    if (idx < 0) continue;
    const h =
      card.kind === 'data'
        ? LANE_H
        : fitCardTitle(card.title, card.colSpan * COL_W, fontScaleMult(card.fontScale)).height;
    cardHeight.set(card.id, h);
    if (h > laneHeights[idx]!) laneHeights[idx] = h;
  }

  const laneTops: number[] = [];
  let acc = 0;
  for (const h of laneHeights) {
    laneTops.push(acc);
    acc += h;
  }

  return { laneHeights, laneTops, worldH: acc, cardHeight };
}

/** Lane index containing world-y `y`, clamped to the valid range. */
export function laneIndexForY(
  y: number,
  laneTops: number[],
  laneHeights: number[],
): number {
  if (laneTops.length === 0) return 0;
  for (let i = 0; i < laneTops.length; i++) {
    if (y >= laneTops[i]! && y < laneTops[i]! + laneHeights[i]!) return i;
  }
  return y < 0 ? 0 : laneTops.length - 1;
}
