'use client';

import * as React from 'react';
import { cn } from '@/lib/bytes/utils';
import type { AnalysisModel } from '@/lib/card-sort/analysis';
import { DotFill } from './dot-fill';

interface ResultsDashboardProps {
  model: AnalysisModel;
  /** Raw not-useful counts — not part of the analysis model. */
  notUsefulByCard?: Record<string, number>;
}

export function ResultsDashboard({ model, notUsefulByCard = {} }: ResultsDashboardProps) {
  const totalSubmissions = model.totalParticipants;

  const sortedGroupNames = React.useMemo(
    () =>
      model.categoryRows
        .slice()
        .sort((a, b) => b.participantCount - a.participantCount)
        .slice(0, 12)
        .map((r) => r.name),
    [model.categoryRows],
  );

  if (totalSubmissions === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col gap-8">
      <SummaryCards
        totalSubmissions={totalSubmissions}
        groupCount={model.categoryRows.length}
        notUsefulByCard={notUsefulByCard}
      />

      <Section
        title="Group themes"
        description="Categories used in analysis, including any standardized merges you've defined."
      >
        <GroupThemes categories={model.categoryRows} totalSubmissions={totalSubmissions} />
      </Section>

      <Section
        title="Card placement"
        description="For each card, the share of users who put it in a popular group, left it ungrouped, or marked it as not useful."
      >
        <CardPlacementTable
          cardRows={model.cardRows}
          notUsefulByCard={notUsefulByCard}
          totalSubmissions={totalSubmissions}
          topCategoryNames={sortedGroupNames}
        />
      </Section>

      <Section
        title="Co-occurrence"
        description="How often two cards ended up in the same analytical category. Higher = stronger affinity."
      >
        <CoOccurrenceMatrix model={model} />
      </Section>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-fg0 font-display text-lg">{title}</h2>
        {description && <p className="text-fg3 text-sm">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function SummaryCards({
  totalSubmissions,
  groupCount,
  notUsefulByCard,
}: {
  totalSubmissions: number;
  groupCount: number;
  notUsefulByCard: Record<string, number>;
}) {
  const totalNotUseful = Object.values(notUsefulByCard).reduce((a, b) => a + b, 0);
  const avgNotUsefulPerSub = totalSubmissions > 0 ? totalNotUseful / totalSubmissions : 0;
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <Stat label="Submissions" value={String(totalSubmissions)} accent />
      <Stat label="Distinct group themes" value={String(groupCount)} />
      <Stat
        label="Avg. cards marked not useful"
        value={avgNotUsefulPerSub.toFixed(1)}
        tone="serious"
      />
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  tone,
}: {
  label: string;
  value: string;
  accent?: boolean;
  tone?: 'serious';
}) {
  return (
    <div
      className={cn(
        'border-separator1 bg-bg1 relative flex flex-col gap-1 overflow-hidden rounded-lg border p-4',
      )}
    >
      <DotFill
        tone={tone === 'serious' ? 'serious' : accent ? 'accent' : 'fg'}
        opacity={tone === 'serious' ? 0.18 : accent ? 0.18 : 0.08}
        spacing={5}
      />
      <span className="text-fg3 relative font-mono text-[10px] font-bold uppercase tracking-wider">
        {label}
      </span>
      <span
        className={cn(
          'relative font-display text-3xl tabular-nums',
          tone === 'serious' ? 'text-fgSerious1' : accent ? 'text-fgAccent1' : 'text-fg0',
        )}
      >
        {value}
      </span>
    </div>
  );
}

function GroupThemes({
  categories,
  totalSubmissions,
}: {
  categories: AnalysisModel['categoryRows'];
  totalSubmissions: number;
}) {
  const items = categories
    .slice()
    .sort((a, b) => b.participantCount - a.participantCount)
    .slice(0, 16)
    .map((c) => [c.name, c.participantCount] as const);

  if (items.length === 0) {
    return (
      <div className="border-separator1 text-fg3 rounded-md border border-dashed px-4 py-6 text-center text-sm">
        No groups have been created in submissions yet.
      </div>
    );
  }

  const max = items[0]?.[1] ?? 1;

  return (
    <div className="border-separator1 bg-bg1 grid grid-cols-1 gap-px overflow-hidden rounded-lg border md:grid-cols-2">
      {items.map(([name, count]) => {
        const pct = (count / max) * 100;
        const userPct = totalSubmissions > 0 ? (count / totalSubmissions) * 100 : 0;
        return (
          <div
            key={name}
            className="bg-bg1 relative flex flex-col gap-2 px-4 py-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-fg0 truncate text-sm font-medium capitalize">{name}</span>
              <span className="text-fg3 font-mono text-[10px] font-bold tabular-nums">
                {count} {count === 1 ? 'submission' : 'submissions'} · {userPct.toFixed(0)}%
              </span>
            </div>
            <div className="bg-bg2 relative h-2 w-full overflow-hidden rounded">
              <div
                className="bg-fgAccent1 absolute inset-y-0 left-0 rounded"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CardPlacementTable({
  cardRows,
  notUsefulByCard,
  totalSubmissions,
  topCategoryNames,
}: {
  cardRows: AnalysisModel['cardRows'];
  notUsefulByCard: Record<string, number>;
  totalSubmissions: number;
  topCategoryNames: string[];
}) {
  return (
    <div className="border-separator1 bg-bg1 overflow-hidden rounded-lg border">
      <div className="grid grid-cols-[minmax(180px,1.5fr)_1fr_minmax(80px,120px)] items-center gap-3 px-4 py-2 text-fg3 font-mono text-[10px] font-bold uppercase tracking-wider border-b-separator1 border-b">
        <span>Card</span>
        <span>Top group placements</span>
        <span className="text-right">Not useful</span>
      </div>
      <div className="divide-separator1 divide-y">
        {cardRows.map(({ card, categories }) => {
          const groupedTotal = categories.reduce((sum, c) => sum + c.frequency, 0);
          const notUseful = notUsefulByCard[card.id] ?? 0;
          const topGroups = categories.slice(0, 3);
          const notUsefulPct =
            totalSubmissions > 0 ? (notUseful / totalSubmissions) * 100 : 0;
          return (
            <div
              key={card.id}
              className="grid grid-cols-[minmax(180px,1.5fr)_1fr_minmax(80px,120px)] items-center gap-3 px-4 py-2.5"
            >
              <div className="flex min-w-0 flex-col">
                <span className="text-fg0 truncate text-sm font-medium">{card.label}</span>
                {card.context && (
                  <span className="text-fg4 truncate font-mono text-[10px] uppercase tracking-wider">
                    {card.context}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {groupedTotal === 0 ? (
                  <span className="text-fg4 text-xs italic">never grouped</span>
                ) : (
                  topGroups.map((c) => {
                    const pct = totalSubmissions > 0 ? (c.frequency / totalSubmissions) * 100 : 0;
                    return (
                      <GroupChip key={c.categoryId} name={c.name} count={c.frequency} pct={pct} />
                    );
                  })
                )}
              </div>
              <div className="flex justify-end">
                <NotUsefulPill count={notUseful} pct={notUsefulPct} />
              </div>
            </div>
          );
        })}
      </div>
      {topCategoryNames.length > 0 && (
        <div className="border-t-separator1 bg-bg2/40 text-fg4 border-t px-4 py-2 text-xs">
          Top categories in analysis: {topCategoryNames.slice(0, 6).join(' · ')}
        </div>
      )}
    </div>
  );
}

function GroupChip({ name, count, pct }: { name: string; count: number; pct: number }) {
  return (
    <span className="border-separatorAccent bg-bgAccent1 text-fgAccent1 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px]">
      <span className="capitalize">{name}</span>
      <span className="text-fgAccent1/70 font-mono text-[9px] font-bold tabular-nums">
        {count} · {pct.toFixed(0)}%
      </span>
    </span>
  );
}

function NotUsefulPill({ count, pct }: { count: number; pct: number }) {
  if (count === 0) {
    return (
      <span className="text-fg4 font-mono text-[10px] font-bold uppercase tracking-wider">—</span>
    );
  }
  const intensity = Math.min(1, pct / 100);
  return (
    <span
      className={cn(
        'border-separatorSerious2 bg-bgSerious1 text-fgSerious1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tabular-nums',
      )}
      style={{
        opacity: 0.4 + intensity * 0.6,
      }}
      title={`${count} of submissions marked this card not useful`}
    >
      {count} · {pct.toFixed(0)}%
    </span>
  );
}

function CoOccurrenceMatrix({ model }: { model: AnalysisModel }) {
  const cards = model.similarity.order;
  const matrix = model.similarity.matrix;

  const max = React.useMemo(() => {
    let m = 0;
    for (let i = 0; i < cards.length; i++) {
      for (let j = 0; j < cards.length; j++) {
        const v = matrix[i]?.[j] ?? 0;
        if (v > m) m = v;
      }
    }
    return m || 1;
  }, [cards, matrix]);

  return (
    <div className="border-separator1 bg-bg1 overflow-hidden rounded-lg border">
      <div className="overflow-auto">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="bg-bg1 sticky left-0 z-10 border-b-separator1 border-r-separator1 border-b border-r p-2 text-left" />
              {cards.map((c) => (
                <th
                  key={c.id}
                  className="border-b-separator1 border-b p-1 align-bottom"
                  style={{ minWidth: 14 }}
                >
                  <div className="text-fg4 mx-auto -rotate-90 origin-bottom-left whitespace-nowrap font-mono text-[9px] font-bold uppercase tracking-wider"
                    style={{ height: 90, width: 14 }}>
                    <span className="block translate-y-2 translate-x-1">{shortLabel(c.label, c.context)}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cards.map((row, rowIdx) => (
              <tr key={row.id}>
                <th className="bg-bg1 border-r-separator1 border-b-separator1 sticky left-0 z-10 border-b border-r p-2 text-left text-[11px] font-medium text-fg2 whitespace-nowrap">
                  {row.label}
                  {row.context && (
                    <span className="text-fg4 ml-1 font-mono text-[9px] uppercase">{row.context}</span>
                  )}
                </th>
                {cards.map((col, colIdx) => {
                  const pct = matrix[rowIdx]?.[colIdx] ?? 0;
                  const isDiag = row.id === col.id;
                  const opacity = isDiag ? 0 : Math.min(1, pct / max);
                  return (
                    <td
                      key={col.id}
                      className={cn(
                        'border-b-separator1 border-b p-0',
                        isDiag && 'bg-bg2',
                      )}
                      style={{ width: 14, height: 14 }}
                      title={
                        isDiag
                          ? row.label
                          : `${row.label} ↔ ${col.label}: ${pct}% agreement`
                      }
                    >
                      {!isDiag && (
                        <div
                          className="bg-fgAccent1 h-full w-full"
                          style={{ opacity }}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t-separator1 text-fg4 flex items-center justify-end gap-2 border-t px-4 py-2 text-xs">
        <span>Less</span>
        <div className="flex h-2 w-32 overflow-hidden rounded">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="bg-fgAccent1 h-full flex-1"
              style={{ opacity: (i + 1) / 10 }}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}

function shortLabel(label: string, ctx?: string) {
  const stripped = label.replace(/^Avg /i, '').replace(/^Input /i, 'In ').replace(/^Output /i, 'Out ');
  return ctx ? `${ctx} · ${stripped}` : stripped;
}

function EmptyState() {
  return (
    <div className="border-separator1 bg-bg1 relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border border-dashed py-16 text-center">
      <DotFill tone="accent" opacity={0.2} />
      <div className="relative flex flex-col items-center gap-2">
        <h2 className="text-fg0 font-display text-xl">No submissions yet</h2>
        <p className="text-fg3 max-w-md text-sm">
          Once teammates start sorting, this page will aggregate every submission into a single
          dashboard.
        </p>
      </div>
    </div>
  );
}

