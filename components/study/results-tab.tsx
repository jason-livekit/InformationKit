'use client';

import * as React from 'react';
import type { Study, Submission } from '@/lib/repo/schemas';
import { cn } from '@/lib/bytes/utils';
import { Toaster, toast } from '@/components/bytes/Toaster';
import { AnalysisTab } from '@/components/study/analysis-tab';
import { ParticipantsView } from '@/components/study/participants-view';

type ResultsSubtab = 'analysis' | 'participants';

interface ResultsTabProps {
  study: Study;
  /** Every submission for the study (included and excluded). */
  submissions: Submission[];
}

export function ResultsTab({ study, submissions }: ResultsTabProps) {
  const [subtab, setSubtab] = React.useState<ResultsSubtab>('analysis');
  const [saving, setSaving] = React.useState(false);
  const [excludedIds, setExcludedIds] = React.useState<Set<string>>(
    () => new Set(study.excludedSubmissionIds),
  );

  // Re-sync if the study reloads with a newer exclusion list (e.g. after navigation).
  React.useEffect(() => {
    setExcludedIds(new Set(study.excludedSubmissionIds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(study.excludedSubmissionIds)]);

  async function persistExclusions(next: Set<string>) {
    const previous = excludedIds;
    setExcludedIds(next); // optimistic
    setSaving(true);
    try {
      const res = await fetch(`/api/studies/${study.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ excludedSubmissionIds: [...next] }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      setExcludedIds(previous); // revert
      toast.error('Could not update participant', {
        description: 'Your change was undone. Check your connection and try again.',
      });
    } finally {
      setSaving(false);
    }
  }

  function toggleExclude(id: string) {
    const next = new Set(excludedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    void persistExclusions(next);
  }

  const includedSubmissions = React.useMemo(
    () => submissions.filter((s) => !excludedIds.has(s.id)),
    [submissions, excludedIds],
  );

  const total = submissions.length;
  const includedCount = includedSubmissions.length;
  const excludedCount = total - includedCount;

  const subtabs: { key: ResultsSubtab; label: string; meta?: string }[] = [
    { key: 'analysis', label: 'Analysis' },
    { key: 'participants', label: 'Participants', meta: total > 0 ? String(total) : undefined },
  ];

  return (
    <div className="flex flex-col gap-5">
      <Toaster position="top-center" />

      <div className="flex flex-col gap-0.5">
        <h2 className="text-fg0 text-sm font-semibold">Results</h2>
        <p className="text-fg3 max-w-xl text-xs">
          {total === 0
            ? 'No responses captured yet.'
            : excludedCount > 0
              ? `${includedCount} of ${total} participants included in results · ${excludedCount} excluded`
              : `${total} participant${total === 1 ? '' : 's'} included in results`}
        </p>
      </div>

      <div className="border-separator1 inline-flex w-full items-stretch border-b">
        {subtabs.map((t) => {
          const isActive = subtab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setSubtab(t.key)}
              className={cn(
                '-mb-px inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors',
                isActive
                  ? 'text-fg0 border-b-fgAccent1'
                  : 'text-fg3 hover:text-fg1 border-b-transparent',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {t.label}
              {t.meta != null && (
                <span
                  className={cn(
                    'inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums',
                    isActive ? 'bg-bgAccent2 text-fgAccent1' : 'bg-bg2 text-fg3',
                  )}
                >
                  {t.meta}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {subtab === 'analysis' ? (
        <AnalysisTab study={study} submissions={includedSubmissions} />
      ) : (
        <ParticipantsView
          study={study}
          submissions={submissions}
          excludedIds={excludedIds}
          busy={saving}
          onToggleExclude={toggleExclude}
        />
      )}
    </div>
  );
}
