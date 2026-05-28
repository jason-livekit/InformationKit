'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { Study, Submission, Standardization } from '@/lib/repo/schemas';
import type { AggregatedResults } from '@/lib/card-sort/aggregate';
import { buildAnalysis } from '@/lib/card-sort/analysis';
import {
  getStandardization,
  mergeLabels,
  removeCategories,
  renameCategory,
} from '@/lib/card-sort/standardize';
import { AnalysisSubtabs } from '@/components/card-sort/analysis/analysis-subtabs';
import { Button } from '@/components/bytes/Button';
import { Toaster, toast } from '@/components/bytes/Toaster';
import { ArrowUndoUpIcon } from '@/icons/react';

interface AnalysisTabProps {
  study: Study;
  results: AggregatedResults;
  submissions: Submission[];
  submissionsCount: number;
}

export function AnalysisTab({ study, results, submissions, submissionsCount }: AnalysisTabProps) {
  const router = useRouter();
  const [resetting, setResetting] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [standardization, setStandardization] = React.useState<Standardization>(() =>
    getStandardization(study.standardization),
  );

  // Keep local state in sync if the study reloads with newer standardization.
  React.useEffect(() => {
    setStandardization(getStandardization(study.standardization));
  }, [study.standardization]);

  const model = React.useMemo(
    () => buildAnalysis({ ...study, standardization }, submissions),
    [study, standardization, submissions],
  );

  async function persist(next: Standardization) {
    const previous = standardization;
    setStandardization(next); // optimistic
    setSaving(true);
    try {
      const res = await fetch(`/api/studies/${study.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ standardization: next }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      setStandardization(previous); // revert
      toast.error('Could not save standardization', {
        description: 'Your change was undone. Check your connection and try again.',
      });
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    if (!confirm('Delete all submissions for this study? This cannot be undone.')) return;
    setResetting(true);
    try {
      await fetch(`/api/studies/${study.id}/submissions`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Toaster position="top-center" />
      <div className="flex items-center justify-between gap-2">
        <p className="text-fg3 text-sm">
          {submissionsCount} submission{submissionsCount === 1 ? '' : 's'} captured.
        </p>
        {submissionsCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowUndoUpIcon />}
            disabled={resetting}
            onClick={reset}
          >
            {resetting ? 'Resetting…' : 'Reset submissions'}
          </Button>
        )}
      </div>

      <AnalysisSubtabs
        model={model}
        results={results}
        busy={saving}
        onStandardize={(labels, name) => persist(mergeLabels(standardization, labels, name))}
        onUnstandardize={(ids) => persist(removeCategories(standardization, ids))}
        onRename={(id, name) => persist(renameCategory(standardization, id, name))}
      />
    </div>
  );
}
