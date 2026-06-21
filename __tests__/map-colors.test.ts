import { describe, it, expect } from 'vitest';
import {
  columnHueGroups,
  computeTableColors,
  cascadeHue,
  fillShadeForRow,
  colorHex,
  COLOR_NAMES,
  PALETTE,
} from '@/components/map/colors';
import type { MapTable } from '@/lib/repo/schemas';

function tableFrom(rows: Array<Array<{ span?: number; hue?: number | null }>>): MapTable {
  const columnCount = rows[0]!.reduce((n, c) => n + (c.span ?? 1), 0);
  return {
    columnCount,
    columnWidths: Array.from({ length: columnCount }, () => 140),
    headerRows: 0,
    rows: rows.map((cells) => ({
      id: `r${Math.random()}`,
      height: 48,
      cells: cells.map((c) => ({
        id: `c${Math.random()}`,
        colSpan: c.span ?? 1,
        text: '',
        bold: false,
        italic: false,
        strike: false,
        align: 'left' as const,
        hue: c.hue ?? null,
      })),
    })),
  };
}

function relLum(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

describe('colors: row shade', () => {
  it('uses the darkest shade for the top row and steps lighter, capped', () => {
    expect(fillShadeForRow(0)).toBe(500);
    expect(fillShadeForRow(1)).toBe(400);
    expect(fillShadeForRow(2)).toBe(300);
    // deep rows cap at the lightest shade
    expect(fillShadeForRow(10)).toBe(100);
    expect(fillShadeForRow(20)).toBe(100);
  });
});

describe('colors: named palette', () => {
  it('exposes vivid ramps for every color name', () => {
    COLOR_NAMES.forEach((name) => {
      expect(PALETTE[name][500]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });
  it('colorHex wraps the color index', () => {
    expect(colorHex(0, 400)).toBe(PALETTE.red[400]);
    expect(colorHex(COLOR_NAMES.length, 400)).toBe(PALETTE.red[400]); // wraps
  });
});

describe('colors: column groups', () => {
  it('gives distinct ROYGBIV colors to independent columns', () => {
    const t = tableFrom([[{}, {}, {}]]);
    const g = columnHueGroups(t);
    expect(g.colorOf[0]).toBe(0);
    expect(g.colorOf[1]).toBe(1);
    expect(g.colorOf[2]).toBe(2);
  });

  it('a merged cell cascades one color across the columns it spans', () => {
    const t = tableFrom([[{ span: 3 }], [{}, {}, {}]]);
    const g = columnHueGroups(t);
    expect(g.rootOf[0]).toBe(g.rootOf[1]);
    expect(g.rootOf[1]).toBe(g.rootOf[2]);
    expect(g.colorOf[0]).toBe(0);
    expect(g.colorOf[2]).toBe(0);
  });

  it('partially overlapping merged cells across rows join into one group', () => {
    const t = tableFrom([
      [{ span: 2 }, {}, {}],
      [{}, { span: 2 }, {}],
    ]);
    const g = columnHueGroups(t);
    expect(g.rootOf[0]).toBe(g.rootOf[1]);
    expect(g.rootOf[1]).toBe(g.rootOf[2]);
    expect(g.rootOf[3]).not.toBe(g.rootOf[0]);
  });

  it('a per-cell color override wins for its whole group', () => {
    const t = tableFrom([[{ span: 2, hue: 8 }, {}]]);
    const g = columnHueGroups(t);
    expect(g.colorOf[0]).toBe(8);
    expect(g.colorOf[1]).toBe(8);
  });
});

describe('colors: computeTableColors', () => {
  it('emits hex colors from the palette and flags header rows', () => {
    const t = tableFrom([[{}, {}], [{}, {}]]);
    t.headerRows = 1;
    const colors = computeTableColors(t);
    expect(colors[0]![0]!.isHeader).toBe(true);
    expect(colors[1]![0]!.isHeader).toBe(false);
    expect(colors[0]![0]!.fill).toMatch(/^#[0-9A-Fa-f]{6}$/);
    // top row uses shade 500, second row shade 400
    expect(colors[0]![0]!.fill).toBe(PALETTE.red[500]);
    expect(colors[1]![0]!.fill).toBe(PALETTE.red[400]);
  });

  it('keeps readable contrast: text is light on dark fills, dark on light fills', () => {
    const rows = Array.from({ length: 5 }, () => [{}]);
    const t = tableFrom(rows);
    const colors = computeTableColors(t);
    colors.forEach((row) => {
      const { fill, text } = row[0]!;
      expect(Math.abs(relLum(fill) - relLum(text))).toBeGreaterThan(0.25);
    });
  });

  it('cells in the same column share a color but differ in shade by row', () => {
    const t = tableFrom([[{}, {}], [{}, {}], [{}, {}]]);
    const colors = computeTableColors(t);
    // same column 0 → red ramp on every row, but different shades
    expect(colors[0]![0]!.fill).toBe(PALETTE.red[500]);
    expect(colors[1]![0]!.fill).toBe(PALETTE.red[400]);
    expect(colors[2]![0]!.fill).toBe(PALETTE.red[300]);
  });
});

describe('colors: cascadeHue', () => {
  it('writes a color index to every cell of the target column group', () => {
    const t = tableFrom([[{ span: 2 }, {}], [{}, {}, {}]]);
    const out = cascadeHue(t, 1, 0, 9); // column 0 belongs to the merged group {0,1}
    expect(out.rows[0]!.cells[0]!.hue).toBe(9);
    expect(out.rows[1]!.cells[0]!.hue).toBe(9);
    expect(out.rows[1]!.cells[1]!.hue).toBe(9);
    expect(out.rows[1]!.cells[2]!.hue).toBeNull(); // column 2 untouched
  });
});
