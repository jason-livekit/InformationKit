'use client';

import * as React from 'react';
import { cn } from '@/lib/bytes/utils';
import type { AnalysisModel } from '@/lib/card-sort/analysis';
import { ArrowBottomTopSolidIcon } from '@/icons/react';
import { ViewHeader } from './view-header';

type SortDir = 'asc' | 'desc';

function heatmapStyle(count: number, max: number): React.CSSProperties {
  if (count === 0) return { backgroundColor: 'var(--color-bg1)' };
  const intensity = count / max;
  return {
    backgroundColor: `color-mix(in srgb, var(--color-fgAccent1) ${Math.round(12 + intensity * 88)}%, var(--color-bg1))`,
  };
}

function cellTextClass(count: number, max: number): string {
  if (count === 0) return 'text-fg4';
  return count / max >= 0.45 ? 'text-bg1' : 'text-fg1';
}

export function StandardizationGridView({ model }: { model: AnalysisModel }) {
  const { columns, rows, maxCount } = model.grid;
  const total = model.totalParticipants;

  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<SortDir>('desc');

  const sortedRows = React.useMemo(() => {
    const list = [...rows];
    if (!sortColumn) {
      return list.sort(
        (a, b) => b.total - a.total || a.card.label.localeCompare(b.card.label),
      );
    }
    const dir = sortDir === 'desc' ? -1 : 1;
    if (sortColumn === '__name__') {
      return list.sort((a, b) => a.card.label.localeCompare(b.card.label) * dir);
    }
    return list.sort((a, b) => {
      const av = a.countsByColumn[sortColumn] ?? 0;
      const bv = b.countsByColumn[sortColumn] ?? 0;
      return (av - bv) * dir || a.card.label.localeCompare(b.card.label);
    });
  }, [rows, sortColumn, sortDir]);

  function onSortColumn(columnId: string) {
    if (sortColumn === columnId) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortColumn(columnId);
      setSortDir('desc');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <ViewHeader
        title="Standardization grid"
        description="How many participants placed each card in each standardized category. Darker cells mean more agreement."
        help="Standardize categories on the Categories tab to add columns. Placements in unmerged categories appear under “Not standardized”."
      />

      <div className="text-fg3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
          Total participants
        </span>
        <div className="flex items-center gap-2">
          <span className="text-fg4 font-mono text-[10px] tabular-nums">0</span>
          <div
            className="h-2 w-40 overflow-hidden rounded"
            style={{
              background: `linear-gradient(to right, var(--color-bg1), color-mix(in srgb, var(--color-fgAccent1) 88%, var(--color-bg1)))`,
            }}
            aria-hidden
          />
          <span className="text-fg1 font-mono text-sm font-bold tabular-nums">{total}</span>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="border-separator1 text-fg4 rounded-lg border border-dashed px-4 py-8 text-center text-sm">
          No cards in this study.
        </div>
      ) : (
        <div className="border-separator1 bg-bg1 overflow-auto rounded-lg border">
          <table className="w-full min-w-max border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="bg-bg1 border-b-separator1 border-r-separator1 sticky left-0 z-10 min-w-[160px] border-b border-r px-4 py-2 text-left">
                  <button
                    type="button"
                    className="text-fg3 hover:text-fg1 inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider"
                    onClick={() => onSortColumn('__name__')}
                  >
                    Name
                    <SortIcon active={sortColumn === '__name__'} dir={sortDir} />
                  </button>
                </th>
                {columns.map((col) => (
                  <th
                    key={col.id}
                    className="border-b-separator1 border-b px-2 py-2 text-center"
                    style={{ minWidth: 72 }}
                  >
                    <button
                      type="button"
                      className="text-fg3 hover:text-fg1 inline-flex max-w-full items-center justify-center gap-0.5 font-mono text-[10px] font-bold uppercase tracking-wider"
                      onClick={() => onSortColumn(col.id)}
                      title={col.name}
                    >
                      <span className="truncate">{col.name}</span>
                      <SortIcon active={sortColumn === col.id} dir={sortDir} />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row, rowIdx) => (
                <tr key={row.card.id}>
                  <th
                    className={cn(
                      'bg-bg1 border-r-separator1 sticky left-0 z-10 border-r px-4 py-1.5 text-left',
                      rowIdx < sortedRows.length - 1 && 'border-b-separator1 border-b',
                    )}
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="text-fg0 truncate text-sm font-medium">{row.card.label}</span>
                      {row.card.context && (
                        <span className="text-fg4 font-mono text-[10px] uppercase tracking-wider">
                          {row.card.context}
                        </span>
                      )}
                    </div>
                  </th>
                  {columns.map((col) => {
                    const count = row.countsByColumn[col.id] ?? 0;
                    return (
                      <td
                        key={col.id}
                        className={cn(
                          'p-0 text-center',
                          rowIdx < sortedRows.length - 1 && 'border-b-separator1 border-b',
                        )}
                        title={
                          count === 0
                            ? `${row.card.label} · ${col.name}: no placements`
                            : `${row.card.label} · ${col.name}: ${count} of ${total} participant${total === 1 ? '' : 's'}`
                        }
                      >
                        <div
                          className={cn(
                            'flex h-9 min-w-[3rem] items-center justify-center font-mono text-sm font-bold tabular-nums',
                            cellTextClass(count, maxCount),
                          )}
                          style={heatmapStyle(count, maxCount)}
                        >
                          {count > 0 ? count : ''}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <ArrowBottomTopSolidIcon
      className={cn(
        'h-3 w-3 shrink-0 opacity-40',
        active && 'text-fgAccent1 opacity-100',
        active && dir === 'asc' && 'rotate-180',
      )}
    />
  );
}
