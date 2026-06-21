/**
 * Pure, framework-free grid engine for the markdown-table journey-map editor.
 *
 * The React/canvas layer stays thin: it captures key events and calls these
 * functions, which return a brand-new `{ table, caret }` (immutable updates).
 *
 * Model
 * -----
 * A table is a grid of `columnCount` base columns. Each row partitions
 * `[0, columnCount)` into consecutive cells; a cell with `colSpan = n` covers
 * `n` base columns (merging like Excel). The invariant
 * `sum(row.cells.colSpan) === columnCount` holds for every row — we pad shorter
 * rows with empty trailing cells whenever the table grows wider.
 *
 * Caret
 * -----
 * `{ row, cell, offset }` plus an editor `mode` ('typing' | 'select') tracked by
 * the store. While building at the growing edge of a row there is usually a
 * trailing *empty* "active" cell holding the blinking cursor (see the spec).
 */
import type { MapCell, MapRow, MapTable } from '@/lib/repo/schemas';
import { makeId } from '@/lib/repo/ids';

export const DEFAULT_ROW_HEIGHT = 48;
export const DEFAULT_COL_WIDTH = 140;

export interface Caret {
  row: number;
  cell: number;
  offset: number;
}

export interface GridState {
  table: MapTable;
  caret: Caret;
}

// ---------------------------------------------------------------------------
// Construction helpers
// ---------------------------------------------------------------------------

export function makeCell(text = ''): MapCell {
  return {
    id: makeId('mc_'),
    colSpan: 1,
    text,
    bold: false,
    italic: false,
    strike: false,
    align: 'center',
    hue: null,
  };
}

export function makeRow(cells: MapCell[]): MapRow {
  return { id: makeId('mr_'), height: DEFAULT_ROW_HEIGHT, cells };
}

