'use client';

import * as React from 'react';
import type { JourneyMap, MapCard, MapColor, MapViz } from '@/lib/repo/schemas';
import * as grid from './grid';

export type SaveState = 'idle' | 'saving' | 'saved';

/** Presentation fields editable from the floating card toolbar. */
export type CardStylePatch = Partial<
    Pick<
      MapCard,
      | 'color'
      | 'fillStyle'
      | 'outlineColor'
    | 'outlineStyle'
    | 'fontScale'
    | 'bold'
    | 'italic'
    | 'strike'
    | 'align'
  >
>;

export interface MapActions {
  setName: (name: string) => void;
  addCard: (input: grid.AddCardInput) => string;
  insertCardAt: (laneId: string, col: number, kind?: MapCard['kind']) => string;
  updateCard: (cardId: string, patch: Partial<MapCard>) => void;
  removeCard: (cardId: string) => void;
  moveCard: (cardId: string, laneId: string, startCol: number) => void;
  resizeCard: (cardId: string, newSpan: number) => void;
  resizeCardLeft: (cardId: string, newStartCol: number) => void;
  setCardColor: (cardId: string, color: MapColor) => void;
  setCardTitle: (cardId: string, title: string) => void;
  setCardStyle: (cardId: string, patch: CardStylePatch) => void;
  // data card
  setViz: (cardId: string, viz: MapViz) => void;
  setPointValue: (cardId: string, col: number, seriesId: string, value: number) => void;
  addSeries: (cardId: string) => void;
  setSeriesColor: (cardId: string, seriesId: string, color: MapColor) => void;
  removeSeries: (cardId: string, seriesId: string) => void;
  // lanes
  addLane: (name?: string, atIndex?: number) => void;
  renameLane: (laneId: string, name: string) => void;
  removeLane: (laneId: string) => void;
  moveLane: (fromIndex: number, toIndex: number) => void;
}

export interface MapStore {
  map: JourneyMap;
  actions: MapActions;
  saveState: SaveState;
}

export function useMapStore(initial: JourneyMap): MapStore {
  const [map, setMap] = React.useState<JourneyMap>(() => grid.normalize(initial));
  const [saveState, setSaveState] = React.useState<SaveState>('idle');

  const dirtyRef = React.useRef(false);
  const mapRef = React.useRef(map);
  mapRef.current = map;

  // Debounced autosave whenever the map changes (after the first render).
  React.useEffect(() => {
    if (!dirtyRef.current) return;
    setSaveState('saving');
    const t = setTimeout(async () => {
      const m = mapRef.current;
      try {
        await fetch(`/api/maps/${m.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: m.name,
            description: m.description,
            swimlanes: m.swimlanes,
            cards: m.cards,
            columnCount: m.columnCount,
          }),
        });
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 1400);
      } catch {
        setSaveState('idle');
      }
      dirtyRef.current = false;
    }, 700);
    return () => clearTimeout(t);
  }, [map]);

  // Wrap a grid mutation so every action marks the map dirty for autosave.
  const mutate = React.useCallback((fn: (m: JourneyMap) => JourneyMap) => {
    dirtyRef.current = true;
    setMap((prev) => fn(prev));
  }, []);

  const actions = React.useMemo<MapActions>(() => {
    let lastAddedId = '';
    return {
      setName: (name) => mutate((m) => ({ ...m, name: name.trim() || 'Untitled map' })),
      addCard: (input) => {
        dirtyRef.current = true;
        setMap((prev) => {
          const { map: next, cardId } = grid.addCard(prev, input);
          lastAddedId = cardId;
          return next;
        });
        return lastAddedId;
      },
      insertCardAt: (laneId, col, kind) => {
        dirtyRef.current = true;
        setMap((prev) => {
          const { map: next, cardId } = grid.insertCardAt(prev, laneId, col, kind);
          lastAddedId = cardId;
          return next;
        });
        return lastAddedId;
      },
      updateCard: (cardId, patch) => mutate((m) => grid.updateCard(m, cardId, patch)),
      removeCard: (cardId) => mutate((m) => grid.removeCard(m, cardId)),
      moveCard: (cardId, laneId, startCol) => mutate((m) => grid.moveCard(m, cardId, laneId, startCol)),
      resizeCard: (cardId, newSpan) => mutate((m) => grid.resizeCard(m, cardId, newSpan)),
      resizeCardLeft: (cardId, newStartCol) => mutate((m) => grid.resizeCardLeft(m, cardId, newStartCol)),
      setCardColor: (cardId, color) => mutate((m) => grid.updateCard(m, cardId, { color })),
      setCardTitle: (cardId, title) => mutate((m) => grid.updateCard(m, cardId, { title })),
      setCardStyle: (cardId, patch) => mutate((m) => grid.updateCard(m, cardId, patch)),
      setViz: (cardId, viz) => mutate((m) => grid.updateCard(m, cardId, { viz })),
      setPointValue: (cardId, col, seriesId, value) =>
        mutate((m) => {
          const card = grid.findCard(m, cardId);
          if (!card || !card.points) return m;
          const points = card.points.map((p) =>
            p.col === col ? { ...p, values: { ...p.values, [seriesId]: value } } : p,
          );
          return grid.updateCard(m, cardId, { points });
        }),
      addSeries: (cardId) =>
        mutate((m) => {
          const card = grid.findCard(m, cardId);
          if (!card) return m;
          const idx = (card.series?.length ?? 0) + 1;
          const sid = `s_${Date.now().toString(36)}_${idx}`;
          const palette: MapColor[] = ['blue', 'purple', 'orange', 'green', 'pink', 'teal'];
          const series = [
            ...(card.series ?? []),
            { id: sid, label: `Series ${idx}`, color: palette[(idx - 1) % palette.length]! },
          ];
          const points = (card.points ?? []).map((p) => ({
            ...p,
            values: { ...p.values, [sid]: Math.round(20 + Math.random() * 70) },
          }));
          return grid.updateCard(m, cardId, { series, points });
        }),
      setSeriesColor: (cardId, seriesId, color) =>
        mutate((m) => {
          const card = grid.findCard(m, cardId);
          if (!card?.series) return m;
          const series = card.series.map((s) => (s.id === seriesId ? { ...s, color } : s));
          return grid.updateCard(m, cardId, { series });
        }),
      removeSeries: (cardId, seriesId) =>
        mutate((m) => {
          const card = grid.findCard(m, cardId);
          if (!card?.series || card.series.length <= 1) return m;
          const series = card.series.filter((s) => s.id !== seriesId);
          const points = (card.points ?? []).map((p) => {
            const values = { ...p.values };
            delete values[seriesId];
            return { ...p, values };
          });
          return grid.updateCard(m, cardId, { series, points });
        }),
      addLane: (name, atIndex) => mutate((m) => grid.addLane(m, name ?? '', atIndex)),
      renameLane: (laneId, name) => mutate((m) => grid.renameLane(m, laneId, name)),
      removeLane: (laneId) => mutate((m) => grid.removeLane(m, laneId)),
      moveLane: (fromIndex, toIndex) => mutate((m) => grid.moveLane(m, fromIndex, toIndex)),
    };
  }, [mutate]);

  return { map, actions, saveState };
}
