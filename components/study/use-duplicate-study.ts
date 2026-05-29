'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { Study } from '@/lib/repo/schemas';

/**
 * Shared client behavior for duplicating a study. Posts to the duplicate
 * endpoint and, on success, navigates to the new copy's page so the freshly
 * created draft opens ready to edit. Used from both the project study list and
 * the study page header.
 */
export function useDuplicateStudy() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const duplicate = React.useCallback(
    async (studyId: string) => {
      if (pending) return;
      setPending(true);
      setError(null);
      try {
        const res = await fetch(`/api/studies/${studyId}/duplicate`, { method: 'POST' });
        if (!res.ok) {
          setError('Could not duplicate this study.');
          return;
        }
        const body = (await res.json().catch(() => ({}))) as { study?: Study };
        if (body.study?.id) {
          router.push(`/studies/${body.study.id}`);
        } else {
          router.refresh();
        }
      } catch {
        setError('Could not duplicate this study.');
      } finally {
        setPending(false);
      }
    },
    [pending, router],
  );

  return { duplicate, pending, error };
}
