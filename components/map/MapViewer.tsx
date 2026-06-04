'use client';

import * as React from 'react';
import type { MapDoc } from '@/lib/repo/schemas';
import { cn } from '@/lib/bytes/utils';
import { MapStoreProvider, useMap, useMapApi } from './useMapStore';
import { MapCanvas } from './MapCanvas';

/** Read-only zoom/pan viewer used by Preview and the public share page. */
export function MapViewer({ initial }: { initial: MapDoc }) {
  return (
    <MapStoreProvider initial={initial}>
      <ViewerInner />
    </MapStoreProvider>
  );
}

function ViewerInner() {
  const api = useMapApi();
  const pages = useMap((s) => s.doc.pages);
  const activePageId = useMap((s) => s.activePageId);
  const table = useMap((s) => s.activePage().table);

  return (
    <div className="bg-bg0 flex h-full w-full flex-col">
      {pages.length > 1 && (
        <div className="border-separator1 flex shrink-0 items-center gap-1 border-b px-3 py-1.5">
          {pages.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => api.getState().setActivePage(p.id)}
              className={cn(
                'rounded px-2 py-1 text-xs',
                p.id === activePageId ? 'bg-bg3 text-fg0' : 'text-fg3 hover:bg-bg2',
              )}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
      <div className="relative min-h-0 flex-1">
        <MapCanvas table={table} readOnly />
      </div>
    </div>
  );
}
