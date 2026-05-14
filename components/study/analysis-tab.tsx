'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { Study } from '@/lib/repo/schemas';
import type { AggregatedResults } from '@/lib/card-sort/aggregate';
import { ResultsDashboard } from '@/components/card-sort/results-dashboard';
import { Button } from '@/components/bytes/Button';
import { ArrowUndoUpIcon } from '@/icons/react';

interface AnalysisTabProps {
  study: Study;
  results: AggregatedResults;
  submissionsCount: number;
}

export function AnalysisTab({ study, results, submissionsCount }: AnalysisTabProps) {
  const router = useRouter();
  const [resetting, setResetting] = React.useState(false);

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
    <div className="flex flex-col gap-4">
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
      <ResultsDashboard results={results} />
    </div>
  );
}
