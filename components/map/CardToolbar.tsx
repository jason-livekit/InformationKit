'use client';

import * as React from 'react';
import type { MapCard, MapColor } from '@/lib/repo/schemas';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/bytes/Popover';
import {
  ItalicIcon,
  AlignmentLeftIcon,
  AlignmentCenterIcon,
  AlignmentRightIcon,
  ChevronDownSmallIcon,
  TrashCanIcon,
  SquarePlaceholderDashedIcon,
} from '@/icons/react';
import { cn } from '@/lib/bytes/utils';
import { CARD_SURFACE, COLOR_HEX, FILL_STYLES, MAP_COLORS, colorLabel } from './colors';
import type { FillStyle } from './colors';
import type { FontScale } from './constants';
import { ToolbarShell } from './ToolbarShell';
import type { CardStylePatch, MapActions } from './use-map-store';
import type { ViewportBounds } from './MapCanvas';

interface CardToolbarProps {
  /** Representative card (shows current values). */
  card: MapCard;
  /** All selected card ids the edits apply to. */
  cardIds: string[];
  anchorX: number;
  anchorTop: number;
  anchorBottom: number;
  bounds: ViewportBounds;
  actions: MapActions;
}

const OUTLINE_STYLES: Array<{ value: 'solid' | 'dashed' | 'none'; label: string }> = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'none', label: 'None' },
];

const FONT_SCALES: Array<{ value: FontScale; label: string }> = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

export function CardToolbar({ card, cardIds, anchorX, anchorTop, anchorBottom, bounds, actions }: CardToolbarProps) {
  const apply = (patch: CardStylePatch) => cardIds.forEach((id) => actions.setCardStyle(id, patch));
  const align = card.align ?? 'center';
  const fontScale = card.fontScale ?? 'medium';

  return (
    <ToolbarShell anchorX={anchorX} anchorTop={anchorTop} anchorBottom={anchorBottom} bounds={bounds}>
      {cardIds.length > 1 && (
        <>
          <span className="text-fg3 px-1 text-[11px] font-medium tabular-nums">{cardIds.length}</span>
          <Sep />
        </>
      )}

      <ColorButton
        label="Fill"
        swatch={<span className="h-4 w-4 rounded-full" style={{ background: COLOR_HEX[card.color] }} />}
        value={card.color}
        onPick={(c) => apply({ color: c })}
      />
      <Dropdown
        label="Fill style"
        trigger={<FillSwatch color={card.color} fill={card.fillStyle} />}
      >
        {(close) =>
          FILL_STYLES.map((o) => (
            <MenuItem
              key={o.value}
              active={(card.fillStyle ?? 'soft') === o.value}
              onClick={() => {
                apply({ fillStyle: o.value });
                close();
              }}
            >
              <span className="flex items-center gap-2">
                <FillSwatch color={card.color} fill={o.value} />
                {o.label}
              </span>
            </MenuItem>
          ))
        }
      </Dropdown>

      <Sep />

      <ColorButton
        label="Outline color"
        swatch={
          <span
            className="h-4 w-4 rounded-full border-2"
            style={{ borderColor: COLOR_HEX[card.outlineColor ?? card.color] }}
          />
        }
        value={card.outlineColor ?? card.color}
        onPick={(c) => apply({ outlineColor: c })}
      />
      <Dropdown label="Outline style" trigger={<SquarePlaceholderDashedIcon className="h-4 w-4" />}>
        {(close) =>
          OUTLINE_STYLES.map((o) => (
            <MenuItem
              key={o.value}
              active={(card.outlineStyle ?? 'solid') === o.value}
              onClick={() => {
                apply({ outlineStyle: o.value });
                close();
              }}
            >
              {o.label}
            </MenuItem>
          ))
        }
      </Dropdown>

      <Sep />

      <Dropdown
        label="Text size"
        wide
        trigger={
          <span className="inline-flex items-center gap-1">
            <span className="font-semibold leading-none">Aa</span>
            <span className="text-fg3 text-[11px] capitalize">{fontScale}</span>
          </span>
        }
      >
        {(close) =>
          FONT_SCALES.map((f) => (
            <MenuItem
              key={f.value}
              active={fontScale === f.value}
              onClick={() => {
                apply({ fontScale: f.value });
                close();
              }}
            >
              {f.label}
            </MenuItem>
          ))
        }
      </Dropdown>

      <Sep />

      <Toggle label="Bold" active={!!card.bold} onClick={() => apply({ bold: !card.bold })}>
        <span className="font-bold leading-none">B</span>
      </Toggle>
      <Toggle label="Italic" active={!!card.italic} onClick={() => apply({ italic: !card.italic })}>
        <ItalicIcon className="h-3.5 w-3.5" />
      </Toggle>
      <Toggle label="Strikethrough" active={!!card.strike} onClick={() => apply({ strike: !card.strike })}>
        <span className="leading-none line-through">S</span>
      </Toggle>

      <Sep />

      <Dropdown
        label="Alignment"
        trigger={<AlignIcon align={align} />}
      >
        {(close) => (
          <div className="flex gap-0.5">
            {(['left', 'center', 'right'] as const).map((a) => (
              <button
                key={a}
                type="button"
                aria-label={a}
                onClick={() => {
                  apply({ align: a });
                  close();
                }}
                className={cn(
                  'hover:bg-bg2 inline-flex h-7 w-7 items-center justify-center rounded',
                  align === a && 'bg-bg2 text-fgAccent1',
                )}
              >
                <AlignIcon align={a} />
              </button>
            ))}
          </div>
        )}
      </Dropdown>

      <Sep />

      <button
        type="button"
        aria-label={cardIds.length > 1 ? 'Delete cards' : 'Delete card'}
        onClick={() => cardIds.forEach((id) => actions.removeCard(id))}
        className="text-fg3 hover:text-fgSerious1 hover:bg-bg2 inline-flex h-8 w-8 items-center justify-center rounded-lg"
      >
        <TrashCanIcon className="h-4 w-4" />
      </button>
    </ToolbarShell>
  );
}

