'use client';

import * as React from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';

import { Button } from '@/components/bytes/Button';
import { Instructions, InstructionsStep } from '@/components/common/Instructions';
import { Badge } from '@/components/bytes/Badge';
import {
  CirclePlusIcon,
  ArrowOutOfBoxIcon,
  Chart5Icon,
  ArrowUndoUpIcon,
  CircleInfoIcon,
} from '@/icons/react';
import { cn } from '@/lib/bytes/utils';
import type { Card as CardItem, Group } from '@/lib/card-sort/types';
import { CARDS, CARDS_BY_ID } from '@/lib/card-sort/items';
import { clearDraft, loadDraft, saveDraft } from '@/lib/card-sort/storage';

import { Column } from './column';
import { SortableCard } from './sortable-card';
import { GroupPanel } from './group-panel';
import { NotUsefulDivider } from './not-useful-divider';
import { DotFill } from './dot-fill';

interface CardSortProps {
  onShowResults: () => void;
  onSubmitted: () => void;
}

const UNSORTED = 'unsorted';
const NOT_USEFUL = 'notUseful';
const GROUP_PREFIX = 'group:';

const initialOrder = CARDS.map((c) => c.id);

function uid(prefix: string) {
  return `${prefix}${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function newGroup(): Group {
  return { id: uid('g_'), label: 'Untitled group', cardIds: [] };
}

interface State {
  /** All ids in their canonical order in the center column. The split index controls which
   * slice is "not useful". */
  unsorted: string[];
  /** Number of trailing items in `unsorted` that are below the not-useful divider. */
  notUsefulCount: number;
  groups: Group[];
}

function defaultState(): State {
  return {
    unsorted: [...initialOrder],
    notUsefulCount: 0,
    groups: [],
  };
}

export function CardSort({ onShowResults, onSubmitted }: CardSortProps) {
  const [state, setState] = React.useState<State>(defaultState);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [dividerPx, setDividerPx] = React.useState<number | null>(null);
  const columnRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  React.useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      const known = new Set(initialOrder);
      const cleanUnsorted = draft.unsorted.filter((id) => known.has(id));
      const cleanGroups = draft.groups.map((g) => ({
        ...g,
        cardIds: g.cardIds.filter((id) => known.has(id)),
      }));
      const inGroups = new Set(cleanGroups.flatMap((g) => g.cardIds));
      const allKnown = initialOrder.filter((id) => !inGroups.has(id));
      const merged: string[] = [];
      const cleanSet = new Set(cleanUnsorted);
      for (const id of cleanUnsorted) {
        if (!inGroups.has(id)) merged.push(id);
      }
      for (const id of allKnown) {
        if (!cleanSet.has(id)) merged.push(id);
      }
      setState({
        unsorted: merged,
        notUsefulCount: Math.min(draft.notUsefulCount ?? 0, merged.length),
        groups: cleanGroups,
      });
    }
  }, []);

  React.useEffect(() => {
    saveDraft({
      unsorted: state.unsorted,
      notUsefulCount: state.notUsefulCount,
      groups: state.groups,
    });
  }, [state]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const splitIndex = state.unsorted.length - state.notUsefulCount;
  const usefulIds = state.unsorted.slice(0, splitIndex);
  const notUsefulIds = state.unsorted.slice(splitIndex);

  const findContainer = React.useCallback(
    (id: string): string | null => {
      if (id === UNSORTED || id === NOT_USEFUL) return id;
      if (id.startsWith(GROUP_PREFIX)) return id;
      const inUseful = usefulIds.indexOf(id) !== -1;
      if (inUseful) return UNSORTED;
      const inNotUseful = notUsefulIds.indexOf(id) !== -1;
      if (inNotUseful) return NOT_USEFUL;
      for (const g of state.groups) {
        if (g.cardIds.includes(id)) return GROUP_PREFIX + g.id;
      }
      return null;
    },
    [usefulIds, notUsefulIds, state.groups],
  );

  const moveCardToContainer = React.useCallback(
    (cardId: string, fromContainer: string, toContainer: string, toIndex: number) => {
      setState((prev) => {
        const next = structuredClone(prev) as State;
        const removeFrom = (id: string) => {
          if (id === UNSORTED) {
            const idx = next.unsorted.indexOf(cardId);
            if (idx !== -1 && idx < next.unsorted.length - next.notUsefulCount) {
              next.unsorted.splice(idx, 1);
            }
          } else if (id === NOT_USEFUL) {
            const idx = next.unsorted.indexOf(cardId);
            if (idx !== -1 && idx >= next.unsorted.length - next.notUsefulCount) {
              next.unsorted.splice(idx, 1);
              next.notUsefulCount = Math.max(0, next.notUsefulCount - 1);
            }
          } else if (id.startsWith(GROUP_PREFIX)) {
            const gid = id.slice(GROUP_PREFIX.length);
            const g = next.groups.find((g) => g.id === gid);
            if (g) g.cardIds = g.cardIds.filter((c) => c !== cardId);
          }
        };
        removeFrom(fromContainer);
        if (toContainer === UNSORTED) {
          const usefulLen = next.unsorted.length - next.notUsefulCount;
          const insertAt = Math.min(Math.max(toIndex, 0), usefulLen);
          next.unsorted.splice(insertAt, 0, cardId);
        } else if (toContainer === NOT_USEFUL) {
          const usefulLen = next.unsorted.length - next.notUsefulCount;
          const localIdx = Math.min(Math.max(toIndex, 0), next.notUsefulCount);
          next.unsorted.splice(usefulLen + localIdx, 0, cardId);
          next.notUsefulCount += 1;
        } else if (toContainer.startsWith(GROUP_PREFIX)) {
          const gid = toContainer.slice(GROUP_PREFIX.length);
          const g = next.groups.find((g) => g.id === gid);
          if (g) {
            const insertAt = Math.min(Math.max(toIndex, 0), g.cardIds.length);
            g.cardIds.splice(insertAt, 0, cardId);
          }
        }
        return next;
      });
      setHasChanges(true);
    },
    [],
  );

  const reorderInContainer = React.useCallback(
    (containerId: string, fromIndex: number, toIndex: number) => {
      setState((prev) => {
        const next = structuredClone(prev) as State;
        if (containerId === UNSORTED) {
          const usefulLen = next.unsorted.length - next.notUsefulCount;
          const useful = arrayMove(next.unsorted.slice(0, usefulLen), fromIndex, toIndex);
          next.unsorted = [...useful, ...next.unsorted.slice(usefulLen)];
        } else if (containerId === NOT_USEFUL) {
          const usefulLen = next.unsorted.length - next.notUsefulCount;
          const notUseful = arrayMove(next.unsorted.slice(usefulLen), fromIndex, toIndex);
          next.unsorted = [...next.unsorted.slice(0, usefulLen), ...notUseful];
        } else if (containerId.startsWith(GROUP_PREFIX)) {
          const gid = containerId.slice(GROUP_PREFIX.length);
          const g = next.groups.find((g) => g.id === gid);
          if (g) g.cardIds = arrayMove(g.cardIds, fromIndex, toIndex);
        }
        return next;
      });
      setHasChanges(true);
    },
    [],
  );

  const indexInContainer = React.useCallback(
    (cardId: string, containerId: string): number => {
      if (containerId === UNSORTED) return usefulIds.indexOf(cardId);
      if (containerId === NOT_USEFUL) return notUsefulIds.indexOf(cardId);
      if (containerId.startsWith(GROUP_PREFIX)) {
        const gid = containerId.slice(GROUP_PREFIX.length);
        const g = state.groups.find((g) => g.id === gid);
        return g ? g.cardIds.indexOf(cardId) : -1;
      }
      return -1;
    },
    [usefulIds, notUsefulIds, state.groups],
  );

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeContainer = findContainer(String(active.id));
    let overContainer = findContainer(String(over.id));
    if (!activeContainer || !overContainer) return;

    if (activeContainer === overContainer) return;

    const overIsContainer =
      String(over.id) === UNSORTED ||
      String(over.id) === NOT_USEFUL ||
      String(over.id).startsWith(GROUP_PREFIX);
    overContainer = overIsContainer ? String(over.id) : overContainer;

    const overIndex = overIsContainer
      ? containerLength(overContainer)
      : indexInContainer(String(over.id), overContainer);

    moveCardToContainer(String(active.id), activeContainer, overContainer, overIndex);
  };

  const containerLength = (id: string) => {
    if (id === UNSORTED) return usefulIds.length;
    if (id === NOT_USEFUL) return notUsefulIds.length;
    if (id.startsWith(GROUP_PREFIX)) {
      const gid = id.slice(GROUP_PREFIX.length);
      return state.groups.find((g) => g.id === gid)?.cardIds.length ?? 0;
    }
    return 0;
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const activeContainer = findContainer(String(active.id));
    let overContainer = findContainer(String(over.id));
    if (!activeContainer || !overContainer) return;

    const overIsContainer =
      String(over.id) === UNSORTED ||
      String(over.id) === NOT_USEFUL ||
      String(over.id).startsWith(GROUP_PREFIX);
    overContainer = overIsContainer ? String(over.id) : overContainer;

    if (activeContainer === overContainer) {
      const fromIndex = indexInContainer(String(active.id), activeContainer);
      const toIndex = overIsContainer
        ? containerLength(overContainer) - 1
        : indexInContainer(String(over.id), overContainer);
      if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
        reorderInContainer(activeContainer, fromIndex, toIndex);
      }
    }
  };

  const onAddGroup = () => {
    setState((prev) => ({ ...prev, groups: [...prev.groups, newGroup()] }));
    setHasChanges(true);
  };

  const onRenameGroup = (id: string, label: string) => {
    setState((prev) => ({
      ...prev,
      groups: prev.groups.map((g) => (g.id === id ? { ...g, label } : g)),
    }));
    setHasChanges(true);
  };

  const onDeleteGroup = (id: string) => {
    setState((prev) => {
      const g = prev.groups.find((g) => g.id === id);
      if (!g) return prev;
      const usefulLen = prev.unsorted.length - prev.notUsefulCount;
      return {
        ...prev,
        groups: prev.groups.filter((x) => x.id !== id),
        unsorted: [
          ...prev.unsorted.slice(0, usefulLen),
          ...g.cardIds,
          ...prev.unsorted.slice(usefulLen),
        ],
      };
    });
    setHasChanges(true);
  };

  const onResetDraft = () => {
    setState(defaultState());
    setHasChanges(false);
    clearDraft();
  };

  // Divider drag handling — translate clientY into a split index.
  const measureSplitIndexAt = (clientY: number): number => {
    const container = columnRef.current;
    if (!container) return splitIndex;
    const all = state.unsorted;
    if (all.length === 0) return 0;
    let nearestIdx = 0;
    let nearestDist = Infinity;
    for (let i = 0; i <= all.length; i++) {
      let yMid: number;
      if (i === all.length) {
        const lastEl = cardRefs.current[all[i - 1]!];
        if (!lastEl) continue;
        const rect = lastEl.getBoundingClientRect();
        yMid = rect.bottom;
      } else {
        const el = cardRefs.current[all[i]!];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        yMid = rect.top;
      }
      const dist = Math.abs(yMid - clientY);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
      }
    }
    return nearestIdx;
  };

  const onDividerDragStart = () => {
    setDividerPx(null);
  };

  const onDividerDrag = (clientY: number) => {
    setDividerPx(clientY);
    const idx = measureSplitIndexAt(clientY);
    setState((prev) => {
      const newNotUseful = Math.max(0, prev.unsorted.length - idx);
      if (newNotUseful === prev.notUsefulCount) return prev;
      setHasChanges(true);
      return { ...prev, notUsefulCount: newNotUseful };
    });
  };

  const onDividerDragEnd = () => {
    setDividerPx(null);
  };

  const activeCard: CardItem | null = activeId ? CARDS_BY_ID[activeId] ?? null : null;
  const activeContainer = activeId ? findContainer(activeId) : null;
  const activeOrder =
    activeId && activeContainer === UNSORTED
      ? usefulIds.indexOf(activeId) + 1
      : activeId && activeContainer && activeContainer.startsWith(GROUP_PREFIX)
        ? (() => {
            const gid = activeContainer.slice(GROUP_PREFIX.length);
            const g = state.groups.find((g) => g.id === gid);
            return g ? g.cardIds.indexOf(activeId) + 1 : null;
          })()
        : null;

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const usefulLen = state.unsorted.length - state.notUsefulCount;
      const payload = {
        groups: state.groups.map((g) => ({
          id: g.id,
          label: g.label,
          cardIds: g.cardIds,
        })),
        unsorted: state.unsorted.slice(0, usefulLen),
        notUseful: state.unsorted.slice(usefulLen),
      };
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || 'Failed to submit');
      }
      clearDraft();
      setState(defaultState());
      setHasChanges(false);
      onSubmitted();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      modifiers={[restrictToWindowEdges]}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
        <Header
          hasChanges={hasChanges}
          submitting={submitting}
          error={error}
          onSubmit={onSubmit}
          onShowResults={onShowResults}
          onResetDraft={onResetDraft}
        />

        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[minmax(320px,420px)_1fr]">
          {/* Center column with not-useful divider */}
          <div className="flex flex-col gap-3">
            <ColumnHeading
              title="Items to sort"
              countLabel={`${state.unsorted.length} cards`}
            />
            <div
              ref={columnRef}
              className="border-separator1 bg-bg1 relative flex flex-col gap-2 rounded-lg border p-3"
            >
              <Column id={UNSORTED} cardIds={usefulIds}>
                {usefulIds.map((id, idx) => (
                  <div
                    key={id}
                    ref={(el) => {
                      cardRefs.current[id] = el;
                    }}
                  >
                    <SortableCard
                      card={CARDS_BY_ID[id]!}
                      order={idx + 1}
                      tone="ok"
                      containerId={UNSORTED}
                    />
                  </div>
                ))}
                {usefulIds.length === 0 && state.notUsefulCount > 0 && (
                  <EmptyDropZone label="Drop cards here" />
                )}
              </Column>

              <NotUsefulDivider
                onDragStart={onDividerDragStart}
                onDrag={onDividerDrag}
                onDragEnd={onDividerDragEnd}
              />

              <Column id={NOT_USEFUL} cardIds={notUsefulIds}>
                {notUsefulIds.map((id) => (
                  <div
                    key={id}
                    ref={(el) => {
                      cardRefs.current[id] = el;
                    }}
                  >
                    <SortableCard
                      card={CARDS_BY_ID[id]!}
                      order={null}
                      tone="danger"
                      containerId={NOT_USEFUL}
                    />
                  </div>
                ))}
                {notUsefulIds.length === 0 && (
                  <NotUsefulHint />
                )}
              </Column>

              {dividerPx !== null && (
                <div className="text-fgSerious1 pointer-events-none absolute right-3 -translate-y-1/2 font-mono text-[10px] font-bold uppercase tracking-wider"
                  style={{ top: dividerPx - (columnRef.current?.getBoundingClientRect().top ?? 0) }}
                >
                  {state.notUsefulCount} not useful
                </div>
              )}
            </div>
          </div>

          {/* Groups */}
          <div className="flex flex-col gap-3">
            <ColumnHeading
              title="Groups"
              countLabel={`${state.groups.length} group${state.groups.length === 1 ? '' : 's'}`}
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<CirclePlusIcon />}
                  onClick={onAddGroup}
                >
                  New group
                </Button>
              }
            />

            {state.groups.length === 0 ? (
              <EmptyGroups onAdd={onAddGroup} />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {state.groups.map((g) => {
                  const containerId = GROUP_PREFIX + g.id;
                  return (
                    <GroupPanel
                      key={g.id}
                      label={g.label}
                      count={g.cardIds.length}
                      onRename={(label) => onRenameGroup(g.id, label)}
                      onDelete={() => onDeleteGroup(g.id)}
                    >
                      <Column id={containerId} cardIds={g.cardIds} flush>
                        {g.cardIds.length === 0 && <GroupEmptyHint />}
                        {g.cardIds.map((id, idx) => (
                          <SortableCard
                            key={id}
                            card={CARDS_BY_ID[id]!}
                            order={idx + 1}
                            tone="ok"
                            containerId={containerId}
                            groupId={g.id}
                          />
                        ))}
                      </Column>
                    </GroupPanel>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeCard ? (
          <SortableCard
            card={activeCard}
            order={activeOrder ?? null}
            tone={activeContainer === NOT_USEFUL ? 'danger' : 'ok'}
            containerId="overlay"
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function Header({
  hasChanges,
  submitting,
  error,
  onSubmit,
  onShowResults,
  onResetDraft,
}: {
  hasChanges: boolean;
  submitting: boolean;
  error: string | null;
  onSubmit: () => void;
  onShowResults: () => void;
  onResetDraft: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Badge variant="accent" size="medium">
              Card sort
            </Badge>
            <h1 className="font-display text-fg0 text-2xl">Sessions UI · Information architecture</h1>
          </div>
          <p className="text-fg3 max-w-2xl text-sm">
            Help us figure out how to organize the metrics, configuration, and events that show up in
            a session view. Drag the cards to reorder them by importance, group related items, and
            mark anything you don&apos;t care about as not useful.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ArrowUndoUpIcon />}
              onClick={onResetDraft}
            >
              Reset
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Chart5Icon />}
            onClick={onShowResults}
          >
            Show results
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<ArrowOutOfBoxIcon />}
            disabled={!hasChanges || submitting}
            onClick={onSubmit}
          >
            {submitting ? 'Submitting…' : 'Submit my sort'}
          </Button>
        </div>
      </div>
      <Instructions title="How to sort" icon={<CircleInfoIcon className="text-fgAccent1 h-4 w-4" />}>
        <InstructionsStep title="Reorder by importance">
          Drag any card up or down. The number in the corner shows its current position.
        </InstructionsStep>
        <InstructionsStep title="Group related items (optional)">
          Click <span className="font-semibold">New group</span>, give it a name, then drag cards in.
          You can rearrange within a group too.
        </InstructionsStep>
        <InstructionsStep title="Mark anything irrelevant as not useful">
          Drag the red <span className="text-fgSerious1 font-semibold">Not useful</span> divider up to
          push cards below the line. Their order doesn&apos;t matter — they&apos;re just out. Drag the
          line back down to restore them.
        </InstructionsStep>
      </Instructions>
      {error && (
        <div className="border-separatorSerious1 bg-bgSerious1 text-fgSerious1 rounded-md border px-3 py-2 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}

function ColumnHeading({
  title,
  countLabel,
  action,
}: {
  title: string;
  countLabel: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h2 className="text-fg0 text-sm font-semibold">{title}</h2>
        <span className="bg-bg2 text-fg3 inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider">
          {countLabel}
        </span>
      </div>
      {action}
    </div>
  );
}

function EmptyDropZone({ label }: { label: string }) {
  return (
    <div className="border-separator1 text-fg4 relative flex h-12 items-center justify-center overflow-hidden rounded-md border border-dashed text-xs font-medium">
      <DotFill tone="fg" opacity={0.25} />
      <span className="relative">{label}</span>
    </div>
  );
}

function NotUsefulHint() {
  return (
    <div className="border-separatorSerious1 text-fgSerious1 relative flex min-h-12 items-center justify-center overflow-hidden rounded-md border border-dashed px-3 py-2 text-center text-xs font-medium">
      <DotFill tone="serious" opacity={0.35} />
      <span className="relative">
        Drag the red line up — anything below becomes &ldquo;not useful&rdquo;.
      </span>
    </div>
  );
}

function GroupEmptyHint() {
  return (
    <div className="border-separator1 text-fg4 relative flex min-h-16 items-center justify-center overflow-hidden rounded-md border border-dashed px-3 py-2 text-center text-xs font-medium">
      <DotFill tone="accent" opacity={0.2} />
      <span className="relative">Drop cards here</span>
    </div>
  );
}

function EmptyGroups({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="border-separator1 bg-bg1 relative flex min-h-64 flex-col items-center justify-center gap-3 overflow-hidden rounded-lg border border-dashed p-6 text-center">
      <DotFill tone="accent" opacity={0.18} />
      <div className="relative flex flex-col items-center gap-1">
        <h3 className="text-fg0 text-sm font-semibold">No groups yet</h3>
        <p className="text-fg3 max-w-xs text-xs">
          Optional: create groups to bucket related cards together. The number of groups and their
          names are completely up to you.
        </p>
      </div>
      <Button
        className={cn('relative')}
        variant="secondary"
        size="sm"
        leftIcon={<CirclePlusIcon />}
        onClick={onAdd}
      >
        Create your first group
      </Button>
    </div>
  );
}
