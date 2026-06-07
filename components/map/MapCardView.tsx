'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import type { MapCard } from '@/lib/repo/schemas';
import { AnalyticsIcon, PlusSmallIcon } from '@/icons/react';
import { cn } from '@/lib/bytes/utils';
import { CARD_SURFACE, cardFill, cardOutlineStyle } from './colors';
import {
  COL_W,
  CARD_HPAD,
  CARD_LINE_FACTOR,
  DATA_TITLE_FONT,
  fontScaleMult,
} from './constants';
import { fitCardTitle } from './text-fit';
import { DataCardView } from './DataCardView';
import type { MapActions } from './use-map-store';

interface MapCardViewProps {
  card: MapCard;
  /** Screen-space top / height of the lane this card sits in (not zoomed). */
  top: number;
  height: number;
  /** Screen width of one base column at the current zoom (the X scale). */
  colPx: number;
  selected: boolean;
  /** Highlighted by the playhead / lane hover (a softer emphasis than select). */
  highlighted: boolean;
  actions: MapActions;
  onSelect: (additive: boolean) => void;
  onHoverChange: (hovering: boolean) => void;
  onBodyPointerDown: (e: React.PointerEvent) => void;
  onResizeStart: (e: React.PointerEvent, side: 'left' | 'right') => void;
  onInsertAdjacent: (side: 'before' | 'after') => void;
  /** Live geometry while dragging/resizing (overrides the card's stored geom). */
  preview?: { laneIndex: number; startCol: number; colSpan: number } | null;
}

export function MapCardView({
  card,
  top,
  height,
  colPx,
  selected,
  highlighted,
  actions,
  onSelect,
  onHoverChange,
  onBodyPointerDown,
  onResizeStart,
  onInsertAdjacent,
  preview,
}: MapCardViewProps) {
  const startCol = preview?.startCol ?? card.startCol;
  const colSpan = preview?.colSpan ?? card.colSpan;

  const [editing, setEditing] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const [draft, setDraft] = React.useState(card.title);
  React.useEffect(() => {
    if (!editing) setDraft(card.title);
  }, [card.title, editing]);

  const surface = CARD_SURFACE[card.color];
  const isData = card.kind === 'data';

  const left = startCol * colPx;
  const width = colSpan * colPx;

  // Auto-fit the title against the card's reference (scale-1) width so the font
  // size and the card height stay constant while you zoom the time axis.
  const mult = fontScaleMult(card.fontScale);
  const fit = React.useMemo(
    () => fitCardTitle(editing ? draft : card.title, colSpan * COL_W, mult),
    [editing, draft, card.title, colSpan, mult],
  );
  const align = card.align ?? 'center';
  const titleFontPx = isData ? DATA_TITLE_FONT : fit.fontPx;
  const titleStyle: React.CSSProperties = {
    fontSize: titleFontPx,
    lineHeight: CARD_LINE_FACTOR,
    padding: `0 ${CARD_HPAD}px`,
    fontWeight: card.bold ? 700 : 600,
    fontStyle: card.italic ? 'italic' : 'normal',
    textDecoration: card.strike ? 'line-through' : 'none',
    textAlign: align,
  };

  function commitTitle() {
    setEditing(false);
    if (draft !== card.title) actions.setCardTitle(card.id, draft);
  }

  const outline = cardOutlineStyle(card.color, card.outlineColor, card.outlineStyle);
  const fill = cardFill(card.color, card.fillStyle);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="absolute"
      style={{ left, top, width, height }}
      data-card-id={card.id}
      onPointerEnter={() => {
        setHovered(true);
        onHoverChange(true);
      }}
      onPointerLeave={() => {
        setHovered(false);
        onHoverChange(false);
      }}
    >
      <div
        className={cn(
          'absolute inset-1 flex overflow-hidden rounded-lg shadow-sm transition-all',
          isData ? 'flex-col' : 'items-center justify-center',
          fill.useSurface ? surface.bg : '',
          fill.useSurface ? surface.text : fill.textClass,
          selected && 'ring-fgAccent1 ring-2',
          !selected && highlighted && 'ring-fgAccent1/50 shadow-md ring-2',
          !selected && !highlighted && hovered && 'shadow-md',
        )}
        style={{ ...outline, ...fill.style, cursor: 'grab' }}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest('[data-no-drag]')) return;
          onBodyPointerDown(e);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(e.shiftKey);
        }}
      >
        {isData ? (
          <>
            <div className="flex items-center gap-1 px-2 pt-1.5">
              <AnalyticsIcon className="h-3 w-3 shrink-0 opacity-70" />
              <TitleField
                card={card}
                editing={editing}
                hovered={hovered}
                draft={draft}
                setDraft={setDraft}
                setEditing={setEditing}
                onSelect={onSelect}
                commitTitle={commitTitle}
                style={{ ...titleStyle, padding: 0, textAlign: 'left' }}
                className="font-semibold"
              />
            </div>
            <div className="min-h-0 flex-1 px-1 pb-1">
              <DataCardView card={card} actions={actions} />
            </div>
          </>
        ) : (
          <TitleField
            card={card}
            editing={editing}
            hovered={hovered}
            draft={draft}
            setDraft={setDraft}
            setEditing={setEditing}
            onSelect={onSelect}
            commitTitle={commitTitle}
            style={{ ...titleStyle }}
            className="w-full"
            multiline
          />
        )}
      </div>

      {/* Resize handles (only when selected) */}
      {selected && (
        <>
          <ResizeHandle side="left" onResizeStart={onResizeStart} />
          <ResizeHandle side="right" onResizeStart={onResizeStart} />
        </>
      )}

      {/* Insert before / after (on hover) */}
      {(hovered || selected) && !editing && (
        <>
          <InsertEdgeButton side="before" onInsert={() => onInsertAdjacent('before')} />
          <InsertEdgeButton side="after" onInsert={() => onInsertAdjacent('after')} />
        </>
      )}
    </motion.div>
  );
}

