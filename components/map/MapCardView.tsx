'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import type { MapCard, MapColor } from '@/lib/repo/schemas';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/bytes/Popover';
import { ColorPaletteIcon, TrashCanIcon, AnalyticsIcon } from '@/icons/react';
import { cn } from '@/lib/bytes/utils';
import { CARD_SURFACE, MAP_COLORS, colorLabel } from './colors';
import { COL_W, LANE_H } from './constants';
import { DataCardView } from './DataCardView';
import type { MapActions } from './use-map-store';

interface MapCardViewProps {
  card: MapCard;
  laneIndex: number;
  columnCount: number;
  selected: boolean;
  dimmed: boolean;
  actions: MapActions;
  onSelect: () => void;
  onBodyPointerDown: (e: React.PointerEvent) => void;
  onResizeStart: (e: React.PointerEvent, side: 'left' | 'right') => void;
  /** Live geometry while dragging/resizing (overrides the card's stored geom). */
  preview?: { laneIndex: number; startCol: number; colSpan: number } | null;
}

export function MapCardView({
  card,
  laneIndex,
  columnCount,
  selected,
  dimmed,
  actions,
  onSelect,
  onBodyPointerDown,
  onResizeStart,
  preview,
}: MapCardViewProps) {
  const startCol = preview?.startCol ?? card.startCol;
  const colSpan = preview?.colSpan ?? card.colSpan;
  const laneIdx = preview?.laneIndex ?? laneIndex;

  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(card.title);
  React.useEffect(() => {
    if (!editing) setDraft(card.title);
  }, [card.title, editing]);

  const surface = CARD_SURFACE[card.color];
  const isData = card.kind === 'data';

  const left = startCol * COL_W;
  const top = laneIdx * LANE_H;
  const width = colSpan * COL_W;

  function commitTitle() {
    setEditing(false);
    if (draft !== card.title) actions.setCardTitle(card.id, draft);
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: dimmed ? 0.35 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="absolute"
      style={{ left, top, width, height: LANE_H }}
      data-card-id={card.id}
    >
      <div
        className={cn(
          'absolute inset-1 flex flex-col overflow-hidden rounded-lg border shadow-sm transition-shadow',
          surface.bg,
          surface.border,
          surface.text,
          selected && 'ring-fgAccent1 ring-2 ring-offset-0',
        )}
        onPointerDown={(e) => {
          // Ignore presses on interactive children (handled separately).
          if ((e.target as HTMLElement).closest('[data-no-drag]')) return;
          onBodyPointerDown(e);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        style={{ cursor: 'grab' }}
      >
        {/* Title row */}
        <div className="flex items-start gap-1 px-2 pt-1.5">
          {isData && <AnalyticsIcon className="mt-0.5 h-3 w-3 shrink-0 opacity-70" />}
          {editing ? (
            <input
              data-no-drag
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitTitle();
                } else if (e.key === 'Escape') {
                  setEditing(false);
                  setDraft(card.title);
                }
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="w-full bg-transparent text-xs font-semibold leading-tight outline-none"
              placeholder="Untitled"
            />
          ) : (
            <button
              data-no-drag
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
                setEditing(true);
              }}
              className="w-full truncate text-left text-xs font-semibold leading-tight"
              title={card.title || 'Untitled'}
            >
              {card.title || <span className="opacity-50">Untitled</span>}
            </button>
          )}
        </div>

        {/* Body: chart for data cards */}
        {isData ? (
          <div className="min-h-0 flex-1 px-1 pb-1">
            <DataCardView card={card} columnCount={columnCount} actions={actions} />
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* Selected toolbar */}
        {selected && (
          <div
            data-no-drag
            className="absolute right-1 top-1 flex items-center gap-1"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <ColorMenu
              color={card.color}
              onPick={(c) => actions.setCardColor(card.id, c)}
            />
            <button
              type="button"
              aria-label="Delete card"
              onClick={(e) => {
                e.stopPropagation();
                actions.removeCard(card.id);
              }}
              className="bg-bg1/80 text-fg3 hover:text-fgSerious1 inline-flex h-5 w-5 items-center justify-center rounded border border-separator2 backdrop-blur"
            >
              <TrashCanIcon className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* Resize handles (only when selected) */}
      {selected && (
        <>
          <div
            data-no-drag
            onPointerDown={(e) => {
              e.stopPropagation();
              onResizeStart(e, 'left');
            }}
            className="absolute left-0 top-1 bottom-1 w-2 cursor-ew-resize rounded-l"
            style={{ touchAction: 'none' }}
          >
            <div className="bg-fgAccent1 mx-auto h-full w-0.5 rounded opacity-0 hover:opacity-100" />
          </div>
          <div
            data-no-drag
            onPointerDown={(e) => {
              e.stopPropagation();
              onResizeStart(e, 'right');
            }}
            className="absolute right-0 top-1 bottom-1 w-2 cursor-ew-resize rounded-r"
            style={{ touchAction: 'none' }}
          >
            <div className="bg-fgAccent1 mx-auto h-full w-0.5 rounded opacity-0 hover:opacity-100" />
          </div>
        </>
      )}
    </motion.div>
  );
}

function ColorMenu({ color, onPick }: { color: MapColor; onPick: (c: MapColor) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Card color"
          className="bg-bg1/80 text-fg3 hover:text-fg1 inline-flex h-5 w-5 items-center justify-center rounded border border-separator2 backdrop-blur"
        >
          <ColorPaletteIcon className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-2">
        <div className="grid grid-cols-5 gap-1.5">
          {MAP_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={colorLabel(c)}
              title={colorLabel(c)}
              onClick={() => onPick(c)}
              className={cn(
                'h-5 w-5 rounded-full',
                CARD_SURFACE[c].swatch,
                color === c && 'ring-fgAccent1 ring-2 ring-offset-1 ring-offset-bg2',
              )}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