/** Clicking a blank canvas creates the first (empty) header-style cell. */
export function createInitialTable(): GridState {
  const table: MapTable = {
    columnCount: 1,
    columnWidths: [DEFAULT_COL_WIDTH],
    headerRows: 0,
    rows: [makeRow([makeCell('')])],
  };
  return { table, caret: { row: 0, cell: 0, offset: 0 } };
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

/** Sum of a row's colSpans. */
export function rowSpan(row: MapRow): number {
  return row.cells.reduce((n, c) => n + c.colSpan, 0);
}

/** Base-column [start, end) range covered by each cell of a row. */
export function cellRanges(row: MapRow): Array<{ start: number; end: number }> {
  const out: Array<{ start: number; end: number }> = [];
  let start = 0;
  for (const c of row.cells) {
    out.push({ start, end: start + c.colSpan });
    start += c.colSpan;
  }
  return out;
}

function clone(table: MapTable): MapTable {
  return {
    columnCount: table.columnCount,
    columnWidths: [...table.columnWidths],
    headerRows: table.headerRows,
    rows: table.rows.map((r) => ({ ...r, cells: r.cells.map((c) => ({ ...c })) })),
  };
}

/** Append empty trailing cells to every row whose span is below columnCount. */
function padRowsToWidth(table: MapTable): void {
  for (const row of table.rows) {
    let span = rowSpan(row);
    while (span < table.columnCount) {
      row.cells.push(makeCell(''));
      span += 1;
    }
  }
  while (table.columnWidths.length < table.columnCount) {
    table.columnWidths.push(DEFAULT_COL_WIDTH);
  }
  if (table.columnWidths.length > table.columnCount) {
    table.columnWidths.length = table.columnCount;
  }
}

function isEmptyCell(cell: MapCell): boolean {
  return cell.text.length === 0;
}

// ---------------------------------------------------------------------------
// Pipe — build cells / merge columns
// ---------------------------------------------------------------------------

/**
 * Handle typing `|`.
 *  - In a cell with content → commit it and spawn a new empty trailing cell.
 *  - In an empty cell → a *leading* pipe declares this cell's width up front:
 *    extend the current (empty) cell by one column and add artificial width.
 *    Typing `||` before any text gives a 2-column cell, `|||` a 3-column cell,
 *    and so on. The caret stays in the cell, ready for text.
 */
export function typePipe(state: GridState): GridState {
  const table = clone(state.table);
  const { row, cell } = state.caret;
  const r = table.rows[row];
  if (!r) return state;
  const cur = r.cells[cell];
  if (!cur) return state;

  if (!isEmptyCell(cur)) {
    // Commit current cell, open a new empty trailing cell to its right.
    table.columnCount += 1;
    r.cells.splice(cell + 1, 0, makeCell(''));
    padRowsToWidth(table);
    return { table, caret: { row, cell: cell + 1, offset: 0 } };
  }

  // Empty cell: a leading pipe widens this very cell (declare width up front).
  cur.colSpan += 1;
  table.columnCount += 1;
  padRowsToWidth(table);
  return { table, caret: { row, cell, offset: 0 } };
}

// ---------------------------------------------------------------------------
// Enter — open the next row (or navigate down)
// ---------------------------------------------------------------------------

/**
 * Handle Enter.
 *  - On the trailing empty cell with no row below → delete that empty cell and
 *    open a fresh row beneath with a single empty cell + caret.
 *  - Otherwise navigate to the cell directly below (Figma/table convention).
 */
export function typeEnter(state: GridState): GridState {
  const { row, cell } = state.caret;
  const table = state.table;
  const r = table.rows[row];
  if (!r) return state;
  const cur = r.cells[cell];

  const isLastRow = row === table.rows.length - 1;
  const isTrailingEmpty = !!cur && isEmptyCell(cur) && cell === r.cells.length - 1;

  if (isTrailingEmpty && isLastRow) {
    const next = clone(table);
    const nrow = next.rows[row]!;
    // Drop the trailing empty cell if the row has other content; otherwise keep it.
    if (nrow.cells.length > 1) {
      nrow.cells.pop();
      // Extend the new last cell to keep the row width invariant.
      nrow.cells[nrow.cells.length - 1]!.colSpan += 1;
    }
    const newRow = makeRow([makeCell('')]);
    // Make the new row as wide as the table by padding.
    next.rows.push(newRow);
    padRowsToWidth(next);
    return { table: next, caret: { row: row + 1, cell: 0, offset: 0 } };
  }

  // Navigate down to the aligned cell.
  return moveVertical(state, 1);
}

/** Shift+Enter — navigate to the row above. */
export function typeShiftEnter(state: GridState): GridState {
  return moveVertical(state, -1);
}

// ---------------------------------------------------------------------------
// Header dashes — `---` in the first cell marks header rows
// ---------------------------------------------------------------------------

/**
 * Typing `---` autofills a separator row: marks the rows above as header rows
 * and fills the current (last) row with placeholder dash cells matching the
 * column count. Returns null if not applicable (no rows above / not 3 dashes).
 */
export function applyHeaderDashes(state: GridState): GridState | null {
  const { row, cell } = state.caret;
  const table = state.table;
  const r = table.rows[row];
  if (!r) return null;
  const cur = r.cells[cell];
  if (!cur || cur.text !== '---') return null;
  if (row === 0) return null; // need a row above to be the header

  const next = clone(table);
  const nrow = next.rows[row]!;
  // Replace this row with `columnCount` dash cells.
  nrow.cells = Array.from({ length: next.columnCount }, () => makeCell('---'));
  next.headerRows = row; // every row above this separator becomes a header
  return { table: next, caret: { row, cell: next.columnCount - 1, offset: 3 } };
}

// ---------------------------------------------------------------------------
// Backspace / Delete
// ---------------------------------------------------------------------------

/**
 * Backspace pressed while the caret is at offset 0 (left of the text).
 * Encodes the spec's structural deletion rules. Returns null when the caller
 * should fall through to normal character deletion.
 */
export function backspaceAtStart(state: GridState): GridState | null {
  const { row, cell } = state.caret;
  const table = state.table;
  const r = table.rows[row];
  if (!r) return null;
  const cur = r.cells[cell];
  if (!cur) return null;

  // colSpan > 1 → shrink by one column.
  if (cur.colSpan > 1) {
    const next = clone(table);
    next.rows[row]!.cells[cell]!.colSpan -= 1;
    recomputeWidth(next);
    return { table: next, caret: { row, cell, offset: 0 } };
  }

  // colSpan === 1.
  if (cell > 0) {
    // Delete this cell; merge text into the end of the left cell.
    const next = clone(table);
    const nrow = next.rows[row]!;
    const prev = nrow.cells[cell - 1]!;
    const prevLen = prev.text.length;
    prev.text += cur.text;
    nrow.cells.splice(cell, 1);
    recomputeWidth(next);
    return { table: next, caret: { row, cell: cell - 1, offset: prevLen } };
  }

  // First cell of the row.
  if (r.cells.length === 1) {
    // Only cell in the row → delete the row, caret to previous row's last cell.
    if (row > 0) {
      const next = clone(table);
      const prevRow = next.rows[row - 1]!;
      const lastIdx = prevRow.cells.length - 1;
      const lastCell = prevRow.cells[lastIdx]!;
      const off = lastCell.text.length;
      // For an empty cell, just move the caret; otherwise append text.
      if (!isEmptyCell(cur)) lastCell.text += cur.text;
      next.rows.splice(row, 1);
      recomputeWidth(next);
      return { table: next, caret: { row: row - 1, cell: lastIdx, offset: off } };
    }
    // No previous row: nothing to do (caller may clear to blank if also empty).
    return null;
  }

  // First cell but row has more cells: merge into the (now) next cell? No left
  // neighbor — fall through to character deletion.
  return null;
}

/**
 * Delete (fn+Backspace) pressed while the caret is at the end of the cell text.
 * Mirror of {@link backspaceAtStart}.
 */
export function deleteAtEnd(state: GridState): GridState | null {
  const { row, cell } = state.caret;
  const table = state.table;
  const r = table.rows[row];
  if (!r) return null;
  const cur = r.cells[cell];
  if (!cur) return null;

  if (cur.colSpan > 1) {
    const next = clone(table);
    next.rows[row]!.cells[cell]!.colSpan -= 1;
    recomputeWidth(next);
    return { table: next, caret: { row, cell, offset: cur.text.length } };
  }

  if (cell < r.cells.length - 1) {
    // Pull the next cell's text into this one and remove it.
    const next = clone(table);
    const nrow = next.rows[row]!;
    const nextCell = nrow.cells[cell + 1]!;
    const off = cur.text.length;
    nrow.cells[cell]!.text += nextCell.text;
    nrow.cells.splice(cell + 1, 1);
    recomputeWidth(next);
    return { table: next, caret: { row, cell, offset: off } };
  }

  // Last cell in the row.
  if (r.cells.length === 1) {
    if (row < table.rows.length - 1) {
      // Delete this row, caret to the next row's first cell.
      const next = clone(table);
      const belowRow = next.rows[row + 1]!;
      const first = belowRow.cells[0]!;
      if (!isEmptyCell(cur)) first.text = cur.text + first.text;
      next.rows.splice(row, 1);
      recomputeWidth(next);
      return { table: next, caret: { row, cell: 0, offset: 0 } };
    }
    return null;
  }

  return null;
}

/** After structural deletions, drop unused trailing columns and resync widths. */
function recomputeWidth(table: MapTable): void {
  const max = table.rows.reduce((m, r) => Math.max(m, rowSpan(r)), 0);
  table.columnCount = max;
  if (table.columnWidths.length > max) table.columnWidths.length = max;
  while (table.columnWidths.length < max) table.columnWidths.push(DEFAULT_COL_WIDTH);
  if (table.headerRows > table.rows.length) table.headerRows = table.rows.length;
  padRowsToWidth(table);
}

// ---------------------------------------------------------------------------
// Navigation — arrows + tab
// ---------------------------------------------------------------------------

/** Move left/right between cells, wrapping to the row above/below at the edges. */
export function moveHorizontal(state: GridState, dir: 1 | -1): GridState {
  const { row, cell } = state.caret;
  const table = state.table;
  const r = table.rows[row];
  if (!r) return state;

  if (dir === -1) {
    if (cell > 0) return setCaretEnd(state, row, cell - 1);
    if (row > 0) {
      const prev = table.rows[row - 1]!;
      return setCaretEnd(state, row - 1, prev.cells.length - 1);
    }
    return state;
  }
  if (cell < r.cells.length - 1) return setCaretStart(state, row, cell + 1);
  if (row < table.rows.length - 1) return setCaretStart(state, row + 1, 0);
  return state;
}

/**
 * Tab / Shift+Tab — like horizontal motion but never creates structure and
 * always lands at the start of the destination cell.
 */
export function moveTab(state: GridState, dir: 1 | -1): GridState {
  const moved = moveHorizontal(state, dir);
  return { table: moved.table, caret: { ...moved.caret, offset: 0 } };
}

/** Move to the cell vertically aligned (by base column) in the row above/below. */
export function moveVertical(state: GridState, dir: 1 | -1): GridState {
  const { row, cell } = state.caret;
  const table = state.table;
  const targetRow = row + dir;
  if (targetRow < 0 || targetRow >= table.rows.length) return state;
  const ranges = cellRanges(table.rows[row]!);
  const col = ranges[cell]?.start ?? 0;
  const targetIdx = cellIndexAtColumn(table.rows[targetRow]!, col);
  return { table, caret: { row: targetRow, cell: targetIdx, offset: 0 } };
}

/** Index of the cell covering base column `col` in a row. */
export function cellIndexAtColumn(row: MapRow, col: number): number {
  const ranges = cellRanges(row);
  for (let i = 0; i < ranges.length; i++) {
    if (col >= ranges[i]!.start && col < ranges[i]!.end) return i;
  }
  return Math.max(0, row.cells.length - 1);
}

function setCaretStart(state: GridState, row: number, cell: number): GridState {
  return { table: state.table, caret: { row, cell, offset: 0 } };
}

function setCaretEnd(state: GridState, row: number, cell: number): GridState {
  const c = state.table.rows[row]?.cells[cell];
  return { table: state.table, caret: { row, cell, offset: c ? c.text.length : 0 } };
}

// ---------------------------------------------------------------------------
// Explicit structural ops (chrome + keyboard shortcuts)
// ---------------------------------------------------------------------------

/** Set the text of the caret cell (used by the React input layer). */
export function setCellText(state: GridState, text: string, offset: number): GridState {
  const next = clone(state.table);
  const c = next.rows[state.caret.row]?.cells[state.caret.cell];
  if (!c) return state;
  c.text = text;
  return { table: next, caret: { ...state.caret, offset } };
}

/** Merge the caret cell one column to the right (if room exists). */
export function mergeRight(state: GridState): GridState {
  const next = clone(state.table);
  const r = next.rows[state.caret.row];
  if (!r) return state;
  const c = r.cells[state.caret.cell];
  if (!c) return state;
  const span = rowSpan(r);
  if (span >= next.columnCount) {
    // Already widest — grow the table.
    next.columnCount += 1;
    padRowsToWidth(next);
  }
  c.colSpan += 1;
  // Remove an empty neighbor to the right to keep the row width invariant.
  const neighbor = r.cells[state.caret.cell + 1];
  if (neighbor && rowSpan(r) > next.columnCount) {
    if (neighbor.colSpan > 1) neighbor.colSpan -= 1;
    else r.cells.splice(state.caret.cell + 1, 1);
  }
  recomputeWidth(next);
  return { table: next, caret: state.caret };
}

/** Shrink the caret cell by one column (if colSpan > 1). */
export function unmergeRight(state: GridState): GridState {
  const next = clone(state.table);
  const r = next.rows[state.caret.row];
  const c = r?.cells[state.caret.cell];
  if (!c || c.colSpan <= 1) return state;
  c.colSpan -= 1;
  r!.cells.splice(state.caret.cell + 1, 0, makeCell(''));
  recomputeWidth(next);
  return { table: next, caret: state.caret };
}

/** Add a new empty row below `rowIndex` (defaults to last). */
export function addRow(state: GridState, rowIndex?: number): GridState {
  const next = clone(state.table);
  const at = rowIndex ?? next.rows.length - 1;
  const width = Math.max(1, next.columnCount);
  const cells = Array.from({ length: width }, () => makeCell(''));
  next.rows.splice(at + 1, 0, makeRow(cells));
  if (next.columnCount === 0) {
    next.columnCount = 1;
    padRowsToWidth(next);
  }
  return { table: next, caret: { row: at + 1, cell: 0, offset: 0 } };
}

/** Add a new empty column after base column `colIndex` (defaults to last). */
export function addColumn(state: GridState, colIndex?: number): GridState {
  const next = clone(state.table);
  const at = colIndex ?? next.columnCount - 1;
  next.columnCount += 1;
  next.columnWidths.splice(at + 1, 0, DEFAULT_COL_WIDTH);
  for (const row of next.rows) {
    const idx = cellIndexAtColumn(row, Math.max(0, at));
    row.cells.splice(idx + 1, 0, makeCell(''));
  }
  return { table: next, caret: state.caret };
}

/** Delete an entire row. */
export function deleteRow(state: GridState, rowIndex: number): GridState {
  if (state.table.rows.length <= 1) return state;
  const next = clone(state.table);
  next.rows.splice(rowIndex, 1);
  if (next.headerRows > next.rows.length) next.headerRows = next.rows.length;
  recomputeWidth(next);
  const row = Math.min(rowIndex, next.rows.length - 1);
  return { table: next, caret: { row, cell: 0, offset: 0 } };
}

/** Delete an entire base column. */
export function deleteColumn(state: GridState, colIndex: number): GridState {
  if (state.table.columnCount <= 1) return state;
  const next = clone(state.table);
  for (const row of next.rows) {
    const idx = cellIndexAtColumn(row, colIndex);
    const cell = row.cells[idx]!;
    if (cell.colSpan > 1) cell.colSpan -= 1;
    else row.cells.splice(idx, 1);
  }
  next.columnCount -= 1;
  next.columnWidths.splice(colIndex, 1);
  recomputeWidth(next);
  return { table: next, caret: { ...state.caret, cell: 0, offset: 0 } };
}

/** Reorder a row from `from` to `to`. */
export function moveRow(table: MapTable, from: number, to: number): MapTable {
  const next = clone(table);
  if (from < 0 || from >= next.rows.length || to < 0 || to >= next.rows.length) return next;
  const [r] = next.rows.splice(from, 1);
  next.rows.splice(to, 0, r!);
  return next;
}

/** Reorder a base column from `from` to `to` (operates on unmerged grids). */
export function moveColumn(table: MapTable, from: number, to: number): MapTable {
  const next = clone(table);
  if (from < 0 || from >= next.columnCount || to < 0 || to >= next.columnCount) return next;
  const [w] = next.columnWidths.splice(from, 1);
  next.columnWidths.splice(to, 0, w ?? DEFAULT_COL_WIDTH);
  for (const row of next.rows) {
    // Only safe for fully-unmerged rows; merged cells are left in place.
    if (row.cells.length !== next.columnCount) continue;
    const [c] = row.cells.splice(from, 1);
    row.cells.splice(to, 0, c!);
  }
  return next;
}

export function setColumnWidth(table: MapTable, col: number, width: number): MapTable {
  const next = clone(table);
  if (col < 0 || col >= next.columnWidths.length) return next;
  next.columnWidths[col] = Math.max(40, width);
  return next;
}

export function setRowHeight(table: MapTable, row: number, height: number): MapTable {
  const next = clone(table);
  const r = next.rows[row];
  if (!r) return next;
  r.height = Math.max(24, height);
  return next;
}
