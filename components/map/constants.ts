/** World-space size of one base grid cell, in CSS pixels (before zoom). */
export const COL_W = 116;
/** World-space height of one swimlane row, in CSS pixels (before zoom). */
export const LANE_H = 96;
/** Fixed width of the left lane-label rail (screen space, not zoomed). */
export const LANE_LABEL_W = 152;
/** Padding (world units) kept to the left/top of column 0 / row 0 on first load. */
export const WORLD_PAD = 24;

export const MIN_SCALE = 0.2;
export const MAX_SCALE = 3.5;

export interface Transform {
  scale: number;
  tx: number;
  ty: number;
}

/**
 * Map a zoom scale to the deepest visible detail level. Smaller scale (zoomed
 * out) reveals fewer levels; larger scale reveals more. Thresholds are spaced
 * so each row "pops in" as you zoom past it — the Google-Maps effect.
 */
export function visibleLevelForScale(scale: number, maxLevel: number): number {
  const thresholds = (level: number): number => {
    // level 0 always visible; subsequent rows appear at increasing scale.
    if (level <= 0) return 0;
    if (level === 1) return 0.58;
    if (level === 2) return 0.92;
    return 0.92 + (level - 2) * 0.5;
  };
  let visible = 0;
  for (let l = 1; l <= maxLevel; l++) {
    if (scale >= thresholds(l)) visible = l;
  }
  return visible;
}

export function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}
