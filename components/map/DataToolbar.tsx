'use client';

import * as React from 'react';
import type { MapCard, MapColor, MapViz } from '@/lib/repo/schemas';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/bytes/Popover';
import {
  ChevronDownSmallIcon,
  PlusSmallIcon,
  TrashCanIcon,
  AnalyticsIcon,
} from '@/icons/react';
import { cn } from '@/lib/bytes/utils';
import { COLOR_HEX, MAP_COLORS, colorLabel } from './colors';
import { ToolbarShell } from './ToolbarShell';
import type { MapActions } from './use-map-store';
import type { ViewportBounds } from './MapCanvas';

interface DataToolbarProps {
  card: MapCard;
  anchorX: number;
  anchorTop: number;
  anchorBottom: number;
  bounds: ViewportBounds;
  actions: MapActions;
}

const VIZ_LABELS: Record<MapViz, string> = {
  line: 'Line',
  multiLine: 'Multiple lines',
  bars: 'Bars',
  stackedBars: 'Stacked bars',
  scatter: 'Scatter',
  lineWithPoints: 'Line + points',
};
const VIZ_ORDER: MapViz[] = ['line', 'multiLine', 'bars', 'stackedBars', 'scatter', 'lineWithPoints'];

export function DataToolbar({ card, anchorX, anchorTop, anchorBottom, bounds, actions }: DataToolbarProps) {
  const viz: MapViz = card.viz ?? 'line';
  const series = card.series ?? [];
  const multi = viz === 'multiLine' || viz === 'stackedBars';

  return (
    <ToolbarShell anchorX={anchorX} anchorTop={anchorTop} anchorBottom={anchorBottom} bounds={bounds}>
      <span className="text-fg3 inline-flex items-center gap-1 px-1.5 text-[11px] font-medium">
        <AnalyticsIcon className="h-3.5 w-3.5" /> Data
      </span>

      <Sep />

      {/* Visualization type */}
      <Dropdown
        label="Chart type"
        wide
        trigger={<span className="text-xs">{VIZ_LABELS[viz]}</span>}
      >
        {(close) =>
          VIZ_ORDER.map((v) => (
            <MenuItem
              key={v}
              active={viz === v}
              onClick={() => {
                actions.setViz(card.id, v);
                if ((v === 'multiLine' || v === 'stackedBars') && series.length < 2) {
                  actions.addSeries(card.id);
                }
                close();
              }}
            >
              {VIZ_LABELS[v]}
            </MenuItem>
          ))
        }
      </Dropdown>

      <Sep />

      {/* Series colors */}
      <div className="flex items-center gap-0.5">
        {series.map((s) => (
          <SeriesColor
            key={s.id}
            color={s.color}
            label={s.label || 'Series'}
            canRemove={series.length > 1}
            onPick={(c) => actions.setSeriesColor(card.id, s.id, c)}
            onRemove={() => actions.removeSeries(card.id, s.id)}
          />
        ))}
        {multi && (
          <button
            type="button"
            aria-label="Add series"
            title="Add series"
            onClick={() => actions.addSeries(card.id)}
            className="text-fg3 hover:bg-bg2 hover:text-fg1 inline-flex h-7 w-7 items-center justify-center rounded-lg"
          >
            <PlusSmallIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      <Sep />

      <button
        type="button"
        aria-label="Delete card"
        onClick={() => actions.removeCard(card.id)}
        className="text-fg3 hover:text-fgSerious1 hover:bg-bg2 inline-flex h-8 w-8 items-center justify-center rounded-lg"
      >
        <TrashCanIcon className="h-4 w-4" />
      </button>
    </ToolbarShell>
  );
}

function Sep() {
  return <span className="bg-separator1 mx-0.5 h-5 w-px" />;
}

function SeriesColor({
  color,
  label,
  canRemove,
  onPick,
  onRemove,
}: {
  color: MapColor;
  label: string;
  canRemove: boolean;
  onPick: (c: MapColor) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={label}
          aria-label={`${label} color`}
          className="hover:bg-bg2 inline-flex h-7 items-center gap-1 rounded-lg px-1"
        >
          <span className="h-3.5 w-3.5 rounded-full" style={{ background: COLOR_HEX[color] }} />
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
              className={cn('h-6 w-6 rounded-full', color === c && 'ring-fgAccent1 ring-offset-bg2 ring-2 ring-offset-1')}
              style={{ background: COLOR_HEX[c] }}
            />
          ))}
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={() => {
              onRemove();
              setOpen(false);
            }}
            className="text-fgSerious1 hover:bg-bg2 mt-1.5 flex w-full items-center gap-1 rounded px-2 py-1 text-xs"
          >
            <TrashCanIcon className="h-3 w-3" /> Remove series
          </button>
        )}
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
            wide ? 'min-w-[96px] justify-between' : '',
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
