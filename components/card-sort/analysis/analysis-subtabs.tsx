'use client';

import * as React from 'react';
import { cn } from '@/lib/bytes/utils';
import type { AnalysisModel } from '@/lib/card-sort/analysis';
import { ExportActions } from './export-actions';
import { CardsView } from './cards-view';
import { CategoriesView } from './categories-view';
import { StandardizationGridView } from './standardization-grid-view';
import { SimilarityMatrixView } from './similarity-matrix-view';
import { DendrogramsView } from './dendrograms-view';

export type AnalysisSubtab =
  | 'cards'
  | 'categories'
  | 'grid'
  | 'similarity'
  | 'dendrograms';

const TABS: { key: AnalysisSubtab; label: string }[] = [
  { key: 'cards', label: 'Cards' },
  { key: 'categories', label: 'Categories' },
  { key: 'grid', label: 'Standardization grid' },
  { key: 'similarity', label: 'Similarity matrix' },
  { key: 'dendrograms', label: 'Dendrograms' },
];

interface AnalysisSubtabsProps {
  model: AnalysisModel;
  busy: boolean;
  onStandardize: (labels: string[], name: string) => void;
  onUnstandardize: (ids: string[]) => void;
  onRename: (id: string, name: string) => void;
}

export function AnalysisSubtabs({
  model,
  busy,
  onStandardize,
  onUnstandardize,
  onRename,
}: AnalysisSubtabsProps) {
  const [active, setActive] = React.useState<AnalysisSubtab>('cards');

  return (
    <div className="flex flex-col gap-5">
      <div className="border-separator1 flex flex-wrap items-center justify-between gap-3 border-b">
        <div className="-mb-px flex flex-wrap items-stretch">
          {TABS.map((t) => {
            const isActive = active === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActive(t.key)}
                className={cn(
                  '-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-semibold transition-colors',
                  isActive
                    ? 'text-fg0 border-b-fgAccent1'
                    : 'text-fg3 hover:text-fg1 border-b-transparent',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <div className="pb-1.5">
          <ExportActions model={model} scope="all" csv={false} />
        </div>
      </div>

      <div>
        {active === 'cards' && <CardsView model={model} />}
        {active === 'categories' && (
          <CategoriesView
            model={model}
            busy={busy}
            onStandardize={onStandardize}
            onUnstandardize={onUnstandardize}
            onRename={onRename}
          />
        )}
        {active === 'grid' && <StandardizationGridView model={model} />}
        {active === 'similarity' && <SimilarityMatrixView model={model} />}
        {active === 'dendrograms' && <DendrogramsView model={model} />}
      </div>
    </div>
  );
}
