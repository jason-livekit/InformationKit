/** World-space size of one base grid cell, in CSS pixels (before zoom). */
export const COL_W = 116;
/** Minimum world-space height of one swimlane row (a lane grows taller when a
 *  card in it needs more room for wrapped text). */
export const LANE_H = 96;
/** Fixed width of the left lane-label rail (screen space, not zoomed). */
export const LANE_LABEL_W = 152;
/** Padding (world units) kept to the left/top of column 0 / row 0 on first load. */
export const WORLD_PAD = 24;

export const MIN_SCALE = 0.2;
export const MAX_SCALE = 3.5;

// --- Card text fit ----------------------------------------------------------
// Card title font sizes are expressed in SCREEN pixels and held constant
// regardless of zoom (the world font is divided by the zoom scale at render).
// Auto-fit shrinks the font from MAX toward MIN, then wraps, then grows height.
export const CARD_FONT_MAX = 18;
export const CARD_FONT_MIN = 11;
export const CARD_LINE_FACTOR = 1.3;
/** Horizontal / vertical padding inside a card, world units. */
export const CARD_HPAD = 14;
export const CARD_VPAD = 12;
/** Constant screen font size for data-card titles. */
export const DATA_TITLE_FONT = 12;

/** Relative title-size multipliers applied to the auto-fit ceiling. */
export type FontScale = 'small' | 'medium' | 'large';
export const FONT_SCALE_MULT: Record<FontScale, number> = {
  small: 0.8,
  medium: 1,
  large: 1.35,
};
export function fontScaleMult(scale: FontScale | undefined): number {
  return FONT_SCALE_MULT[scale ?? 'medium'];
}

export interface Transform {
  scale: number;
  tx: number;
  ty: number;
}

/**
 * Level-of-detail is driven by the lane (row) a card lives in. A card's `level`
 * equals its swimlane index (row 0 = coarsest). Row 0 is always visible; deeper
 * rows "pop in" as you zoom past their reveal scale — so zooming out collapses
 * the map to a simple high-level view and zooming in reveals child lanes.
 * Nothing disappears as you zoom *in* — only as you zoom out (Google-Maps style).
 */

/** Scale at/above which detail `level` becomes visible. Level 0 is always shown. */
export function levelRevealScale(level: number): number {
  if (level <= 0) return 0;
  if (level === 1) return 0.58;
  if (level === 2) return 0.92;
  return 0.92 + (level - 2) * 0.5;
}

/** Deepest detail level visible at `scale`, capped at `maxLevel`. */
export function visibleLevelForScale(scale: number, maxLevel: number): number {
  let visible = 0;
  for (let l = 1; l <= maxLevel; l++) {
    if (scale >= levelRevealScale(l)) visible = l;
  }
  return visible;
}

export function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

/**
 * Zoom only scales the horizontal time axis, so "fit" is purely about width:
 * the scale at which the full timeline fits the content area (right of the
 * lane rail). Heights are fixed and scrolled vertically when too tall.
 */
export function fitScale(
  worldW: number,
  viewportW: number,
  laneLabelW: number = LANE_LABEL_W,
): number {
  const availW = Math.max(1, viewportW - laneLabelW - WORLD_PAD * 2);
  return availW / worldW;
}

/** Min/max width of the resizable lane rail. */
export const LANE_LABEL_MIN = 96;
export const LANE_LABEL_MAX = 360;

/**
 * Constrain a transform so you can't pan into empty space beyond the map's
 * bounds. Zoom scales the X (time) axis only; the Y axis (swimlane heights) is
 * never scaled, so the vertical extent is just `worldH`. When the content is
 * smaller than the available area on an axis it is pinned/centered so there is
 * nothing to scroll into.
 */
export function clampTransform(
  t: Transform,
  worldW: number,
  worldH: number,
  viewportW: number,
  viewportH: number,
  laneLabelW: number = LANE_LABEL_W,
): Transform {
  if (viewportW <= 0 || viewportH <= 0) return t;
  const scale = clampScale(t.scale);

  const screenW = worldW * scale;
  const screenH = worldH; // vertical axis is not zoomed
  const maxTx = laneLabelW + WORLD_PAD;
  const availRight = viewportW - WORLD_PAD;

  let tx: number;
  if (screenW <= availRight - maxTx) {
    tx = maxTx; // narrower than the area: pin to the left edge of the content
  } else {
    const minTx = availRight - screenW;
    tx = Math.min(maxTx, Math.max(minTx, t.tx));
  }

  let ty: number;
  if (screenH <= viewportH - WORLD_PAD * 2) {
    ty = WORLD_PAD; // shorter than the area: pin to the top
  } else {
    const maxTy = WORLD_PAD;
    const minTy = viewportH - WORLD_PAD - screenH;
    ty = Math.min(maxTy, Math.max(minTy, t.ty));
  }

  return { scale, tx, ty };
}
