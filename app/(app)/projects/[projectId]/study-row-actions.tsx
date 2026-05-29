'use client';

import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/bytes/DropdownMenu';
import { ArrowUpRightIcon, DotGrid1X3VerticalIcon, FilesIcon } from '@/icons/react';
import { cn } from '@/lib/bytes/utils';
import { useDuplicateStudy } from '@/components/study/use-duplicate-study';

interface StudyRowActionsProps {
  studyId: string;
}

export function StudyRowActions({ studyId }: StudyRowActionsProps) {
  const { duplicate, pending } = useDuplicateStudy();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Study actions"
          className={cn(
            'border-separator1 bg-bg1 hover:bg-bg2 text-fg3 hover:text-fg1 inline-flex h-7 w-7 items-center justify-center rounded-md border',
            pending && 'opacity-60',
          )}
        >
          <DotGrid1X3VerticalIcon className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuItem asChild>
          <Link href={`/studies/${studyId}`} className="flex items-center gap-2">
            <ArrowUpRightIcon className="h-4 w-4" /> Open
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            duplicate(studyId);
          }}
          disabled={pending}
        >
          <span className="flex items-center gap-2">
            <FilesIcon className="h-4 w-4" /> Duplicate
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
