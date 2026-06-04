'use client';

import * as React from 'react';
import Link from 'next/link';
import type { MapDoc } from '@/lib/repo/schemas';
import { Button } from '@/components/bytes/Button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/bytes/Popover';
import { ArrowLeftIcon, ArrowShareRightIcon, EyeOpenIcon } from '@/icons/react';
import { MapStoreProvider, useMap, useMapApi } from './useMapStore';
import { addRow, deleteRow, deleteColumn } from './grid';
import { MapCanvas } from './MapCanvas';
import { PagesSidebar } from './PagesSidebar';
import { StylePanel } from './StylePanel';
import { ShortcutsPopover } from './ShortcutsPopover';

export function MapEditor({ initial, projectId }: { initial: MapDoc; projectId: string }) {
  return (
    <MapStoreProvider initial={initial}>
      <EditorInner projectId={projectId} />
    </MapStoreProvider>
  );
}

function EditorInner({ projectId }: { projectId: string }) {
  const api = useMapApi();
  const name = useMap((s) => s.doc.name);
  const table = useMap((s) => s.activePage().table);
  const saveState = useMap((s) => s.saveState);
  const mapId = useMap((s) => s.doc.id);

  // Global shortcuts (Cmd/Ctrl modified so they don't clash with cell typing).
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const typing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // Delete the selected row/column with Delete/Backspace (when not typing).
      if ((e.key === 'Delete' || e.key === 'Backspace') && !typing && !api.getState().editing) {
        const sel = api.getState().selection;
        const t = api.getState().activeTable();
        if (sel.kind === 'row') {
          e.preventDefault();
          api.getState().applyGrid(deleteRow({ table: t, caret: { row: sel.row, cell: 0, offset: 0 } }, sel.row));
          api.getState().select({ kind: 'none' });
          return;
        }
        if (sel.kind === 'column') {
          e.preventDefault();
          api.getState().applyGrid(deleteColumn({ table: t, caret: { row: 0, cell: 0, offset: 0 } }, sel.col));
          api.getState().select({ kind: 'none' });
          return;
        }
      }

      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        api.getState().undo();
      } else if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault();
        api.getState().redo();
      } else if (key === 'b') {
        e.preventDefault();
        api.getState().toggleMark('bold');
      } else if (key === 'i') {
        e.preventDefault();
        api.getState().toggleMark('italic');
      } else if (key === 'enter' && e.shiftKey) {
        e.preventDefault();
        const t = api.getState().activeTable();
        if (t.rows.length > 0) {
          const next = addRow({ table: t, caret: { row: 0, cell: 0, offset: 0 } });
          api.getState().applyGrid(next);
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [api]);

  return (
    <div className="bg-bg0 flex h-screen w-full flex-col overflow-hidden">
      <header className="border-separator1 bg-bg1 flex shrink-0 items-center gap-3 border-b px-4 py-2">
        <Link
          href={`/projects/${projectId}`}
          className="text-fg3 hover:text-fg1 inline-flex items-center gap-1 text-xs"
        >
          <ArrowLeftIcon className="h-3 w-3" /> Project
        </Link>
        <input
          defaultValue={name}
          onBlur={(e) => api.getState().setName(e.target.value.trim() || 'Untitled journey map')}
          className="text-fg0 min-w-0 max-w-xs flex-1 truncate rounded bg-transparent px-1 text-sm font-semibold outline-none hover:bg-bg2 focus:bg-bg2"
        />
        <span className="text-fg4 font-mono text-[10px]">
          {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : ''}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Link href={`/maps/${mapId}/preview`} target="_blank">
            <Button variant="ghost" size="sm" leftIcon={<EyeOpenIcon />}>
              Preview
            </Button>
          </Link>
          <SharePopover projectId={projectId} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <PagesSidebar />
        <div className="relative min-w-0 flex-1">
          <StylePanel />
          <MapCanvas table={table} />
        </div>
      </div>

      <ShortcutsPopover />
    </div>
  );
}

function SharePopover({ projectId }: { projectId: string }) {
  const [copied, setCopied] = React.useState(false);
  const url = typeof window !== 'undefined' ? window.location.href.split('?')[0] : '';

  function copy() {
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="primary" size="sm" leftIcon={<ArrowShareRightIcon />}>
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="end">
        <h3 className="text-fg0 text-sm font-semibold">Share for editing</h3>
        <p className="text-fg3 mt-1 text-xs">
          Contributors need to sign in and be a member of this project to edit.
        </p>
        <div className="bg-bg1 border-separator1 mt-2 flex items-center gap-2 rounded-md border p-2">
          <span className="text-fg2 min-w-0 flex-1 truncate font-mono text-[11px]">{url}</span>
          <Button variant="secondary" size="sm" onClick={copy}>
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
        <Link
          href={`/projects/${projectId}`}
          className="text-fgAccent1 mt-2 inline-block text-xs hover:underline"
        >
          Manage project members →
        </Link>
        <p className="text-fg4 mt-3 border-t border-separator1 pt-2 text-[11px]">
          To share publicly (view-only), open <strong>Preview</strong> and publish.
        </p>
      </PopoverContent>
    </Popover>
  );
}
