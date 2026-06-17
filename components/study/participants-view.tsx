'use client';

import * as React from 'react';
import type { Study, Submission } from '@/lib/repo/schemas';
import { cn } from '@/lib/bytes/utils';
import { Badge } from '@/components/bytes/Badge';
import { Button } from '@/components/bytes/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/bytes/Dialog';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleMinusIcon,
  CirclePlusIcon,
} from '@/icons/react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/bytes/Table';

// Fixed locale + UTC keep server-rendered and client-rendered timestamps identical
// (no hydration mismatch) and stable regardless of where the app runs.
const dateFmt = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});
const dateTimeFmt = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'UTC',
});

export interface ParticipantRow {
  submission: Submission;
  /** 0-based position in submission order. */
  index: number;
  label: string;
  cardsSorted: number;
  totalCards: number;
  sortedPct: number;
  categoriesCreated: number;
  notUseful: number;
  excluded: boolean;
}

function buildRows(
  submissions: Submission[],
  excludedIds: Set<string>,
  totalCards: number,
): ParticipantRow[] {
  return [...submissions]
    .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id))
    .map((submission, index) => {
      const sorted = new Set<string>();
      for (const group of submission.groups) {
        for (const cardId of group.cardIds) sorted.add(cardId);
      }
      const cardsSorted = sorted.size;
      return {
        submission,
        index,
        label: `Participant ${index + 1}`,
        cardsSorted,
        totalCards,
        sortedPct: totalCards ? Math.round((cardsSorted / totalCards) * 100) : 0,
        categoriesCreated: submission.groups.length,
        notUseful: submission.notUseful.length,
        excluded: excludedIds.has(submission.id),
      };
    });
}

type Filter = 'all' | 'included' | 'excluded';

interface ParticipantsViewProps {
  study: Study;
  /** Every submission (included and excluded). */
  submissions: Submission[];
  excludedIds: Set<string>;
  busy: boolean;
  onToggleExclude: (id: string) => void;
}

