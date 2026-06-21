'use client';

import * as React from 'react';
import Link from 'next/link';
import type { MapDoc } from '@/lib/repo/schemas';
import { Button } from '@/components/bytes/Button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/bytes/Popover';
import { Badge } from '@/components/bytes/Badge';
import { ArrowLeftIcon, ArrowShareRightIcon } from '@/icons/react';
import { MapViewer } from './MapViewer';

export function MapPreviewClient({ initial }: { initial: MapDoc }) {
  const [published, setPublished] = React.useState(initial.published);
  const [pending, setPending] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const publicUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/m/${initial.shareSlug}` : '';

  async function togglePublish(next: boolean) {
    setPending(true);
    const res = await fetch(`/api/maps/${initial.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: next }),
    });
    if (res.ok) setPublished(next);
    setPending(false);
  }

  return (
    <div className="bg-bg0 flex h-screen w-full flex-col overflow-hidden">
      <header className="border-separator1 bg-bg1 flex shrink-0 items-center gap-3 border-b px-4 py-2">
        <Link href={`/maps/${initial.id}`} className="text-fg3 hover:text-fg1 inline-flex items-center gap-1 text-xs">
          <ArrowLeftIcon className="h-3 w-3" /> Back to editor
        </Link>
        <Badge variant="accent" size="medium">
          Preview
        </Badge>
        <span className="text-fg1 truncate text-sm font-semibold">{initial.name}</span>
        <div className="ml-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="primary" size="sm" leftIcon={<ArrowShareRightIcon />}>
                Share publicly
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3" align="end">
              <h3 className="text-fg0 text-sm font-semibold">Public share link</h3>
              <p className="text-fg3 mt-1 text-xs">
                When published, anyone with the link can view this map (read-only) — no sign-in
                required.
              </p>
              <label className="mt-3 flex items-center justify-between gap-2 text-sm">
                <span className="text-fg1">Published</span>
                <input
                  type="checkbox"
                  checked={published}
                  disabled={pending}
                  onChange={(e) => togglePublish(e.target.checked)}
                  className="accent-fgAccent1 h-4 w-4"
                />
              </label>
              {published && (
                <div className="bg-bg1 border-separator1 mt-2 flex items-center gap-2 rounded-md border p-2">
                  <span className="text-fg2 min-w-0 flex-1 truncate font-mono text-[11px]">
                    {publicUrl}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard?.writeText(publicUrl);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </header>
      <div className="min-h-0 flex-1">
        <MapViewer initial={initial} />
      </div>
    </div>
  );
}
