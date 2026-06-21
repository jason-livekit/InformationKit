'use client';

import * as React from 'react';
import { create, useStore } from 'zustand';
import type { MapDoc, MapPage, MapTable, MapTextSize } from '@/lib/repo/schemas';
import { cascadeHue } from './colors';
import {
  type Caret,
  type GridState,
  cellRanges,
  makeRow,
  makeCell,
} from './grid';
import { makeEmptyPageClient } from './page-utils';

export type Selection =
  | { kind: 'none' }
  | { kind: 'table' }
  | { kind: 'row'; row: number }
  | { kind: 'column'; col: number }
  | { kind: 'cell'; row: number; cell: number };

export type Mark = 'bold' | 'italic' | 'strike' | 'mono';
type SaveState = 'idle' | 'saving' | 'saved';

interface FocusTarget {
  row: number;
  cell: number;
  nonce: number;
}

interface MapStore {
  mapId: string;
  doc: MapDoc;
  activePageId: string;
  saveState: SaveState;
  selection: Selection;
  caret: Caret | null;
  /** true while the caret cell is being typed into (vs. cell-selection mode). */
  editing: boolean;
  focusTarget: FocusTarget | null;

  past: MapPage[][];
  future: MapPage[][];

  // selectors
  activePage: () => MapPage;
  activeTable: () => MapTable;

  // doc-level
  setName: (name: string) => void;
  setPublished: (published: boolean) => void;
  setActivePage: (id: string) => void;
  addPage: () => void;
  renamePage: (id: string, name: string) => void;
  deletePage: (id: string) => void;
  reorderPages: (from: number, to: number) => void;

  // table editing
  applyGrid: (next: GridState) => void;
  replaceTable: (table: MapTable, caret?: Caret | null) => void;
  setCaret: (caret: Caret | null) => void;
  setEditing: (editing: boolean) => void;
  select: (sel: Selection) => void;
  focusCell: (row: number, cell: number) => void;

  // styling
  applyHue: (hue: number | null) => void;
  toggleMark: (mark: Mark) => void;
  setAlign: (align: 'left' | 'center' | 'right') => void;
  setTextSize: (size: MapTextSize) => void;

