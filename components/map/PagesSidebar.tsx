'use client';

import * as React from 'react';
import { cn } from '@/lib/bytes/utils';
import { CirclePlusIcon, MagnifyingGlassIcon, MapIcon } from '@/icons/react';
import { useMap, useMapApi } from './useMapStore';

export function PagesSidebar() {
  const api = useMapApi();
  const pages = useMap((s) => s.doc.pages);
  const activePageId = useMap((s) => s.activePageId);
  const activeTable = useMap((s) => s.activePage().table);
  const [renaming, setRenaming] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');
  const [matchIdx, setMatchIdx] = React.useState(0);

  const matches = React.useMemo(() => {
    if (!query.trim()) return [] as Array<{ row: number; cell: number }>;
    const q = query.toLowerCase();
    const out: Array<{ row: number; cell: number }> = [];
    activeTable.rows.forEach((row, r) =>
      row.cells.forEach((cell, c) => {
        if (cell.text.toLowerCase().includes(q)) out.push({ row: r, cell: c });
      }),
    );
    return out;
  }, [query, activeTable]);

  function gotoMatch(i: number) {
    if (matches.length === 0) return;
    const idx = ((i % matches.length) + matches.length) % matches.length;
    setMatchIdx(idx);
    const m = matches[idx]!;
    api.getState().focusCell(m.row, m.cell);
  }

  return (
    <aside className="border-separator1 bg-bg1 flex w-60 shrink-0 flex-col border-r">
      <div className="border-separator1 flex items-center gap-2 border-b px-3 py-2.5">
        <MapIcon className="text-fgAccent1 h-4 w-4" />
        <span className="text-fg1 text-xs font-semibold uppercase tracking-wider">Pages</span>
        <button
          type="button"
          onClick={() => api.getState().addPage()}
          title="Add page"
          className="text-fg3 hover:text-fg1 ml-auto"
        >
          <CirclePlusIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {pages.map((p, i) => (
          <div
            key={p.id}
            onClick={() => api.getState().setActivePage(p.id)}
            className={cn(
              'group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm',
              p.id === activePageId ? 'bg-bg3 text-fg0' : 'text-fg2 hover:bg-bg2',
            )}
          >
            <span className="text-fg4 font-mono text-[10px]">{i + 1}</span>
            {renaming === p.id ? (
              <input
                autoFocus
                defaultValue={p.name}
                onBlur={(e) => {
                  api.getState().renamePage(p.id, e.target.value.trim() || p.name);
                  setRenaming(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  if (e.key === 'Escape') setRenaming(null);
                }}
                className="bg-bg0 border-separator1 min-w-0 flex-1 rounded border px-1 text-sm outline-none"
              />
            ) : (
              <span
                className="min-w-0 flex-1 truncate"
                onDoubleClick={() => setRenaming(p.id)}
              >
                {p.name}
              </span>
            )}
            {pages.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  api.getState().deletePage(p.id);
                }}
                className="text-fg4 hover:text-fgSerious1 opacity-0 group-hover:opacity-100"
                title="Delete page"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Find on page */}
      <div className="border-separator1 border-t p-2">
        <div className="bg-bg0 border-separator1 flex items-center gap-2 rounded-md border px-2 py-1.5">
          <MagnifyingGlassIcon className="text-fg4 h-3.5 w-3.5" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setMatchIdx(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') gotoMatch(matchIdx + (e.shiftKey ? -1 : 1));
            }}
            placeholder="Find on page"
            className="text-fg1 min-w-0 flex-1 bg-transparent text-xs outline-none"
          />
        </div>
        {query.trim() && (
          <div className="text-fg4 mt-1.5 flex items-center justify-between px-1 text-[10px]">
            <span>
              {matches.length === 0 ? 'No matches' : `${matchIdx + 1} of ${matches.length}`}
            </span>
            <span className="flex gap-1">
              <button type="button" onClick={() => gotoMatch(matchIdx - 1)} className="hover:text-fg1">
                ↑
              </button>
              <button type="button" onClick={() => gotoMatch(matchIdx + 1)} className="hover:text-fg1">
                ↓
              </button>
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
