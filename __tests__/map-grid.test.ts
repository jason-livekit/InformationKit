import { describe, it, expect } from 'vitest';
import {
  createInitialTable,
  typePipe,
  typeEnter,
  typeShiftEnter,
  applyHeaderDashes,
  backspaceAtStart,
  deleteAtEnd,
  moveHorizontal,
  moveTab,
  moveVertical,
  mergeRight,
  unmergeRight,
  addRow,
  addColumn,
  deleteRow,
  deleteColumn,
  setCellText,
  rowSpan,
  cellRanges,
  type GridState,
} from '@/components/map/grid';
import type { MapTable } from '@/lib/repo/schemas';

/** Build a rectangular table from a grid of strings for concise test setup. */
function tableFrom(rows: string[][]): MapTable {
  const columnCount = rows[0]?.length ?? 0;
  return {
    columnCount,
    columnWidths: Array.from({ length: columnCount }, () => 140),
    headerRows: 0,
    rows: rows.map((cells) => ({
      id: `r${Math.random()}`,
      height: 48,
      cells: cells.map((text) => ({
        id: `c${Math.random()}`,
        colSpan: 1,
        text,
        bold: false,
        italic: false,
        strike: false,
        align: 'left' as const,
        hue: null,
      })),
    })),
  };
}

function texts(state: GridState): string[][] {
  return state.table.rows.map((r) => r.cells.map((c) => c.text));
}
function spans(state: GridState): number[][] {
  return state.table.rows.map((r) => r.cells.map((c) => c.colSpan));
}

describe('grid: construction', () => {
  it('creates an initial 1x1 table with the caret in the first cell', () => {
    const s = createInitialTable();
    expect(s.table.columnCount).toBe(1);
    expect(s.table.rows).toHaveLength(1);
    expect(s.table.rows[0]!.cells).toHaveLength(1);
    expect(s.caret).toEqual({ row: 0, cell: 0, offset: 0 });
  });
});

describe('grid: typing pipes', () => {
  it('commits a non-empty cell and spawns a trailing empty cell', () => {
    let s = createInitialTable();
    s = setCellText(s, 'Cell 1', 6);
    s = typePipe(s);
    expect(texts(s)).toEqual([['Cell 1', '']]);
    expect(s.table.columnCount).toBe(2);
    expect(s.caret).toEqual({ row: 0, cell: 1, offset: 0 });
  });

  it('typing a pipe in the empty trailing cell merges (extends) the previous cell', () => {
    let s = createInitialTable();
    s = setCellText(s, 'Cell 1', 6);
    s = typePipe(s); // -> ['Cell 1', '']  span [1,1]
    s = typePipe(s); // merge: extend Cell 1
    expect(spans(s)[0]![0]).toBe(2); // Cell 1 now spans 2 columns
    // a trailing empty active cell remains at the edge
    expect(s.table.rows[0]!.cells.at(-1)!.text).toBe('');
  });

  it('builds | Cell 1 | Cell 2 | with three base columns', () => {
    let s = createInitialTable();
    s = setCellText(s, 'Cell 1', 6);
    s = typePipe(s);
    s = setCellText(s, 'Cell 2', 6);
    s = typePipe(s);
    expect(texts(s)).toEqual([['Cell 1', 'Cell 2', '']]);
    expect(s.table.columnCount).toBe(3);
  });
});

describe('grid: enter opens a new row', () => {
  it('Enter on the trailing empty cell deletes it and opens the next row', () => {
    let s = createInitialTable();
    s = setCellText(s, 'Cell 1', 6);
    s = typePipe(s);
    s = setCellText(s, 'Cell 2', 6);
    s = typePipe(s); // ['Cell 1','Cell 2',''] cc=3, caret trailing empty
    s = typeEnter(s);
    expect(s.table.rows).toHaveLength(2);
    // first row collapsed its trailing empty into the prior cell -> 2 cells spanning 3 cols
    expect(rowSpan(s.table.rows[0]!)).toBe(3);
    expect(s.caret).toEqual({ row: 1, cell: 0, offset: 0 });
  });

  it('Enter mid-table navigates to the cell below', () => {
    const s: GridState = { table: tableFrom([['a', 'b'], ['c', 'd']]), caret: { row: 0, cell: 1, offset: 0 } };
    const next = typeEnter(s);
    expect(next.caret.row).toBe(1);
    expect(next.caret.cell).toBe(1);
  });
});

