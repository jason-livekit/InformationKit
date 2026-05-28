'use client';

import * as React from 'react';
import { cn } from '@/lib/bytes/utils';
import type { AnalysisModel } from '@/lib/card-sort/analysis';
import { ViewHeader } from './view-header';

/** Lower-triangular agreement matrix, ordered by clustering like Optimal Workshop. */
export function SimilarityMatrixView({ model }: { model: AnalysisModel }) {
  const { order, matrix } = model.similarity;

  return (
    <div className="flex flex-col gap-4">
      <ViewHeader
        title="Similarity matrix"
        description="The percentage of participants who placed each pair of cards in the same category. Cards are ordered by clustering so strong pairs sit together."
        help="100 = every participant grouped the two cards together; 0 = none did."
      />

      {order.length === 0 ? (
        <div className="border-separator1 text-fg4 rounded-lg border border-dashed px-4 py-8 text-center text-sm">
          No data to compare yet.
        </div>
      ) : (
        <div className="border-separator1 bg-bg1 overflow-auto rounded-lg border p-4">
          <table className="border-separate border-spacing-1">
            <tbody>
              {order.map((rowCard, i) => (
                <tr key={rowCard.id}>
                  {order.map((colCard, j) => {
                    if (j > i) return <td key={colCard.id} className="p-0" />;
                    if (j === i) {
                      return (
                        <td key={colCard.id} className="whitespace-nowrap pl-2 text-left">
                          <span className="text-fg2 text-xs font-medium">{rowCard.label}</span>
                        </td>
                      );
                    }
                    const v = matrix[i]![j]!;
                    return (
                      <td key={colCard.id} className="p-0">
                        <Cell value={v} a={rowCard.label} b={colCard.label} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <Legend />
        </div>
      )}
    </div>
  );
}

function Cell({ value, a, b }: { value: number; a: string; b: string }) {
  const intensity = value / 100;
  const isStrong = value >= 50;
  return (
    <div
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded font-mono text-[11px] font-bold tabular-nums',
        value === 0 ? 'text-fg4' : isStrong ? 'text-bg1' : 'text-fg1',
      )}
      style={{
        backgroundColor:
          value === 0 ? 'var(--color-bg2)' : `color-mix(in srgb, var(--color-fgAccent1) ${Math.round(20 + intensity * 80)}%, transparent)`,
      }}
      title={`${a} ↔ ${b}: ${value}% of participants grouped these together`}
    >
      {value}
    </div>
  );
}

function Legend() {
  return (
    <div className="text-fg4 mt-3 flex items-center justify-end gap-2 text-xs">
      <span>0%</span>
      <div className="flex h-2 w-32 overflow-hidden rounded">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="h-full flex-1"
            style={{
              backgroundColor: `color-mix(in srgb, var(--color-fgAccent1) ${20 + ((i + 1) / 10) * 80}%, transparent)`,
            }}
          />
        ))}
      </div>
      <span>100%</span>
    </div>
  );
}