export function ParticipantsView({
  study,
  submissions,
  excludedIds,
  busy,
  onToggleExclude,
}: ParticipantsViewProps) {
  const [filter, setFilter] = React.useState<Filter>('all');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const cardLabels = React.useMemo(
    () => new Map(study.cards.map((c) => [c.id, c.label])),
    [study.cards],
  );

  const rows = React.useMemo(
    () => buildRows(submissions, excludedIds, study.cards.length),
    [submissions, excludedIds, study.cards.length],
  );

  const includedCount = rows.length - excludedIds.size;
  const counts: Record<Filter, number> = {
    all: rows.length,
    included: includedCount,
    excluded: rows.length - includedCount,
  };

  const visibleRows = rows.filter((r) =>
    filter === 'all' ? true : filter === 'excluded' ? r.excluded : !r.excluded,
  );

  const selectedIndex = selectedId ? rows.findIndex((r) => r.submission.id === selectedId) : -1;
  const selected = selectedIndex >= 0 ? rows[selectedIndex] : null;

  if (rows.length === 0) {
    return (
      <div className="border-separator1 text-fg3 flex flex-col items-center gap-1 rounded-md border border-dashed px-6 py-12 text-center">
        <p className="text-fg1 text-sm font-semibold">No participants yet</p>
        <p className="text-xs">Responses will appear here as participants complete the study.</p>
      </div>
    );
  }

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'included', label: 'Included' },
    { key: 'excluded', label: 'Excluded' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="border-separator1 bg-bg1 inline-flex items-center gap-0.5 rounded-md border p-0.5">
          {FILTERS.map((f) => {
            const isActive = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold transition-colors',
                  isActive ? 'bg-bg3 text-fg0' : 'text-fg3 hover:text-fg1',
                )}
                aria-pressed={isActive}
              >
                {f.label}
                <span className="text-fg4 font-mono tabular-nums">{counts[f.key]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-separator1 overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Participant</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Cards sorted</TableHead>
              <TableHead className="text-right">Categories</TableHead>
              <TableHead className="text-right">Not useful</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((row) => (
              <TableRow key={row.submission.id} className="hover:bg-bg2/60">
                <TableCell className={cn('py-2.5', row.excluded && 'opacity-55')}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(row.submission.id)}
                    className="text-fgAccent1 hover:text-fgAccent2 font-semibold hover:underline"
                  >
                    {row.label}
                  </button>
                </TableCell>
                <TableCell className={cn('py-2.5', row.excluded && 'opacity-55')}>
                  {row.excluded ? (
                    <Badge variant="muted">Excluded</Badge>
                  ) : (
                    <Badge variant="success">Completed</Badge>
                  )}
                </TableCell>
                <TableCell className={cn('text-fg2 py-2.5', row.excluded && 'opacity-55')}>
                  {dateFmt.format(new Date(row.submission.createdAt))}
                </TableCell>
                <TableCell
                  className={cn(
                    'py-2.5 text-right font-mono tabular-nums',
                    row.excluded && 'opacity-55',
                  )}
                >
                  <span className="text-fg1">{row.sortedPct}%</span>{' '}
                  <span className="text-fg4 text-xs">
                    {row.cardsSorted}/{row.totalCards}
                  </span>
                </TableCell>
                <TableCell
                  className={cn(
                    'text-fg1 py-2.5 text-right font-mono tabular-nums',
                    row.excluded && 'opacity-55',
                  )}
                >
                  {row.categoriesCreated}
                </TableCell>
                <TableCell
                  className={cn(
                    'text-fg1 py-2.5 text-right font-mono tabular-nums',
                    row.excluded && 'opacity-55',
                  )}
                >
                  {row.notUseful}
                </TableCell>
                <TableCell className="py-2.5 text-right">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={busy}
                    leftIcon={row.excluded ? <CirclePlusIcon /> : <CircleMinusIcon />}
                    onClick={() => onToggleExclude(row.submission.id)}
                  >
                    {row.excluded ? 'Include' : 'Exclude'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {visibleRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-fg3 py-8 text-center text-sm">
                  No {filter} participants.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ParticipantDetailDialog
        row={selected}
        cardLabels={cardLabels}
        busy={busy}
        onToggleExclude={onToggleExclude}
        onClose={() => setSelectedId(null)}
        onPrev={() => {
          if (selectedIndex > 0) setSelectedId(rows[selectedIndex - 1]!.submission.id);
        }}
        onNext={() => {
          if (selectedIndex >= 0 && selectedIndex < rows.length - 1)
            setSelectedId(rows[selectedIndex + 1]!.submission.id);
        }}
        hasPrev={selectedIndex > 0}
        hasNext={selectedIndex >= 0 && selectedIndex < rows.length - 1}
      />
    </div>
  );
}

type DetailTab = 'details' | 'card-sort';

interface ParticipantDetailDialogProps {
  row: ParticipantRow | null;
  cardLabels: Map<string, string>;
  busy: boolean;
  onToggleExclude: (id: string) => void;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

function ParticipantDetailDialog({
  row,
  cardLabels,
  busy,
  onToggleExclude,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: ParticipantDetailDialogProps) {
  const [tab, setTab] = React.useState<DetailTab>('details');

  // Reset to the Details tab whenever a different participant is opened — keyed on
  // the id so toggling exclusion (which rebuilds `row`) doesn't reset the tab.
  React.useEffect(() => {
    if (row) setTab('details');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row?.submission.id]);

  const labelFor = (cardId: string) => cardLabels.get(cardId) ?? cardId;

  return (
    <Dialog open={!!row} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl gap-0">
        {row && (
          <>
            <DialogHeader>
              <DialogTitle>{row.label}</DialogTitle>
            </DialogHeader>

            <div className="border-separator1 flex gap-1 border-b px-6">
              {(
                [
                  { key: 'details', label: 'Details' },
                  { key: 'card-sort', label: 'Card sort' },
                ] as const
              ).map((t) => {
                const isActive = tab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className={cn(
                      '-mb-px border-b-2 px-2 py-2 text-sm font-semibold transition-colors',
                      isActive
                        ? 'text-fg0 border-b-fgAccent1'
                        : 'text-fg3 hover:text-fg1 border-b-transparent',
                    )}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            <div className="max-h-[55vh] overflow-y-auto px-6 py-4">
              {tab === 'details' ? (
                <dl className="flex flex-col gap-3">
                  <DetailRow label="Submitted">
                    {dateTimeFmt.format(new Date(row.submission.createdAt))}
                  </DetailRow>
                  <DetailRow label="Status">
                    {row.excluded ? (
                      <Badge variant="muted">Excluded</Badge>
                    ) : (
                      <Badge variant="success">Completed</Badge>
                    )}
                  </DetailRow>
                  <DetailRow label="Cards sorted">
                    {row.sortedPct}% ({row.cardsSorted} of {row.totalCards})
                  </DetailRow>
                  <DetailRow label="Categories created">{row.categoriesCreated}</DetailRow>
                  <DetailRow label="Cards marked not useful">{row.notUseful}</DetailRow>
                </dl>
              ) : (
                <div className="flex flex-col gap-3">
                  {row.submission.groups.length === 0 && (
                    <p className="text-fg3 text-sm">This participant didn&apos;t create any categories.</p>
                  )}
                  {row.submission.groups.map((group) => (
                    <div
                      key={group.id}
                      className="border-separator1 overflow-hidden rounded-md border"
                    >
                      <div className="bg-bg2 flex items-center justify-between gap-2 px-3 py-2">
                        <span className="text-fg0 text-sm font-semibold">
                          {group.label.trim() || 'Untitled category'}
                        </span>
                        <Badge variant="accent">{group.cardIds.length}</Badge>
                      </div>
                      <ul className="divide-separator1 divide-y">
                        {group.cardIds.map((cardId, i) => (
                          <li key={`${cardId}-${i}`} className="text-fg2 px-3 py-2 text-sm">
                            {labelFor(cardId)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {row.submission.notUseful.length > 0 && (
                    <div className="border-separator1 overflow-hidden rounded-md border border-dashed">
                      <div className="text-fg3 px-3 py-2 text-xs font-semibold uppercase tracking-wider">
                        Not useful
                      </div>
                      <ul className="divide-separator1 divide-y">
                        {row.submission.notUseful.map((cardId, i) => (
                          <li key={`${cardId}-${i}`} className="text-fg3 px-3 py-2 text-sm">
                            {labelFor(cardId)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-separator1 flex items-center justify-between gap-2 border-t px-6 py-4">
              <Button
                variant={row.excluded ? 'secondary' : 'destructive'}
                size="sm"
                disabled={busy}
                leftIcon={row.excluded ? <CirclePlusIcon /> : <CircleMinusIcon />}
                onClick={() => onToggleExclude(row.submission.id)}
              >
                {row.excluded ? 'Include in results' : 'Exclude from results'}
              </Button>
              <div className="flex items-center gap-1">
                <Button
                  variant="secondary"
                  size="icon"
                  disabled={!hasPrev}
                  onClick={onPrev}
                  aria-label="Previous participant"
                  leftIcon={<ChevronLeftIcon />}
                />
                <Button
                  variant="secondary"
                  size="icon"
                  disabled={!hasNext}
                  onClick={onNext}
                  aria-label="Next participant"
                  leftIcon={<ChevronRightIcon />}
                />
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-fg3 text-xs font-semibold uppercase tracking-wider">{label}</dt>
      <dd className="text-fg1 text-sm">{children}</dd>
    </div>
  );
}