describe('grid: header dashes', () => {
  it('--- in the first cell of a second row marks the header and fills dashes', () => {
    let s: GridState = {
      table: tableFrom([['Cell 1', 'Cell 2'], ['---', '']]),
      caret: { row: 1, cell: 0, offset: 3 },
    };
    const out = applyHeaderDashes(s);
    expect(out).not.toBeNull();
    s = out!;
    expect(s.table.headerRows).toBe(1);
    expect(texts(s)[1]).toEqual(['---', '---']);
  });

  it('returns null when there is no header row above', () => {
    const s: GridState = { table: tableFrom([['---', '']]), caret: { row: 0, cell: 0, offset: 3 } };
    expect(applyHeaderDashes(s)).toBeNull();
  });
});

describe('grid: backspace at cell start', () => {
  it('shrinks a merged cell by one column', () => {
    const t = tableFrom([['a', 'b']]);
    t.rows[0]!.cells = [{ ...t.rows[0]!.cells[0]!, colSpan: 2, text: 'wide' }];
    const s: GridState = { table: t, caret: { row: 0, cell: 0, offset: 0 } };
    const out = backspaceAtStart(s)!;
    expect(out.table.rows[0]!.cells[0]!.colSpan).toBe(1);
  });

  it('merges text into the left cell when colSpan is 1', () => {
    const s: GridState = { table: tableFrom([['foo', 'bar']]), caret: { row: 0, cell: 1, offset: 0 } };
    const out = backspaceAtStart(s)!;
    expect(texts(out)).toEqual([['foobar']]);
    expect(out.caret).toEqual({ row: 0, cell: 0, offset: 3 });
  });

  it('deletes the row and moves to the previous row last cell for a lone first cell', () => {
    const s: GridState = {
      table: tableFrom([['top'], ['bottom']]),
      caret: { row: 1, cell: 0, offset: 0 },
    };
    const out = backspaceAtStart(s)!;
    expect(out.table.rows).toHaveLength(1);
    expect(texts(out)).toEqual([['topbottom']]);
    expect(out.caret.row).toBe(0);
  });

  it('does nothing for a lone first cell with no previous row', () => {
    const s: GridState = { table: tableFrom([['only']]), caret: { row: 0, cell: 0, offset: 0 } };
    expect(backspaceAtStart(s)).toBeNull();
  });
});

describe('grid: delete at cell end', () => {
  it('shrinks a merged cell by one column', () => {
    const t = tableFrom([['a', 'b']]);
    t.rows[0]!.cells = [{ ...t.rows[0]!.cells[0]!, colSpan: 2, text: 'wide' }];
    const s: GridState = { table: t, caret: { row: 0, cell: 0, offset: 4 } };
    const out = deleteAtEnd(s)!;
    expect(out.table.rows[0]!.cells[0]!.colSpan).toBe(1);
  });

  it('pulls the next cell text into the current one', () => {
    const s: GridState = { table: tableFrom([['foo', 'bar']]), caret: { row: 0, cell: 0, offset: 3 } };
    const out = deleteAtEnd(s)!;
    expect(texts(out)).toEqual([['foobar']]);
    expect(out.caret).toEqual({ row: 0, cell: 0, offset: 3 });
  });

  it('deletes the row and moves to the next row first cell for a lone last cell', () => {
    const s: GridState = { table: tableFrom([['top'], ['bottom']]), caret: { row: 0, cell: 0, offset: 3 } };
    const out = deleteAtEnd(s)!;
    expect(out.table.rows).toHaveLength(1);
    expect(texts(out)).toEqual([['topbottom']]);
  });
});