function FillSwatch({ color, fill }: { color: MapColor; fill: FillStyle | undefined }) {
  const f = fill ?? 'soft';
  const hex = COLOR_HEX[color];
  const style: React.CSSProperties =
    f === 'solid'
      ? { background: hex, border: `1.5px solid ${hex}` }
      : f === 'none'
        ? { background: 'transparent', border: `1.5px dashed ${hex}` }
        : { background: `${hex}2E`, border: `1.5px solid ${hex}` };
  return <span className="h-4 w-4 rounded" style={style} />;
}

function AlignIcon({ align }: { align: 'left' | 'center' | 'right' }) {
  if (align === 'left') return <AlignmentLeftIcon className="h-4 w-4" />;
  if (align === 'right') return <AlignmentRightIcon className="h-4 w-4" />;
  return <AlignmentCenterIcon className="h-4 w-4" />;
}

function Sep() {
  return <span className="bg-separator1 mx-0.5 h-5 w-px" />;
}

function Toggle({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
      className={cn(
        'text-fg2 hover:bg-bg2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm',
        active && 'bg-fgAccent1/15 text-fgAccent1',
      )}
    >
      {children}
    </button>
  );
}

function ColorButton({
  label,
  swatch,
  value,
  onPick,
}: {
  label: string;
  swatch: React.ReactNode;
  value: MapColor;
  onPick: (c: MapColor) => void;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          title={label}
          className="text-fg2 hover:bg-bg2 inline-flex h-8 items-center gap-1 rounded-lg px-1.5"
        >
          {swatch}
          <ChevronDownSmallIcon className="text-fg4 h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" className="z-[60] w-auto p-2">
        <div className="grid grid-cols-5 gap-1.5">
          {MAP_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={colorLabel(c)}
              title={colorLabel(c)}
              onClick={() => {
                onPick(c);
                setOpen(false);
              }}
              className={cn(
                'h-6 w-6 rounded-full',
                CARD_SURFACE[c].swatch,
                value === c && 'ring-fgAccent1 ring-offset-bg2 ring-2 ring-offset-1',
              )}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Dropdown({
  label,
  trigger,
  children,
  wide,
}: {
  label: string;
  trigger: React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  wide?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          title={label}
          className={cn(
            'text-fg2 hover:bg-bg2 inline-flex h-8 items-center gap-1 rounded-lg px-1.5',
            wide ? 'min-w-[64px]' : '',
          )}
        >
          {trigger}
          <ChevronDownSmallIcon className="text-fg4 h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" className="z-[60] w-auto min-w-[8rem] p-1">
        <div className="flex flex-col">{children(() => setOpen(false))}</div>
      </PopoverContent>
    </Popover>
  );
}

function MenuItem({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'hover:bg-bg2 flex items-center justify-between rounded px-2 py-1.5 text-left text-xs',
        active ? 'text-fgAccent1 font-semibold' : 'text-fg1',
      )}
    >
      {children}
      {active && <span className="text-fgAccent1 ml-2">✓</span>}
    </button>
  );
}
