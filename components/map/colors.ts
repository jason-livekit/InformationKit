/**
 * Color engine for journey-map tables, built on the design-system color
 * primitives (named ramps with numeric shades, like Tailwind's `red-500`).
 *
 * Two independent axes drive a cell's color:
 *
 *  1. **Shade by row** — the top row uses the darkest/most-saturated shade and
 *     each row steps lighter, capping at the lightest shade. This gives a small
 *     set of clearly-distinct shades; rows past the cap all stay light.
 *
 *  2. **Color by column group** — a union-find over base columns assigns one
 *     ROYGBIV color name per connected group, so a merged cell "cascades" its
 *     color to vertically aligned cells. A per-cell color override wins and
 *     cascades to its whole group (see {@link cascadeHue}).
 *
 * Text picks the most readable shade from the *same* ramp (light text on dark
 * fills, dark text on light fills) so contrast always holds.
 */
import type { MapTable } from '@/lib/repo/schemas';
import { cellRanges } from './grid';

export const COLOR_NAMES = [
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'teal',
  'cyan',
  'blue',
  'indigo',
  'violet',
  'purple',
  'pink',
] as const;
export type ColorName = (typeof COLOR_NAMES)[number];

type Ramp = Record<number, string>;

/** Design-system color ramps (mirrors the `--color-*` tokens in globals.css). */
export const PALETTE: Record<ColorName, Ramp> = {
  red: { 100: '#FAE6E6', 200: '#FFCDC7', 300: '#FFA9A0', 400: '#FF7566', 500: '#FA4C39', 600: '#B32909', 700: '#791B11', 800: '#421510', 900: '#1F0E0B' },
  orange: { 100: '#FEE1CD', 200: '#FDCAA5', 300: '#FCAF78', 400: '#FA954C', 500: '#F97A1F', 600: '#DB5E06', 700: '#A44704', 800: '#6D2F03', 900: '#321501' },
  amber: { 100: '#FAEDD1', 200: '#FBDFB1', 300: '#FFB752', 400: '#FFA424', 500: '#EF8B01', 600: '#9D4D06', 700: '#833E01', 800: '#3F2208', 900: '#1A0E04' },
  yellow: { 100: '#FCF7E0', 200: '#FDF6A5', 300: '#FCF178', 400: '#FAEC4C', 500: '#F9E71F', 600: '#DBC906', 700: '#A49704', 800: '#6D6503', 900: '#1F1005' },
  lime: { 100: '#E5FECD', 200: '#D1FDA5', 300: '#BAFC78', 400: '#A3FA4C', 500: '#8CF91F', 600: '#70DB06', 700: '#54A404', 800: '#386D03', 900: '#1A3201' },
  green: { 100: '#D1FADF', 200: '#B8EFD1', 300: '#23DE6B', 400: '#1EB66A', 500: '#009E4F', 600: '#00753B', 700: '#006430', 800: '#003213', 900: '#001905' },
  teal: { 100: '#CDFEF6', 200: '#A5FDEE', 300: '#79FCE6', 400: '#4CFADD', 500: '#1FF9D5', 600: '#06DBB7', 700: '#04A489', 800: '#036D5C', 900: '#01322A' },
  cyan: { 100: '#DDF6FE', 200: '#BCEDFD', 300: '#88E5FB', 400: '#1FD5F9', 500: '#07B6DA', 600: '#15889F', 700: '#116172', 800: '#012A32', 900: '#051518' },
  blue: { 100: '#E2EBFD', 200: '#CADBFC', 300: '#6E9DFE', 400: '#395CF9', 500: '#002CF2', 600: '#0A259F', 700: '#0F1F66', 800: '#0C1640', 900: '#090C17' },
  indigo: { 100: '#CDD5FE', 200: '#A5B4FD', 300: '#788EFC', 400: '#4C69FA', 500: '#1F44F9', 600: '#0629DB', 700: '#041FA4', 800: '#03156D', 900: '#010932' },
  violet: { 100: '#FECDFE', 200: '#FDA5FD', 300: '#FC78FC', 400: '#FA4CFA', 500: '#F91FF9', 600: '#DB06DB', 700: '#A404A4', 800: '#6D036D', 900: '#320132' },
  purple: { 100: '#F2E4FB', 200: '#EABFFD', 300: '#DC85FF', 400: '#BA1FF9', 500: '#9A1ACE', 600: '#7A15A2', 700: '#591077', 800: '#390B4B', 900: '#190620' },
  pink: { 100: '#FECDE5', 200: '#FDA5D1', 300: '#FC78BA', 400: '#FA4CA3', 500: '#F91F8C', 600: '#DB0670', 700: '#A40454', 800: '#6D0338', 900: '#32011A' },
};

