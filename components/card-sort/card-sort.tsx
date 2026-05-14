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
import { InstructionsStep } from '@/components/common/Instructions';
import { Badge } from '@/components/bytes/Badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/bytes/Collapsible';
import {
  CirclePlusIcon,
  ArrowOutOfBoxIcon,
  Chart5Icon,
  ArrowUndoUpIcon,
  CircleInfoIcon,
  ChevronDownSmallIcon,
} from '@/icons/react';
import { cn } from '@/lib/bytes/utils';
import type { Card as CardItem, Group, SubmissionInput } from '@/lib/repo/schemas';
import { clearDraft, loadDraft, saveDraft } from '@/lib/card-sort/storage';

import { Column } from './column';
import { SortableCard } from './sortable-card';
import { GroupPanel } from './group-panel';
import { NotUsefulDivider } from './not-useful-divider';
import { DotFill } from './dot-fill';

export interface CardSortProps {
  /** The catalog of cards to sort. */
  cards: CardItem[];
  /** Optional groups pre-created by the study author. They appear pre-filled (or empty) on first load. */
  predefinedGroups?: Group[];
  /** Per-instance localStorage key. Pass a study-scoped key like `card-sort:draft:${studyId}`. */
  draftKey: string;
  /** Title shown in the page header. Defaults to the study description text. */
  title?: string;
  /** Subtitle (description) text. */
  subtitle?: string;
  /** Badge label at the top-left. */
  badgeLabel?: string;
  /** Called when the user submits. If omitted, no submit button is shown (preview mode). */
  onSubmit?: (input: SubmissionInput) => Promise<void> | void;
  /** Called when the user wants to view aggregated results. If omitted, the button is hidden. */
  onShowResults?: () => void;
  /** Disables submit + reset + persistence. */
  readOnly?: boolean;
}

const UNSORTED = 'unsorted';
const NOT_USEFUL = 'notUseful';
const GROUP_PREFIX = 'group:';

