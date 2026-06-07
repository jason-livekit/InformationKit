'use client';

import * as React from 'react';
import Link from 'next/link';
import type { JourneyMap } from '@/lib/repo/schemas';
import { Button } from '@/components/bytes/Button';
import { cn } from '@/lib/bytes/utils';
import {
  ArrowLeftIcon,
  ZoomInIcon,
  ZoomOutIcon,
  ExpandIcon,
  SquarePlusIcon,
  AnalyticsIcon,
} from '@/icons/react';
import {
  LANE_LABEL_W,
  WORLD_PAD,
  COL_W,
  type Transform,
  clampScale,
} from './constants';
import { MapCanvas } from './MapCanvas';
import { useMapStore } from './use-map-store';

type DrawKind = 'card' | 'data';

interface MapEditorProps {
  map: JourneyMap;
  projectName: string;
  projectId: string;
}

export function MapEditor({ map: initialMap, projectName, projectId }: MapEditorProps) {
  const { map, actions, saveState } = useMapStore(initialMap);

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [laneLabelW, setLaneLabelW] = React.useState(LANE_LABEL_W);
  const [transform, setTransform] = React.useState<Transform>({
    scale: 0.72,
    tx: LANE_LABEL_W + WORLD_PAD,
    ty: WORLD_PAD,
  });
  const [drawKind, setDrawKind] = React.useState<DrawKind>('card');
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  // Delete / Backspace removes the selected card(s) (unless editing text).
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const el = document.activeElement as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || el?.isContentEditable) return;
      if (selectedIds.length === 0) return;
      e.preventDefault();
      selectedIds.forEach((id) => actions.removeCard(id));
      setSelectedIds([]);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedIds, actions]);

  const [titleDraft, setTitleDraft] = React.useState(map.name);
  const [editingTitle, setEditingTitle] = React.useState(false);
  React.useEffect(() => {
    if (!editingTitle) setTitleDraft(map.name);
  }, [map.name, editingTitle]);

  function zoomBy(factor: number) {
    const el = containerRef.current;
    const cx = el ? el.clientWidth / 2 : 0;
    setTransform((t) => {
      const ns = clampScale(t.scale * factor);
      const k = ns / t.scale;
      // Zoom the time axis about the viewport center on X only; Y is fixed.
      return { scale: ns, tx: cx - (cx - t.tx) * k, ty: t.ty };
    });
  }

  function fit() {
    const el = containerRef.current;
    if (!el) return;
    const availW = el.clientWidth - laneLabelW - WORLD_PAD * 2;
    const worldW = Math.max(1, map.columnCount * COL_W);
    const ns = clampScale(Math.min(1.2, availW / worldW));
    setTransform({ scale: ns, tx: laneLabelW + WORLD_PAD, ty: WORLD_PAD });
  }

  return (
    <div ref={containerRef} className="flex h-[calc(100svh-3.5rem)] flex-col">
      {/* Toolbar */}
      <div className="border-separator1 bg-bg1 flex h-12 shrink-0 items-center justify-between gap-3 border-b px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={`/projects/${projectId}`}
            className="text-fg3 hover:text-fg1 inline-flex shrink-0 items-center gap-1 text-xs"
          >
            <ArrowLeftIcon className="h-3 w-3" /> {projectName}
          </Link>
          <span className="text-separator2">/</span>
          {editingTitle ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={() => {
                setEditingTitle(false);
                if (titleDraft.trim() && titleDraft !== map.name) actions.setName(titleDraft);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                if (e.key === 'Escape') {
                  setTitleDraft(map.name);
                  setEditingTitle(false);
                }
              }}
              className="border-separatorAccent bg-bg2 text-fg0 min-w-0 rounded border px-2 py-0.5 text-sm font-semibold outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingTitle(true)}
              className="text-fg0 truncate text-sm font-semibold hover:underline"
            >
              {map.name}
            </button>
          )}
          <SaveStatus state={saveState} />
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {/* Draw-kind toggle */}
          <div className="border-separator1 bg-bg2 flex items-center gap-0.5 rounded-md border p-0.5">
            <ToolToggle
              active={drawKind === 'card'}
              onClick={() => setDrawKind('card')}
              icon={<SquarePlusIcon className="h-3.5 w-3.5" />}
              label="Card"
            />
            <ToolToggle
              active={drawKind === 'data'}
              onClick={() => setDrawKind('data')}
              icon={<AnalyticsIcon className="h-3.5 w-3.5" />}
              label="Data"
            />
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <Button variant="secondary" size="icon" aria-label="Zoom out" onClick={() => zoomBy(0.8)}>
              <ZoomOutIcon className="h-3.5 w-3.5" />
            </Button>
            <button
              type="button"
              onClick={fit}
              className="text-fg2 hover:text-fg0 w-12 text-center font-mono text-xs tabular-nums"
              title="Fit to width"
            >
              {Math.round(transform.scale * 100)}%
            </button>
            <Button variant="secondary" size="icon" aria-label="Zoom in" onClick={() => zoomBy(1.25)}>
              <ZoomInIcon className="h-3.5 w-3.5" />
            </Button>
            <Button variant="secondary" size="icon" aria-label="Fit to width" onClick={fit}>
              <ExpandIcon className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative min-h-0 flex-1">
        <MapCanvas
          map={map}
          actions={actions}
          transform={transform}
          setTransform={setTransform}
          drawKind={drawKind}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          laneLabelW={laneLabelW}
          setLaneLabelW={setLaneLabelW}
        />
        <div className="text-fg4 bg-bg1/80 pointer-events-none absolute bottom-3 right-3 rounded border border-separator1 px-2 py-1 text-[10px] backdrop-blur">
          Pinch to zoom · scroll to pan · click an empty cell to add · select a card to style it · ⌫ to delete
        </div>
      </div>
    </div>
  );
}

function ToolToggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition-colors',
        active ? 'bg-fgAccent1 text-bg1' : 'text-fg3 hover:text-fg1',
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function SaveStatus({ state }: { state: 'idle' | 'saving' | 'saved' }) {
  if (state === 'idle') return null;
  return (
    <span className="text-fg4 shrink-0 font-mono text-[10px] uppercase tracking-wider">
      {state === 'saving' ? 'Saving…' : 'Saved'}
    </span>
  );
}