function InsertEdgeButton({
  side,
  onInsert,
}: {
  side: 'before' | 'after';
  onInsert: () => void;
}) {
  return (
    <button
      data-no-drag
      type="button"
      aria-label={`Insert card ${side}`}
      title={`Insert card ${side}`}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onInsert();
      }}
      className={cn(
        'bg-fgAccent1 text-bg1 absolute top-1/2 z-20 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full shadow-md ring-2 ring-bg0 transition-transform hover:scale-110',
        side === 'before' ? '-left-2.5' : '-right-2.5',
      )}
    >
      <PlusSmallIcon className="h-3 w-3" />
    </button>
  );
}

function TitleField({
  card,
  editing,
  hovered,
  draft,
  setDraft,
  setEditing,
  onSelect,
  commitTitle,
  style,
  className,
  multiline,
}: {
  card: MapCard;
  editing: boolean;
  hovered: boolean;
  draft: string;
  setDraft: (v: string) => void;
  setEditing: (v: boolean) => void;
  onSelect: (additive: boolean) => void;
  commitTitle: () => void;
  style: React.CSSProperties;
  className?: string;
  multiline?: boolean;
}) {
  if (editing) {
    if (multiline) {
      return (
        <textarea
          data-no-drag
          autoFocus
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              commitTitle();
            } else if (e.key === 'Escape') {
              setEditing(false);
              setDraft(card.title);
            }
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className={cn('resize-none bg-transparent leading-tight outline-none', className)}
          style={style}
          placeholder="Add text"
        />
      );
    }
    return (
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
        className={cn('bg-transparent leading-tight outline-none', className)}
        style={style}
        placeholder="Add text"
      />
    );
  }
  // Placeholder only shows while hovered and empty; otherwise an empty card is
  // visually empty.
  const showPlaceholder = !card.title && hovered;
  return (
    <button
      data-no-drag
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(e.shiftKey);
        if (!e.shiftKey) setEditing(true);
      }}
      className={cn('leading-tight', multiline ? 'break-words' : 'truncate', className)}
      style={style}
      title={card.title || 'Add text'}
    >
      {card.title || (showPlaceholder ? <span className="opacity-40">Add text</span> : '\u00A0')}
    </button>
  );
}

function ResizeHandle({
  side,
  onResizeStart,
}: {
  side: 'left' | 'right';
  onResizeStart: (e: React.PointerEvent, side: 'left' | 'right') => void;
}) {
  return (
    <div
      data-no-drag
      onPointerDown={(e) => {
        e.stopPropagation();
        onResizeStart(e, side);
      }}
      className={cn(
        'group absolute top-1 bottom-1 w-2 cursor-ew-resize',
        side === 'left' ? 'left-0 rounded-l' : 'right-0 rounded-r',
      )}
      style={{ touchAction: 'none' }}
    >
      <div className="bg-fgAccent1 mx-auto h-full w-0.5 rounded opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}
