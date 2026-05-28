'use client';

import * as React from 'react';
import { cn } from '@/lib/bytes/utils';
import type { AnalysisModel } from '@/lib/card-sort/analysis';
import { ViewHeader } from './view-header';

export function StandardizationGridView({ model }: { model: AnalysisModel }) {
  const total = model.totalParticipants;
  const rows = React.useMemo(
    () => [...model.grid].sort((a, b) => b.total - a.total || a.card.label.localeCompare(b.card.label)),
    [model.grid],
  );

  return (
    <div className="flex flex-col gap-4">
      <ViewHeader
        title="Standardization grid"
        description="How many of each card's placements fall inside a standardized category versus categories that haven't been merged yet."
        help="Standardize categories on the Categories tab to move placements from the “Not standardized” column into “Standardized”."
      />

      <div className="text-fg3 flex items-center gap-2 text-sm">
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
          Total participants
        </span>
        <span className="text-fg1 font-mono text-sm font-bold tabular-nums">{total}</span>
      </div>

      <div className="border-separator1 bg-bg1 overflow-hidden rounded-lg border">
        <div className="text-fg3 border-b-separator1 grid grid-cols-[minmax(160px,2fr)_1fr_110px_110px] items-center gap-3 border-b px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider">
          <span>Card</span>
          <span>Coverage</span>
          <span className="text-right">Standardized</span>
          <span className="text-right">Not standardized</span>
        </div>
        <div className="divide-separator1 divide-y">
          {rows.map((r) => {
            const stdPct = r.total > 0 ? (r.standardizedCount / r.total) * 100 : 0;
            const notPct = r.total > 0 ? (r.notStandardizedCount / r.total) * 100 : 0;
            return (
              <div
                key={r.card.id}
                className="grid grid-cols-[minmax(160px,2fr)_1fr_110px_110px] items-center gap-3 px-4 py-2.5"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="text-fg0 truncate text-sm font-medium">{r.card.label}</span>
                  {r.card.context && (
                    <span className="text-fg4 font-mono text-[10px] uppercase tracking-wider">
                      {r.card.context}
                    </span>
                  )}
                </div>
                <div className="bg-bg2 relative flex h-2.5 w-full overflow-hidden rounded">
                  <div className="bg-fgAccent1 h-full" style={{ width: `${stdPct}%` }} />
                  <div className="bg-fg4/40 h-full" style={{ width: `${notPct}%` }} />
                </div>
                <div
                  className={cn(
                    'text-right font-mono text-sm tabular-nums',
                    r.standardizedCount > 0 ? 'text-fgAccent1' : 'text-fg4',
                  )}
                >
                  {r.standardizedCount}
                </div>
                <div className="text-fg1 text-right font-mono text-sm tabular-nums">
                  {r.notStandardizedCount}
                </div>
              </div>
            );
          })}
          {rows.length === 0 && (
            <div className="text-fg4 px-4 py-8 text-center text-sm">No cards in this study.</div>
          )}
        </div>
        <div className="border-t-separator1 text-fg4 flex items-center gap-4 border-t px-4 py-2 text-xs">
          <span className="inline-flex items-center gap-1.5">
            <span className="bg-fgAccent1 h-2 w-2 rounded-sm" /> Standardized
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="bg-fg4/40 h-2 w-2 rounded-sm" /> Not standardized
          </span>
        </div>
      </div>
    </div>
  );
}
