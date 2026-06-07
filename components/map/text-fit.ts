import {
  CARD_FONT_MAX,
  CARD_FONT_MIN,
  CARD_LINE_FACTOR,
  CARD_HPAD,
  CARD_VPAD,
  LANE_H,
} from './constants';

const FONT_FAMILY =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const FONT_WEIGHT = 600;

let measureCanvas: HTMLCanvasElement | null = null;
function ctx(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null;
  if (!measureCanvas) measureCanvas = document.createElement('canvas');
  return measureCanvas.getContext('2d');
}

/** Width of `text` at `fontPx`. Falls back to a rough estimate on the server. */
export function measureWidth(text: string, fontPx: number): number {
  const c = ctx();
  if (!c) return text.length * fontPx * 0.55;
  c.font = `${FONT_WEIGHT} ${fontPx}px ${FONT_FAMILY}`;
  return c.measureText(text).width;
}

/** Greedy word-wrap into lines that each fit within `availWidth` at `fontPx`. */
function wrapLines(text: string, availWidth: number, fontPx: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [text];
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (measureWidth(candidate, fontPx) <= availWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export interface FitResult {
  /** Chosen title font size in screen pixels (held constant across zoom). */
  fontPx: number;
  /** Number of wrapped lines at the chosen font. */
  lineCount: number;
  /** Required card height in world units (>= LANE_H). */
  height: number;
}

/**
 * Fit a title into a card of `cardWidth` world units. Short text uses the max
 * font on one line; as text grows the font shrinks to a floor, then wraps onto
 * more lines, growing the card's height. All measurements are zoom-independent
 * (reference scale 1) so the grid layout stays stable while panning/zooming.
 *
 * `mult` scales the max/min font ceiling for the per-card relative size control
 * (small / medium / large) while keeping the fit-to-width behavior.
 */
export function fitCardTitle(title: string, cardWidth: number, mult = 1): FitResult {
  const text = title.trim() || 'Add text';
  const avail = Math.max(8, cardWidth - CARD_HPAD * 2);
  const fontMax = CARD_FONT_MAX * mult;
  const fontMin = CARD_FONT_MIN * mult;

  let fontPx: number;
  let lineCount: number;

  const wMax = measureWidth(text, fontMax);
  if (wMax <= avail) {
    fontPx = fontMax;
    lineCount = 1;
  } else {
    const scaled = fontMax * (avail / wMax);
    if (scaled >= fontMin) {
      fontPx = scaled;
      lineCount = 1;
    } else {
      fontPx = fontMin;
      lineCount = wrapLines(text, avail, fontMin).length;
    }
  }

  const lineH = fontPx * CARD_LINE_FACTOR;
  const height = Math.max(LANE_H, lineCount * lineH + CARD_VPAD * 2);
  return { fontPx, lineCount, height };
}
