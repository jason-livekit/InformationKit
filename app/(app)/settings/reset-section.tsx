'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/bytes/AlertDialog';
import { Button } from '@/components/bytes/Button';
import { TrashCanIcon } from '@/icons/react';
import { cn } from '@/lib/bytes/utils';
import { DotFill } from '@/components/card-sort/dot-fill';

export function ResetSection() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const onReset = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/submissions/reset', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to reset');
      setOpen(false);
      router.refresh();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Failed to reset');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={cn(
        'border-separatorSerious1 bg-bgSerious1/40 relative flex flex-wrap items-center justify-between gap-3 overflow-hidden rounded-lg border p-4',
      )}
    >
      <DotFill tone="serious" opacity={0.18} spacing={5} />
      <div className="relative flex flex-col gap-1">
        <span className="text-fgSerious1 text-sm font-semibold">Reset the poll</span>
        <span className="text-fg2 text-xs">
          Permanently delete every submission so the poll starts fresh. This cannot be undone.
        </span>
      </div>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm" leftIcon={<TrashCanIcon />} className="relative">
            Reset all submissions
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Reset all submissions?</AlertDialogTitle>
          <AlertDialogDescription>
            This deletes every submission on the server. Anyone who hits the link after reset will
            see an empty results page until new sorts come in.
          </AlertDialogDescription>
          <div className="flex justify-end gap-2 pt-2">
            <AlertDialogCancel asChild>
              <Button variant="secondary" size="sm">
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" size="sm" disabled={busy} onClick={onReset}>
                {busy ? 'Resetting…' : 'Yes, reset everything'}
              </Button>
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