  // history + persistence
  undo: () => void;
  redo: () => void;
  save: () => void;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function createMapStore(initial: MapDoc) {
  return create<MapStore>((set, get) => {
    function commitPages(pages: MapPage[], opts?: { history?: boolean }) {
      const { doc } = get();
      const past = opts?.history === false ? get().past : [...get().past, doc.pages];
      set({
        doc: { ...doc, pages },
        past: past.slice(-100),
        future: [],
      });
      scheduleSave();
    }

    function scheduleSave() {
      set({ saveState: 'saving' });
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => void get().save(), 600);
    }

    function updateActiveTable(updater: (t: MapTable) => MapTable) {
      const { doc, activePageId } = get();
      const pages = doc.pages.map((p) =>
        p.id === activePageId ? { ...p, table: updater(p.table) } : p,
      );
      commitPages(pages);
    }

    return {
      mapId: initial.id,
      doc: initial,
      activePageId: initial.pages[0]?.id ?? '',
      saveState: 'idle',
      selection: { kind: 'none' },
      caret: null,
      editing: false,
      focusTarget: null,
      past: [],
      future: [],

      activePage: () => {
        const { doc, activePageId } = get();
        return doc.pages.find((p) => p.id === activePageId) ?? doc.pages[0]!;
      },
      activeTable: () => get().activePage().table,

      setName: (name) => {
        set({ doc: { ...get().doc, name } });
        scheduleSave();
      },
      setPublished: (published) => {
        set({ doc: { ...get().doc, published } });
        scheduleSave();
      },
      setActivePage: (id) =>
        set({ activePageId: id, selection: { kind: 'none' }, caret: null, editing: false }),
      addPage: () => {
        const page = makeEmptyPageClient(`Page ${get().doc.pages.length + 1}`);
        commitPages([...get().doc.pages, page]);
        set({ activePageId: page.id });
      },
      renamePage: (id, name) => {
        commitPages(get().doc.pages.map((p) => (p.id === id ? { ...p, name } : p)));
      },
      deletePage: (id) => {
        const { doc } = get();
        if (doc.pages.length <= 1) return;
        const pages = doc.pages.filter((p) => p.id !== id);
        commitPages(pages);
        if (get().activePageId === id) set({ activePageId: pages[0]!.id });
      },
      reorderPages: (from, to) => {
        const pages = [...get().doc.pages];
        if (from < 0 || to < 0 || from >= pages.length || to >= pages.length) return;
        const [p] = pages.splice(from, 1);
        pages.splice(to, 0, p!);
        commitPages(pages);
      },

      applyGrid: (next) => {
        updateActiveTable(() => next.table);
        set({ caret: next.caret });
      },
      replaceTable: (table, caret) => {
        updateActiveTable(() => table);
        if (caret !== undefined) set({ caret });
      },
      setCaret: (caret) => set({ caret }),
      setEditing: (editing) => set({ editing }),
      select: (selection) => set({ selection }),
      focusCell: (row, cell) =>
        set({ focusTarget: { row, cell, nonce: Date.now() } }),

      applyHue: (hue) => {
        const { selection } = get();
        updateActiveTable((t) => {
          if (selection.kind === 'cell') return cascadeHue(t, selection.row, selection.cell, hue);
          if (selection.kind === 'row') {
            // apply to each cell's column group on that row
            let table = t;
            const row = t.rows[selection.row];
            if (row) {
              for (let i = 0; i < row.cells.length; i++) {
                table = cascadeHue(table, selection.row, i, hue);
              }
            }
            return table;
          }
          if (selection.kind === 'column') {
            return cascadeHueColumn(t, selection.col, hue);
          }
          if (selection.kind === 'table') {
            return {
              ...t,
              rows: t.rows.map((r) => ({ ...r, cells: r.cells.map((c) => ({ ...c, hue })) })),
            };
          }
          return t;
        });
      },
      toggleMark: (mark) => {
        const { selection } = get();
        updateActiveTable((t) => applyMark(t, selection, mark));
      },
      setAlign: (align) => {
        const { selection } = get();
        updateActiveTable((t) => mapSelectedCells(t, selection, (c) => ({ ...c, align })));
      },
      setTextSize: (size) => {
        updateActiveTable((t) => ({ ...t, textSize: size }));
      },

      undo: () => {
        const { past, doc, future } = get();
        if (past.length === 0) return;
        const prev = past[past.length - 1]!;
        set({
          doc: { ...doc, pages: prev },
          past: past.slice(0, -1),
          future: [doc.pages, ...future],
        });
        scheduleSave();
      },
      redo: () => {
        const { future, doc, past } = get();
        if (future.length === 0) return;
        const nextPages = future[0]!;
        set({
          doc: { ...doc, pages: nextPages },
          future: future.slice(1),
          past: [...past, doc.pages],
        });
        scheduleSave();
      },

      save: async () => {
        const { mapId, doc } = get();
        try {
          const res = await fetch(`/api/maps/${mapId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: doc.name, published: doc.published, pages: doc.pages }),
          });
          set({ saveState: res.ok ? 'saved' : 'idle' });
        } catch {
          set({ saveState: 'idle' });
        }
        setTimeout(() => {
          if (get().saveState === 'saved') set({ saveState: 'idle' });
        }, 1500);
      },
    };
  });
}

// ---------------------------------------------------------------------------
// pure helpers used by the store
// ---------------------------------------------------------------------------

function cascadeHueColumn(t: MapTable, col: number, hue: number | null): MapTable {
  // Find a cell on any row covering this column and cascade from there.
  for (let r = 0; r < t.rows.length; r++) {
    const ranges = cellRanges(t.rows[r]!);
    const idx = ranges.findIndex((rg) => col >= rg.start && col < rg.end);
    if (idx >= 0) return cascadeHue(t, r, idx, hue);
  }
  return t;
}

function mapSelectedCells(
  t: MapTable,
  sel: Selection,
  fn: (c: MapTable['rows'][number]['cells'][number]) => MapTable['rows'][number]['cells'][number],
): MapTable {
  return {
    ...t,
    rows: t.rows.map((row, r) => {
      const ranges = cellRanges(row);
      return {
        ...row,
        cells: row.cells.map((cell, i) => {
          const inSel =
            sel.kind === 'table' ||
            (sel.kind === 'row' && sel.row === r) ||
            (sel.kind === 'cell' && sel.row === r && sel.cell === i) ||
            (sel.kind === 'column' && col_in(ranges[i]!, sel.col));
          return inSel ? fn(cell) : cell;
        }),
      };
    }),
  };
}

function col_in(range: { start: number; end: number }, col: number): boolean {
  return col >= range.start && col < range.end;
}

function applyMark(t: MapTable, sel: Selection, mark: Mark): MapTable {
  // Determine the new boolean by toggling the first selected cell.
  let target: boolean | null = null;
  const read = (c: MapTable['rows'][number]['cells'][number]) =>
    mark === 'mono' ? !!c.mono : (c[mark] as boolean);
  mapSelectedCells(t, sel, (c) => {
    if (target === null) target = !read(c);
    return c;
  });
  if (target === null) return t;
  const value = target as boolean;
  return mapSelectedCells(t, sel, (c) =>
    mark === 'mono' ? { ...c, mono: value } : { ...c, [mark]: value },
  );
}

// Re-export construction helpers for convenience to keep imports tidy.
export { makeRow, makeCell };

// ---------------------------------------------------------------------------
// React context wiring
// ---------------------------------------------------------------------------

export type MapStoreApi = ReturnType<typeof createMapStore>;

const MapStoreContext = React.createContext<MapStoreApi | null>(null);

export function MapStoreProvider({
  initial,
  children,
}: {
  initial: MapDoc;
  children: React.ReactNode;
}) {
  const storeRef = React.useRef<MapStoreApi | null>(null);
  if (!storeRef.current) storeRef.current = createMapStore(initial);
  return <MapStoreContext.Provider value={storeRef.current}>{children}</MapStoreContext.Provider>;
}

export function useMap<T>(selector: (s: MapStore) => T): T {
  const store = React.useContext(MapStoreContext);
  if (!store) throw new Error('useMap must be used within MapStoreProvider');
  return useStore(store, selector);
}

export function useMapApi(): MapStoreApi {
  const store = React.useContext(MapStoreContext);
  if (!store) throw new Error('useMapApi must be used within MapStoreProvider');
  return store;
}
