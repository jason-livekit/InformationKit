'use client';

import * as React from 'react';
import { cn } from '@/lib/bytes/utils';
import { Input } from '@/components/bytes/Input';
import type { AnalysisModel } from '@/lib/card-sort/analysis';
import { ViewHeader } from './view-header';

export function CardsView({ model }: { model: AnalysisModel }) {
  const [q, setQ] = React.useState('');
  const rows = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return model.cardRows;
    return model.cardRows.filter(
      (r) =>
        r.card.label.toLowerCase().includes(needle) ||
        r.categories.some((c) => c.name.toLowerCase().includes(needle)),
    );
  }, [model.cardRows, q]);

  return (
    <div className="flex flex-col gap-4">
      <ViewHeader
        title="Cards"
        description="For each card, the categories participants sorted it into, how often, and where in the category it landed."
        help="Frequency = participants who placed the card. Position = its average 1-based rank within a category (1 = sorted first)."
      >
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search cards…"
          className="h-7 w-44 text-xs"
        />
      </ViewHeader>

      <div className="border-separator1 bg-bg1 overflow-hidden rounded-lg border">
        <div className="text-fg3 border-b-separator1 grid grid-cols-[minmax(160px,1.4fr)_minmax(220px,2fr)_88px_88px] items-center gap-3 border-b px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider">
          <span>Card</span>
          <span>Sorted into</span>
          <span className="text-right">Frequency</span>
          <span className="text-right">Avg pos</span>
        </div>
        <div className="divide-separator1 divide-y">
          {rows.map((r) => (
            <div
              key={r.card.id}
              className="grid grid-cols-[minmax(160px,1.4fr)_minmax(220px,2fr)_88px_88px] items-start gap-3 px-4 py-3"
            >
              <div className="flex min-w-0 flex-col">
                <span className="text-fg0 truncate text-sm font-medium">{r.card.label}</span>
                <span className="text-fg4 font-mono text-[10px] uppercase tracking-wider">
                  {r.categoryCount} categor{r.categoryCount === 1 ? 'y' : 'ies'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {r.categories.length === 0 ? (
                  <span className="text-fg4 text-xs italic">never sorted</span>
                ) : (
                  r.categories.map((c) => (
                    <span
                      key={c.categoryId}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px]',
                        c.standardized
                          ? 'border-separatorAccent bg-bgAccent1 text-fgAccent1'
                          : 'border-separator1 bg-bg2 text-fg2',
                      )}
                      title={`${c.frequency} participant(s), avg position ${c.avgPosition}`}
                    >
                      <span className="capitalize">{c.name}</span>
                      <span className="font-mono text-[9px] font-bold tabular-nums opacity-70">
                        {c.frequency}× · {c.avgPosition}
                      </span>
                    </span>
                  ))
                )}
              </div>
              <div className="text-fg1 text-right font-mono text-sm tabular-nums">{r.frequency}</div>
              <div className="text-fg1 text-right font-mono text-sm tabular-nums">
                {r.avgPosition || '—'}
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="text-fg4 px-4 py-8 text-center text-sm">No cards match “{q}”.</div>
          )}
        </div>
      </div>
    </div>
  );
}