function uid(prefix: string) {
  return `${prefix}${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function newGroup(): Group {
  return { id: uid('g_'), label: 'Untitled group', cardIds: [] };
}

interface State {
  unsorted: string[];
  notUsefulCount: number;
  groups: Group[];
}

function defaultStateFor(cards: CardItem[], predefinedGroups: Group[]): State {
  const inGroups = new Set(predefinedGroups.flatMap((g) => g.cardIds));
  return {
    unsorted: cards.map((c) => c.id).filter((id) => !inGroups.has(id)),
    notUsefulCount: 0,
    groups: predefinedGroups.map((g) => ({ ...g, cardIds: [...g.cardIds] })),
  };
}

export function CardSort({
  cards,
  predefinedGroups = [],
  draftKey,
  title = 'Card sort',
  subtitle = 'Drag the cards to group related items, reorder them by importance, and mark anything you don’t care about as not useful.',
  badgeLabel = 'Card sort',
  onSubmit,
  onShowResults,
  readOnly = false,
}: CardSortProps) {
  const cardsById = React.useMemo(() => {
    const map: Record<string, CardItem> = {};
    for (const c of cards) map[c.id] = c;
    return map;
  }, [cards]);
  const knownIds = React.useMemo(() => new Set(cards.map((c) => c.id)), [cards]);

  const [mounted, setMounted] = React.useState(false);
  const [state, setState] = React.useState<State>(() =>
    defaultStateFor(cards, predefinedGroups),
  );
  const [hasChanges, setHasChanges] = React.useState(false);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);
  const columnRef = React.useRef<HTMLDivElement>(null);
  const notUsefulRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const dragStartYRef = React.useRef<number>(0);
  const dragStartNotUsefulCountRef = React.useRef<number>(0);

  React.useEffect(() => {
    if (readOnly) return;
    const draft = loadDraft(draftKey);
    if (draft) {
      const cleanUnsorted = draft.unsorted.filter((id) => knownIds.has(id));
      const cleanGroups = draft.groups.map((g) => ({
        ...g,
        cardIds: g.cardIds.filter((id) => knownIds.has(id)),
      }));
      const inGroups = new Set(cleanGroups.flatMap((g) => g.cardIds));
      const allKnown = cards.map((c) => c.id).filter((id) => !inGroups.has(id));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  React.useEffect(() => {
    if (readOnly) return;
    saveDraft(
      {
        unsorted: state.unsorted,
        notUsefulCount: state.notUsefulCount,
        groups: state.groups,
      },
      draftKey,
    );
  }, [state, draftKey, readOnly]);

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

  const containerLength = React.useCallback(
    (id: string) => {
      if (id === UNSORTED) return usefulIds.length;
      if (id === NOT_USEFUL) return notUsefulIds.length;
      if (id.startsWith(GROUP_PREFIX)) {
        const gid = id.slice(GROUP_PREFIX.length);
        return state.groups.find((g) => g.id === gid)?.cardIds.length ?? 0;
      }
      return 0;
    },
    [usefulIds, notUsefulIds, state.groups],
  );

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
    setState(defaultStateFor(cards, predefinedGroups));
    setHasChanges(false);
    clearDraft(draftKey);
  };

  const CARD_STEP_PX = 52;
  const computeNewNotUsefulCount = (clientY: number): number => {
    const dy = clientY - dragStartYRef.current;
    const stepDelta = -Math.round(dy / CARD_STEP_PX);
    const next = dragStartNotUsefulCountRef.current + stepDelta;
    return Math.max(0, Math.min(state.unsorted.length, next));
  };

  const onDividerDragStart = () => {};

  const onDividerDrag = (clientY: number) => {
    if (dragStartYRef.current === 0) return;
    const newNotUseful = computeNewNotUsefulCount(clientY);
    setState((prev) => {
      if (newNotUseful === prev.notUsefulCount) return prev;
      setHasChanges(true);
      return { ...prev, notUsefulCount: newNotUseful };
    });
  };

  const onDividerDragEnd = () => {
    dragStartYRef.current = 0;
  };

  const onDividerPressDown = (clientY: number) => {
    dragStartYRef.current = clientY;
    dragStartNotUsefulCountRef.current = state.notUsefulCount;
  };

  const activeCard: CardItem | null = activeId ? cardsById[activeId] ?? null : null;
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

  const onSubmitClick = async () => {
    if (!onSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      const usefulLen = state.unsorted.length - state.notUsefulCount;
      const payload: SubmissionInput = {
        groups: state.groups.map((g) => ({
          id: g.id,
          label: g.label,
          cardIds: g.cardIds,
        })),
        unsorted: state.unsorted.slice(0, usefulLen),
        notUseful: state.unsorted.slice(usefulLen),
      };
      await onSubmit(payload);
      clearDraft(draftKey);
      setState(defaultStateFor(cards, predefinedGroups));
      setHasChanges(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 pt-8 pb-24">
        <Header title={title} subtitle={subtitle} badgeLabel={badgeLabel} error={null} />
        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[minmax(320px,420px)_1fr]">
          <div className="border-separator1 bg-bg1 relative h-96 animate-pulse rounded-lg border" />
          <div className="border-separator1 bg-bg1 relative h-96 animate-pulse rounded-lg border" />
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      modifiers={[restrictToWindowEdges]}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 pt-8 pb-24">
        <Header title={title} subtitle={subtitle} badgeLabel={badgeLabel} error={error} />

        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[minmax(320px,420px)_1fr]">
          <div className="flex flex-col gap-3 lg:sticky lg:top-[5rem] lg:self-start">
            <ColumnHeading
              title="Items to sort"
              countLabel={`${usefulIds.length} useful · ${state.notUsefulCount} not useful`}
            />
            <div
              className="border-separator1 bg-bg1 relative flex flex-col rounded-lg border"
              style={{ maxHeight: 'min(760px, calc(100svh - 11rem))' }}
            >
              <div
                ref={columnRef}
                className="flex flex-1 flex-col gap-2 overflow-y-auto p-3"
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
                        card={cardsById[id]!}
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
              </div>
              <div className="border-t-separator1 bg-bg1 relative flex flex-col gap-2 border-t px-3 pt-1 pb-3">
                <NotUsefulDivider
                  onPressDown={onDividerPressDown}
                  onDragStart={onDividerDragStart}
                  onDrag={onDividerDrag}
                  onDragEnd={onDividerDragEnd}
                />
                <div
                  className={cn(
                    'flex flex-col gap-2',
                    notUsefulIds.length > 0 && 'max-h-44 overflow-y-auto',
                  )}
                  ref={notUsefulRef}
                >
                  <Column id={NOT_USEFUL} cardIds={notUsefulIds}>
                    {notUsefulIds.length === 0 ? (
                      <NotUsefulHint />
                    ) : (
                      notUsefulIds.map((id) => (
                        <div
                          key={id}
                          ref={(el) => {
                            cardRefs.current[id] = el;
                          }}
                        >
                          <SortableCard
                            card={cardsById[id]!}
                            order={null}
                            tone="danger"
                            containerId={NOT_USEFUL}
                          />
                        </div>
                      ))
                    )}
                  </Column>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 min-w-0">
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
                            card={cardsById[id]!}
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

      {!readOnly && (onSubmit || onShowResults) && (
        <StickyActionBar
          hasChanges={hasChanges}
          submitting={submitting}
          notUsefulCount={state.notUsefulCount}
          groupCount={state.groups.length}
          canSubmit={!!onSubmit}
          onSubmit={onSubmitClick}
          onShowResults={onShowResults}
          onResetDraft={onResetDraft}
        />
      )}

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

function StickyActionBar({
  hasChanges,
  submitting,
  notUsefulCount,
  groupCount,
  canSubmit,
  onSubmit,
  onShowResults,
  onResetDraft,
}: {
  hasChanges: boolean;
  submitting: boolean;
  notUsefulCount: number;
  groupCount: number;
  canSubmit: boolean;
  onSubmit: () => void;
  onShowResults?: () => void;
  onResetDraft: () => void;
}) {
  return (
    <div className="pointer-events-none sticky bottom-0 left-0 right-0 z-40 mt-4 px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="pointer-events-auto mx-auto flex w-full max-w-7xl items-center justify-between gap-3 rounded-xl border border-separator1 bg-bg1/95 px-3 py-2.5 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur supports-[backdrop-filter]:bg-bg1/80">
        <div className="hidden min-w-0 items-center gap-2 sm:flex">
          <span className="text-fg3 text-xs">
            {hasChanges ? (
              <>
                <span className="text-fg0 font-semibold">Unsubmitted changes</span>
                <span className="text-fg4">
                  {' · '}
                  {groupCount} {groupCount === 1 ? 'group' : 'groups'}
                  {' · '}
                  {notUsefulCount} not useful
                </span>
              </>
            ) : (
              <span>Drag a card to begin.</span>
            )}
          </span>
        </div>
        <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
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
          {onShowResults && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Chart5Icon />}
              onClick={onShowResults}
            >
              Show results
            </Button>
          )}
          {canSubmit && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<ArrowOutOfBoxIcon />}
              disabled={!hasChanges || submitting}
              onClick={onSubmit}
            >
              {submitting ? 'Submitting…' : 'Submit my sort'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Header({
  title,
  subtitle,
  badgeLabel,
  error,
}: {
  title: string;
  subtitle: string;
  badgeLabel: string;
  error: string | null;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Badge variant="accent" size="medium">
              {badgeLabel}
            </Badge>
            <h1 className="font-display text-fg0 text-2xl">{title}</h1>
          </div>
          <p className="text-fg3 max-w-2xl text-sm">{subtitle}</p>
        </div>
      </div>
      <InstructionsAccordion />
      {error && (
        <div className="border-separatorSerious1 bg-bgSerious1 text-fgSerious1 rounded-md border px-3 py-2 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}

const INSTRUCTIONS_STORAGE_KEY = 'card-sort:instructions-open';

function InstructionsAccordion() {
  const [open, setOpen] = React.useState(true);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(INSTRUCTIONS_STORAGE_KEY);
      if (stored === 'closed') setOpen(false);
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(INSTRUCTIONS_STORAGE_KEY, open ? 'open' : 'closed');
    } catch {
      // ignore
    }
  }, [open, hydrated]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border-separator1 overflow-hidden rounded border">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={cn(
              'group flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left',
              'hover:bg-bg2 focus-visible:outline-fgAccent1 transition-colors focus-visible:outline-2',
              open && 'border-b border-b-separator1',
            )}
            aria-label={open ? 'Collapse instructions' : 'Expand instructions'}
          >
            <span className="flex items-center gap-2">
              <CircleInfoIcon className="text-fgAccent1 h-4 w-4 shrink-0" />
              <span className="text-fg1 text-sm font-semibold">How to sort</span>
              {!open && (
                <span className="text-fg4 hidden text-xs sm:inline">
                  · Reorder, group, and mark cards as not useful
                </span>
              )}
            </span>
            <ChevronDownSmallIcon
              className={cn(
                'text-fg3 h-4 w-4 shrink-0 transition-transform duration-150',
                !open && '-rotate-90',
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent
          className={cn(
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1',
            'overflow-hidden',
          )}
        >
          <ol className="*:text-initial divide-separator1 text-fg1 list-inside list-decimal divide-y px-3 text-sm font-semibold *:font-normal">
            <InstructionsStep title="Reorder by importance.">
              <p className="text-fg2 mt-1.5 ml-5 font-normal">
                Drag any card up or down. The number in the corner shows its current position.
              </p>
            </InstructionsStep>
            <InstructionsStep title="Group related items (optional).">
              <p className="text-fg2 mt-1.5 ml-5 font-normal">
                Click <span className="font-semibold">New group</span>, give it a name, then drag
                cards in. You can rearrange within a group too.
              </p>
            </InstructionsStep>
            <InstructionsStep title="Mark anything irrelevant as not useful.">
              <p className="text-fg2 mt-1.5 ml-5 font-normal">
                Drag the red <span className="text-fgSerious1 font-semibold">Not useful</span>{' '}
                divider up to push cards below the line. Their order doesn&apos;t matter —
                they&apos;re just out. Drag the line back down to restore them.
              </p>
            </InstructionsStep>
          </ol>
        </CollapsibleContent>
      </div>
    </Collapsible>
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