// Row → fill shade (top darkest → bottom lightest, capped at the last entry).
const FILL_SHADES = [500, 400, 300, 200, 100];
const BORDER_NEXT: Record<number, number> = { 100: 200, 200: 300, 300: 400, 400: 500, 500: 600 };
const LUM_FLIP = 0.4; // fills darker than this get light text

export interface CellColor {
  fill: string;
  border: string;
  text: string;
  isHeader: boolean;
}

export function colorHex(colorIndex: number, shade: number): string {
  const name = COLOR_NAMES[((colorIndex % COLOR_NAMES.length) + COLOR_NAMES.length) % COLOR_NAMES.length]!;
  return PALETTE[name][shade] ?? PALETTE[name][500]!;
}

export function fillShadeForRow(rowIndex: number): number {
  return FILL_SHADES[Math.min(rowIndex, FILL_SHADES.length - 1)]!;
}

function relLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

// ---------------------------------------------------------------------------
// Union-find over base columns → one color name per connected group
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
  /** resolved color index (into COLOR_NAMES) per base column. */
  colorOf: number[];
}

/**
 * Build column groups + their color indices. Any cell spanning multiple columns
 * unions those columns; a manual per-cell `hue` (used here as a color index)
 * override propagates to its whole group (latest write across rows wins).
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

  const leftmost = new Map<number, number>();
  for (let col = 0; col < n; col++) {
    const root = dsu.find(col);
    if (!leftmost.has(root)) leftmost.set(root, col);
  }

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
  const colorOf: number[] = [];
  for (let col = 0; col < n; col++) {
    const root = dsu.find(col);
    rootOf[col] = root;
    const override = overrideOf.get(root);
    colorOf[col] = override ?? (leftmost.get(root) ?? 0) % COLOR_NAMES.length;
  }
  return { rootOf, colorOf };
}

/**
 * Compute the rendered color for every cell. `[rowIndex][cellIndex]`.
 * Header rows are flagged so the render layer can bold them.
 */
export function computeTableColors(table: MapTable): CellColor[][] {
  const groups = columnHueGroups(table);
  return table.rows.map((row, r) => {
    const isHeader = r < table.headerRows;
    const shade = fillShadeForRow(r);
    const ranges = cellRanges(row);
    return row.cells.map((cell, i) => {
      const colorIndex = cell.hue ?? groups.colorOf[ranges[i]!.start] ?? 0;
      const fill = colorHex(colorIndex, shade);
      const border = colorHex(colorIndex, BORDER_NEXT[shade] ?? 600);
      const text = colorHex(colorIndex, relLuminance(fill) < LUM_FLIP ? 100 : 900);
      return { fill, border, text, isHeader };
    });
  });
}

/**
 * Apply a color (index into COLOR_NAMES, or null for automatic) to a cell and
 * cascade it to every cell aligned with that cell's column group.
 */
export function cascadeHue(
  table: MapTable,
  rowIndex: number,
  cellIndex: number,
  colorIndex: number | null,
): MapTable {
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
          return root === targetRoot ? { ...cell, hue: colorIndex } : { ...cell };
        }),
      };
    }),
  };
}