describe('grid: navigation', () => {
  it('left/right moves between cells and wraps rows', () => {
    const s: GridState = { table: tableFrom([['a', 'b'], ['c', 'd']]), caret: { row: 0, cell: 1, offset: 0 } };
    const right = moveHorizontal(s, 1); // wraps to next row first cell
    expect(right.caret).toMatchObject({ row: 1, cell: 0 });
    const left = moveHorizontal({ ...s, caret: { row: 1, cell: 0, offset: 0 } }, -1);
    expect(left.caret).toMatchObject({ row: 0, cell: 1 });
  });

  it('tab never creates structure and lands at offset 0', () => {
    const s: GridState = { table: tableFrom([['a', 'b']]), caret: { row: 0, cell: 0, offset: 0 } };
    const out = moveTab(s, 1);
    expect(out.caret).toEqual({ row: 0, cell: 1, offset: 0 });
    expect(out.table.rows[0]!.cells).toHaveLength(2); // unchanged
  });

  it('tab at the very end does not create a new cell', () => {
    const s: GridState = { table: tableFrom([['a', 'b']]), caret: { row: 0, cell: 1, offset: 0 } };
    const out = moveTab(s, 1);
    expect(out.table.rows).toHaveLength(1);
    expect(out.table.rows[0]!.cells).toHaveLength(2);
  });

  it('vertical move aligns by base column across merged cells', () => {
    const t = tableFrom([['a', 'b', 'c'], ['x', 'y', 'z']]);
    // merge first row into [ab][c]
    t.rows[0]!.cells = [
      { ...t.rows[0]!.cells[0]!, colSpan: 2, text: 'ab' },
      { ...t.rows[0]!.cells[2]!, colSpan: 1, text: 'c' },
    ];
    const s: GridState = { table: t, caret: { row: 1, cell: 2, offset: 0 } }; // 'z' at column 2
    const up = moveVertical(s, -1);
    expect(up.caret.cell).toBe(1); // 'c' covers column 2 in row 0
  });
});

describe('grid: explicit structural ops', () => {
  it('mergeRight extends a cell and keeps the row invariant', () => {
    const s: GridState = { table: tableFrom([['a', 'b', 'c']]), caret: { row: 0, cell: 0, offset: 0 } };
    const out = mergeRight(s);
    expect(out.table.rows[0]!.cells[0]!.colSpan).toBe(2);
    expect(rowSpan(out.table.rows[0]!)).toBe(out.table.columnCount);
  });

  it('unmergeRight splits a merged cell', () => {
    const t = tableFrom([['a', 'b']]);
    t.rows[0]!.cells = [{ ...t.rows[0]!.cells[0]!, colSpan: 2, text: 'wide' }];
    const s: GridState = { table: t, caret: { row: 0, cell: 0, offset: 0 } };
    const out = unmergeRight(s);
    expect(out.table.rows[0]!.cells).toHaveLength(2);
  });

  it('addRow appends a full-width empty row', () => {
    const s: GridState = { table: tableFrom([['a', 'b']]), caret: { row: 0, cell: 0, offset: 0 } };
    const out = addRow(s);
    expect(out.table.rows).toHaveLength(2);
    expect(rowSpan(out.table.rows[1]!)).toBe(2);
  });

  it('addColumn widens every row', () => {
    const s: GridState = { table: tableFrom([['a', 'b'], ['c', 'd']]), caret: { row: 0, cell: 0, offset: 0 } };
    const out = addColumn(s);
    expect(out.table.columnCount).toBe(3);
    out.table.rows.forEach((r) => expect(rowSpan(r)).toBe(3));
  });

  it('deleteRow removes a row but never the last one', () => {
    const s: GridState = { table: tableFrom([['a'], ['b']]), caret: { row: 0, cell: 0, offset: 0 } };
    expect(deleteRow(s, 0).table.rows).toHaveLength(1);
    const single: GridState = { table: tableFrom([['a']]), caret: { row: 0, cell: 0, offset: 0 } };
    expect(deleteRow(single, 0).table.rows).toHaveLength(1);
  });

  it('deleteColumn removes a base column', () => {
    const s: GridState = { table: tableFrom([['a', 'b'], ['c', 'd']]), caret: { row: 0, cell: 0, offset: 0 } };
    const out = deleteColumn(s, 1);
    expect(out.table.columnCount).toBe(1);
    expect(texts(out)).toEqual([['a'], ['c']]);
  });
});

describe('grid: geometry helpers', () => {
  it('cellRanges computes base-column ranges with spans', () => {
    const t = tableFrom([['a', 'b', 'c']]);
    t.rows[0]!.cells = [
      { ...t.rows[0]!.cells[0]!, colSpan: 2 },
      { ...t.rows[0]!.cells[2]! },
    ];
    expect(cellRanges(t.rows[0]!)).toEqual([
      { start: 0, end: 2 },
      { start: 2, end: 3 },
    ]);
  });

  it('shift+enter moves up', () => {
    const s: GridState = { table: tableFrom([['a'], ['b']]), caret: { row: 1, cell: 0, offset: 0 } };
    expect(typeShiftEnter(s).caret.row).toBe(0);
  });
});
