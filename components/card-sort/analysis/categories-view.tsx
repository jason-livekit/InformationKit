'use client';

import * as React from 'react';
import { cn } from '@/lib/bytes/utils';
import { Button } from '@/components/bytes/Button';
import { Checkbox } from '@/components/bytes/Checkbox';
import { Input } from '@/components/bytes/Input';
import { LayersTwoIcon, LockIcon, PencilIcon } from '@/icons/react';
import type { AnalysisModel, CategoryRow } from '@/lib/card-sort/analysis';
import { ViewHeader } from './view-header';

interface CategoriesViewProps {
  model: AnalysisModel;
  busy: boolean;
  onStandardize: (labels: string[], name: string) => void;
  onUnstandardize: (ids: string[]) => void;
  onRename: (id: string, name: string) => void;
}

/**
 * The Categories view. Raw rows are one-per-participant-category; selecting two
 * or more and clicking Standardize merges their labels into a single named
 * canonical category. Standardized rows can be renamed or unstandardized.
 */
export function CategoriesView({
  model,
  busy,
  onStandardize,
  onUnstandardize,
  onRename,
}: CategoriesViewProps) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [renaming, setRenaming] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState('');

  const rows = model.categoryRows;
  const rowById = React.useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);

  // Drop selections that no longer exist after a recompute.
  React.useEffect(() => {
    setSelected((prev) => {
      const next = new Set([...prev].filter((id) => rowById.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [rowById]);

  const selectedRows = [...selected].map((id) => rowById.get(id)!).filter(Boolean);
  const canStandardize = selectedRows.length >= 1;
  const canUnstandardize = selectedRows.some((r) => r.standardized);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function standardizeSelected() {
    const labels = [...new Set(selectedRows.flatMap((r) => r.labels))];
    // Default name = the most common constituent name among the selection.
    const name = suggestName(selectedRows);
    onStandardize(labels, name);
    setSelected(new Set());
  }

  function unstandardizeSelected() {
    const ids = selectedRows.filter((r) => r.standardized).map((r) => r.id);
    onUnstandardize(ids);
    setSelected(new Set());
  }

  function commitRename(id: string) {
    if (renameValue.trim()) onRename(id, renameValue.trim());
    setRenaming(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <ViewHeader
        title="Categories"
        description="Every category participants created and the cards inside it. Merge categories that mean the same thing with Standardize."
        help="Select rows, then Standardize to merge differently-worded categories into one canonical category. Standardization is saved with the study and applied across all views."
      />

      <div className="border-separator1 bg-bg2/40 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2">
        <Button
          variant="primary"
          size="sm"
          leftIcon={<LayersTwoIcon />}
          disabled={!canStandardize || busy}
          onClick={standardizeSelected}
        >
          Standardize{selectedRows.length > 0 ? ` (${selectedRows.length})` : ''}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={!canUnstandardize || busy}
          onClick={unstandardizeSelected}
        >
          Unstandardize
        </Button>
        <span className="text-fg4 ml-1 text-xs">
          {model.standardizedCategoryCount > 0
            ? `${model.standardizedCategoryCount} standardized categor${model.standardizedCategoryCount === 1 ? 'y' : 'ies'}`
            : 'Select categories to merge them'}
        </span>
      </div>

      <div className="border-separator1 bg-bg1 overflow-hidden rounded-lg border">
        <div className="text-fg3 border-b-separator1 grid grid-cols-[28px_minmax(160px,1.3fr)_minmax(220px,2fr)_92px_84px] items-center gap-3 border-b px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider">
          <span />
          <span>Category</span>
          <span>Cards</span>
          <span className="text-right">Participants</span>
          <span className="text-right">Agreement</span>
        </div>
        <div className="divide-separator1 divide-y">
          {rows.map((r) => {
            const isSel = selected.has(r.id);
            return (
              <div
                key={r.id}
                className={cn(
                  'grid grid-cols-[28px_minmax(160px,1.3fr)_minmax(220px,2fr)_92px_84px] items-start gap-3 px-4 py-3 transition-colors',
                  isSel && 'bg-bgAccent1/40',
                )}
              >
                <div className="pt-0.5">
                  <Checkbox checked={isSel} onCheckedChange={() => toggle(r.id)} disabled={busy} />
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  {renaming === r.id ? (
                    <Input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => commitRename(r.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename(r.id);
                        if (e.key === 'Escape') setRenaming(null);
                      }}
                      className="h-7 text-sm"
                    />
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {r.standardized && <LockIcon className="text-fgAccent1 h-3 w-3 shrink-0" />}
                      <span className="text-fg0 truncate text-sm font-medium capitalize">{r.name}</span>
                      {r.standardized && (
                        <button
                          type="button"
                          className="text-fg4 hover:text-fg1"
                          onClick={() => {
                            setRenaming(r.id);
                            setRenameValue(r.name);
                          }}
                          aria-label="Rename category"
                        >
                          <PencilIcon className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  )}
                  <span className="text-fg4 font-mono text-[10px] uppercase tracking-wider">
                    {r.standardized ? 'standardized · ' : ''}
                    {r.cardCount} card{r.cardCount === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {r.cards.map((m) => (
                    <span
                      key={m.card.id}
                      className="border-separator1 bg-bg2 text-fg2 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px]"
                      title={`${m.frequency} participant(s), avg position ${m.avgPosition}`}
                    >
                      <span className="truncate">{m.card.label}</span>
                      <span className="font-mono text-[9px] font-bold tabular-nums opacity-70">
                        {m.frequency}× · {m.avgPosition}
                      </span>
                    </span>
                  ))}
                </div>
                <div className="text-fg1 text-right font-mono text-sm tabular-nums">
                  {r.participantCount}
                </div>
                <div className="text-right">
                  <AgreementPill value={r.agreement} />
                </div>
              </div>
            );
          })}
          {rows.length === 0 && (
            <div className="text-fg4 px-4 py-8 text-center text-sm">
              No categories yet — participants haven’t created any.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AgreementPill({ value }: { value: number | null }) {
  if (value === null)
    return <span className="text-fg4 font-mono text-[10px] font-bold uppercase">—</span>;
  const pct = Math.round(value * 100);
  return (
    <span
      className="border-separator1 bg-bg2 text-fg2 inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold tabular-nums"
      style={{ opacity: 0.5 + value * 0.5 }}
    >
      {pct}%
    </span>
  );
}

function suggestName(rows: CategoryRow[]): string {
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.name, (counts.get(r.name) ?? 0) + r.participantCount);
  let best = rows[0]?.name ?? 'Category';
  let bestN = -1;
  for (const [name, n] of counts) {
    if (n > bestN) {
      bestN = n;
      best = name;
    }
  }
  return best;
}
