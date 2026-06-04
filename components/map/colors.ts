/**
 * OKLCH color engine for journey-map tables.
 *
 * Two independent axes drive a cell's color:
 *
 *  1. **Lightness by row** — top row is darkest, bottom row is lightest. As you
 *     add rows the lightest set is always pushed to the bottom and earlier rows
 *     step darker (recomputed purely from the row count). This reads as a
 *     dark→light gradient top→bottom, which suits journey maps.
 *
 *  2. **Hue by column group** — a union-find over base columns. Every cell
 *     unions all the base columns it spans, so a merged cell "cascades" its hue
 *     to the cells vertically aligned with it (and, transitively, to any other
 *     merged cell that overlaps). Each connected group gets one hue: a per-cell
 *     override if present (latest write wins, applied across the whole group via
 *     {@link cascadeHue}), otherwise a ROYGBIV angle from the design palette.
 *
 * Colors are emitted as `oklch(...)` strings and applied inline so they adapt to
 * light/dark automatically. Header rows opt out (rendered with `bg-bg2`).
 */
import type { MapTable } from '@/lib/repo/schemas';
import { cellRanges } from './grid';

/**
 * ROYGBIV-ordered hue angles (OKLCH degrees) sampled to match the design
 * palette in `globals.css` (--color-red/orange/amber/.../pink). Cycles when a
 * table has more column groups than hues.
 */
export const HUE_ANGLES = [
  25, // red
  50, // orange
  70, // amber
  100, // yellow
  125, // lime
  150, // green
  178, // teal
  215, // cyan
  255, // blue
  270, // indigo
  300, // violet
  328, // purple
  358, // pink
];

// Surface lightness range (top=dark .. bottom=light) and fixed pastel chroma.
const L_DARK = 0.74;
const L_LIGHT = 0.93;
const C_FILL = 0.055;
const BORDER_DL = 0.1;
const C_BORDER = 0.075;
const L_TEXT = 0.4;
const C_TEXT = 0.11;

export interface CellColor {
  fill: string;
  border: string;
  text: string;
  isHeader: boolean;
}

export function oklch(l: number, c: number, h: number): string {
  const L = Math.max(0, Math.min(1, l));
  return `oklch(${L.toFixed(4)} ${c.toFixed(4)} ${h.toFixed(2)})`;
}

/** Lightness for a given row index (top darkest → bottom lightest). */
export function rowLightness(rowIndex: number, rowCount: number): number {
  if (rowCount <= 1) return L_LIGHT;
  const t = rowIndex / (rowCount - 1);
  return L_DARK + (L_LIGHT - L_DARK) * t;
}

// ---------------------------------------------------------------------------
// Union-find over base columns
// ---------------------------------------------------------------------------

class DSU {
  parent: number[];
  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
  }
  find(x: number): number {
    while (this.parent[x] !== x) {
      this.parent[x] = this.parent[this.parent[x]!]!;
      x = this.parent[x]!;
    }
    return x;
  }
  union(a: number, b: number): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent[Math.max(ra, rb)] = Math.min(ra, rb);
  }
}

export interface ColumnGroups {
  /** group root id per base column. */
  rootOf: number[];
  /** resolved hue (deg) per base column. */
  hueOf: number[];
}

/**
 * Build the column groups + their hues. Any cell spanning multiple columns
 * unions those columns; a manual per-cell `hue` override propagates to its whole
 * group (latest write across rows wins).
 */
export function columnHueGroups(table: MapTable): ColumnGroups {
  const n = Math.max(0, table.columnCount);
  const dsu = new DSU(n);
  for (const row of table.rows) {
    const ranges = cellRanges(row);
    ranges.forEach(({ start, end }) => {
      for (let col = start + 1; col < end; col++) dsu.union(start, col);
    });
  }

  // Default hue per group root = ROYGBIV angle of the group's leftmost column.
  const leftmost = new Map<number, number>();
  for (let col = 0; col < n; col++) {
    const root = dsu.find(col);
    if (!leftmost.has(root)) leftmost.set(root, col);
  }

  // Manual overrides cascade to the group (last write wins, top→bottom).
  const overrideOf = new Map<number, number>();
  for (const row of table.rows) {
    const ranges = cellRanges(row);
    row.cells.forEach((cell, i) => {
      if (cell.hue == null) return;
      const root = dsu.find(ranges[i]!.start);
      overrideOf.set(root, cell.hue);
    });
  }

  const rootOf: number[] = [];
  const hueOf: number[] = [];
  for (let col = 0; col < n; col++) {
    const root = dsu.find(col);
    rootOf[col] = root;
    const override = overrideOf.get(root);
    hueOf[col] = override ?? HUE_ANGLES[(leftmost.get(root) ?? 0) % HUE_ANGLES.length]!;
  }
  return { rootOf, hueOf };
}

/**
 * Compute the rendered color for every cell. `[rowIndex][cellIndex]`.
 * Header rows return `isHeader: true` (the render layer paints them with bg2).
 */
export function computeTableColors(table: MapTable): CellColor[][] {
  const groups = columnHueGroups(table);
  const rowCount = table.rows.length;
  return table.rows.map((row, r) => {
    const isHeader = r < table.headerRows;
    const L = rowLightness(r, rowCount);
    const ranges = cellRanges(row);
    return row.cells.map((cell, i) => {
      const hue = cell.hue ?? groups.hueOf[ranges[i]!.start] ?? 0;
      return {
        fill: oklch(L, C_FILL, hue),
        border: oklch(L - BORDER_DL, C_BORDER, hue),
        text: oklch(L_TEXT, C_TEXT, hue),
        isHeader,
      };
    });
  });
}

/**
 * Apply a hue to a cell and cascade it to every cell aligned with that cell's
 * column group (the merge cascade described in the spec). Returns a new table.
 */
export function cascadeHue(table: MapTable, rowIndex: number, cellIndex: number, hue: number | null): MapTable {
  const groups = columnHueGroups(table);
  const sourceRow = table.rows[rowIndex];
  if (!sourceRow) return table;
  const ranges = cellRanges(sourceRow);
  const targetRoot = groups.rootOf[ranges[cellIndex]?.start ?? 0];
  if (targetRoot === undefined) return table;

  return {
    ...table,
    rows: table.rows.map((row) => {
      const rr = cellRanges(row);
      return {
        ...row,
        cells: row.cells.map((cell, i) => {
          const root = groups.rootOf[rr[i]!.start];
          return root === targetRoot ? { ...cell, hue } : { ...cell };
        }),
      };
    }),
  };
}
