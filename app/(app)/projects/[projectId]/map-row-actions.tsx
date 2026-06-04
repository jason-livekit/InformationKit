'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/bytes/DropdownMenu';
import { ArrowUpRightIcon, DotGrid1X3VerticalIcon, TrashCanIcon } from '@/icons/react';
import { cn } from '@/lib/bytes/utils';

interface MapRowActionsProps {
  mapId: string;
}

export function MapRowActions({ mapId }: MapRowActionsProps) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function remove() {
    if (!window.confirm('Delete this map? This cannot be undone.')) return;
    setPending(true);
    await fetch(`/api/maps/${mapId}`, { method: 'DELETE' });
    setPending(false);
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Map actions"
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
          <Link href={`/maps/${mapId}`} className="flex items-center gap-2">
            <ArrowUpRightIcon className="h-4 w-4" /> Open
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            remove();
          }}
          disabled={pending}
        >
          <span className="text-fgSerious1 flex items-center gap-2">
            <TrashCanIcon className="h-4 w-4" /> Delete
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
