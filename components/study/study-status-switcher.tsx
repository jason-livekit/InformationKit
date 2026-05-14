'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { StudyStatus } from '@/lib/repo/schemas';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/bytes/DropdownMenu';
import { ChevronDownSmallIcon } from '@/icons/react';
import { cn } from '@/lib/bytes/utils';

interface StudyStatusSwitcherProps {
  studyId: string;
  initialStatus: StudyStatus;
}

const STATUS_OPTIONS: { value: StudyStatus; label: string; help: string }[] = [
  { value: 'draft', label: 'Draft', help: 'Hidden. Share links return 404.' },
  { value: 'open', label: 'Open', help: 'Accepting submissions from anyone with the link.' },
  { value: 'closed', label: 'Closed', help: 'Locked. Existing data preserved.' },
];

export function StudyStatusSwitcher({ studyId, initialStatus }: StudyStatusSwitcherProps) {
  const [status, setStatus] = React.useState<StudyStatus>(initialStatus);
  const [pending, setPending] = React.useState(false);
  const router = useRouter();

  async function setNext(next: StudyStatus) {
    if (next === status) return;
    setPending(true);
    setStatus(next);
    try {
      await fetch(`/api/studies/${studyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Change study status"
          className={cn(
            'border-separator1 bg-bg1 hover:bg-bg2 inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-semibold',
            pending && 'opacity-60',
          )}
        >
          <span className={cn('h-2 w-2 rounded-full', toneFor(status))} />
          {STATUS_OPTIONS.find((o) => o.value === status)?.label}
          <ChevronDownSmallIcon className="text-fg3 h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-64">
        {STATUS_OPTIONS.map((o) => (
          <DropdownMenuItem key={o.value} onSelect={() => setNext(o.value)}>
            <div className="flex w-full items-start gap-2">
              <span className={cn('h-2 w-2 mt-1.5 rounded-full', toneFor(o.value))} />
              <div className="flex flex-col">
                <span className="text-fg0 text-sm font-semibold">{o.label}</span>
                <span className="text-fg3 text-xs">{o.help}</span>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function toneFor(status: StudyStatus): string {
  switch (status) {
    case 'open':
      return 'bg-fgSuccess';
    case 'closed':
      return 'bg-fgSerious1';
    case 'draft':
    default:
      return 'bg-fg3';
  }
}
