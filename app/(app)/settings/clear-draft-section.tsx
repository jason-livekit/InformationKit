'use client';

import * as React from 'react';
import { Button } from '@/components/bytes/Button';
import { ArrowUndoUpIcon } from '@/icons/react';
import { clearDraft, loadDraft } from '@/lib/card-sort/storage';

export function ClearDraftSection() {
  const [hasDraft, setHasDraft] = React.useState(false);
  const [cleared, setCleared] = React.useState(false);

  React.useEffect(() => {
    setHasDraft(loadDraft() !== null);
  }, []);

  return (
    <div className="border-separator1 bg-bg1 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
      <div className="flex flex-col gap-1">
        <span className="text-fg0 text-sm font-semibold">Clear my local draft</span>
        <span className="text-fg3 text-xs">
          Your in-progress sort is saved in this browser only. Clearing it doesn&apos;t affect
          anyone else and won&apos;t touch already-submitted sorts.
        </span>
      </div>
      <Button
        variant="secondary"
        size="sm"
        leftIcon={<ArrowUndoUpIcon />}
        disabled={!hasDraft}
        onClick={() => {
          clearDraft();
          setHasDraft(false);
          setCleared(true);
          setTimeout(() => setCleared(false), 2000);
        }}
      >
        {cleared ? 'Cleared' : hasDraft ? 'Clear draft' : 'No draft to clear'}
      </Button>
    </div>
  );
}
