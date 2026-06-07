import { describe, it, expect } from 'vitest';
import {
  rowLightness,
  columnHueGroups,
  computeTableColors,
  cascadeHue,
  HUE_ANGLES,
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

describe('colors: row lightness', () => {
  it('anchors the top row at the darkest shade', () => {
    expect(rowLightness(0, 1)).toBeLessThan(0.7);
  });
  it('steps dark (top) to light (bottom) in clearly-visible jumps', () => {
    const top = rowLightness(0, 8);
    const next = rowLightness(1, 8);
    expect(top).toBeLessThan(next);
    expect(next - top).toBeGreaterThan(0.05); // noticeable jump, not subtle
  });
  it('caps at the lightest shade so deep rows stay equally light', () => {
    const deep = rowLightness(20, 30);
    const deeper = rowLightness(25, 30);
    expect(deep).toBe(deeper);
    expect(deep).toBeLessThanOrEqual(0.95);
  });
});

describe('colors: column hue groups', () => {
  it('gives distinct ROYGBIV hues to independent columns', () => {
    const t = tableFrom([[{}, {}, {}]]);
    const g = columnHueGroups(t);
    expect(g.hueOf[0]).toBe(HUE_ANGLES[0]);
    expect(g.hueOf[1]).toBe(HUE_ANGLES[1]);
    expect(g.hueOf[2]).toBe(HUE_ANGLES[2]);
  });

  it('a merged cell cascades one hue across the columns it spans', () => {
    // Row 0: a single cell spanning all 3 columns -> all share the leftmost hue.
    const t = tableFrom([[{ span: 3 }], [{}, {}, {}]]);
    const g = columnHueGroups(t);
    expect(g.rootOf[0]).toBe(g.rootOf[1]);
    expect(g.rootOf[1]).toBe(g.rootOf[2]);
    expect(g.hueOf[0]).toBe(HUE_ANGLES[0]);
    expect(g.hueOf[2]).toBe(HUE_ANGLES[0]);
  });

  it('partially overlapping merged cells across rows join into one group', () => {
    // 4 columns. Row 0 merges cols 0-1, row 1 merges cols 1-2 -> 0,1,2 one group; 3 alone.
    const t = tableFrom([
      [{ span: 2 }, {}, {}],
      [{}, { span: 2 }, {}],
    ]);
    const g = columnHueGroups(t);
    expect(g.rootOf[0]).toBe(g.rootOf[1]);
    expect(g.rootOf[1]).toBe(g.rootOf[2]);
    expect(g.rootOf[3]).not.toBe(g.rootOf[0]);
  });

  it('a per-cell hue override wins for its whole group', () => {
    const t = tableFrom([[{ span: 2, hue: 200 }, {}]]);
    const g = columnHueGroups(t);
    expect(g.hueOf[0]).toBe(200);
    expect(g.hueOf[1]).toBe(200);
  });
});

describe('colors: computeTableColors', () => {
  it('emits oklch strings and flags header rows', () => {
    const t = tableFrom([[{}, {}], [{}, {}]]);
    t.headerRows = 1;
    const colors = computeTableColors(t);
    expect(colors[0]![0]!.isHeader).toBe(true);
    expect(colors[1]![0]!.isHeader).toBe(false);
    expect(colors[0]![0]!.fill).toMatch(/^oklch\(/);
    expect(colors[0]![0]!.border).toMatch(/^oklch\(/);
    expect(colors[0]![0]!.text).toMatch(/^oklch\(/);
  });

  it('uses light text on the dark top rows and dark text on light rows (contrast)', () => {
    const rows = Array.from({ length: 6 }, () => [{}, {}]);
    const t = tableFrom(rows);
    const colors = computeTableColors(t);
    const textL = (s: string) => parseFloat(s.replace('oklch(', '').split(' ')[0]!);
    // top row fill is darkest → text should be light (high L)
    expect(textL(colors[0]![0]!.text)).toBeGreaterThan(0.9);
    // bottom row fill is lightest → text should be dark (low L)
    expect(textL(colors[5]![0]!.text)).toBeLessThan(0.5);
  });

  it('cells in the same column share a hue but differ in lightness by row', () => {
    const t = tableFrom([[{}, {}], [{}, {}], [{}, {}]]);
    const colors = computeTableColors(t);
    // same column -> same hue component in the oklch string
    const hue = (s: string) => s.split(' ')[2];
    expect(hue(colors[0]![0]!.fill)).toBe(hue(colors[2]![0]!.fill));
    // different rows -> different lightness
    expect(colors[0]![0]!.fill).not.toBe(colors[2]![0]!.fill);
  });
});

describe('colors: cascadeHue', () => {
  it('writes a hue to every cell of the target column group', () => {
    const t = tableFrom([[{ span: 2 }, {}], [{}, {}, {}]]);
    const out = cascadeHue(t, 1, 0, 321); // column 0 belongs to the merged group {0,1}
    expect(out.rows[0]!.cells[0]!.hue).toBe(321); // the wide cell (cols 0-1)
    expect(out.rows[1]!.cells[0]!.hue).toBe(321);
    expect(out.rows[1]!.cells[1]!.hue).toBe(321);
    expect(out.rows[1]!.cells[2]!.hue).toBeNull(); // column 2 untouched
  });
});
