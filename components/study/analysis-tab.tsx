'use client';

import * as React from 'react';
import type { Study, Submission, Standardization } from '@/lib/repo/schemas';
import { buildAnalysis } from '@/lib/card-sort/analysis';
import {
  getStandardization,
  mergeLabels,
  removeCategories,
  renameCategory,
} from '@/lib/card-sort/standardize';
import { AnalysisSubtabs } from '@/components/card-sort/analysis/analysis-subtabs';
import { toast } from '@/components/bytes/Toaster';

interface AnalysisTabProps {
  study: Study;
  /** Submissions included in the results (excluded participants are filtered out upstream). */
  submissions: Submission[];
}

export function AnalysisTab({ study, submissions }: AnalysisTabProps) {
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

  return (
    <AnalysisSubtabs
      model={model}
      busy={saving}
      onStandardize={(labels, name) => persist(mergeLabels(standardization, labels, name))}
      onUnstandardize={(ids) => persist(removeCategories(standardization, ids))}
      onRename={(id, name) => persist(renameCategory(standardization, id, name))}
    />
  );
}
