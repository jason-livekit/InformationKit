'use client';

import * as React from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Button } from '@/components/bytes/Button';
import { Toaster, toast } from '@/components/bytes/Toaster';
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from '@/components/bytes/Tooltip';
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
const NEW_GROUP = 'newGroup';
const GROUP_PREFIX = 'group:';
const GROUP_NU_PREFIX = 'groupNotUseful:';
const GROUP_SORT_PREFIX = 'groupSort:';

function uid(prefix: string) {
  return `${prefix}${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

/** A group plus the local-only split: the last `notUsefulCount` cardIds are marked not useful. */
interface GroupState {
  id: string;
  label: string;
  cardIds: string[];
  notUsefulCount: number;
}

function newGroup(cardIds: string[] = []): GroupState {
  return { id: uid('g_'), label: 'Untitled group', cardIds, notUsefulCount: 0 };
}

const groupUseful = (g: GroupState) => g.cardIds.slice(0, g.cardIds.length - g.notUsefulCount);
const groupNotUseful = (g: GroupState) => g.cardIds.slice(g.cardIds.length - g.notUsefulCount);

interface State {
  unsorted: string[];
  groups: GroupState[];
}

function defaultStateFor(cards: CardItem[], predefinedGroups: Group[]): State {
  const inGroups = new Set(predefinedGroups.flatMap((g) => g.cardIds));
  return {
    unsorted: cards.map((c) => c.id).filter((id) => !inGroups.has(id)),
    groups: predefinedGroups.map((g) => ({
      id: g.id,
      label: g.label,
      cardIds: [...g.cardIds],
      notUsefulCount: 0,
    })),
  };
}

function isContainerId(id: string): boolean {
  return (
    id === UNSORTED ||
    id === NEW_GROUP ||
    id.startsWith(GROUP_PREFIX) ||
    id.startsWith(GROUP_NU_PREFIX)
  );
}

/** Remove a card from its source container, fixing up a group's not-useful count if needed. */
function removeCard(next: State, cardId: string, fromContainer: string): void {
  if (fromContainer === UNSORTED) {
    const idx = next.unsorted.indexOf(cardId);
    if (idx !== -1) next.unsorted.splice(idx, 1);
    return;
  }
  if (fromContainer.startsWith(GROUP_PREFIX) || fromContainer.startsWith(GROUP_NU_PREFIX)) {
    const gid = fromContainer.slice(fromContainer.indexOf(':') + 1);
    const g = next.groups.find((x) => x.id === gid);
    if (!g) return;
    const idx = g.cardIds.indexOf(cardId);
    if (idx === -1) return;
    const usefulLen = g.cardIds.length - g.notUsefulCount;
    if (idx >= usefulLen) g.notUsefulCount = Math.max(0, g.notUsefulCount - 1);
    g.cardIds.splice(idx, 1);
  }
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

  // Per-group not-useful divider drag bookkeeping. Only one divider drags at a time.
  const dividerDragRef = React.useRef<{
    groupId: string | null;
    startY: number;
    startCount: number;
    total: number;
  }>({ groupId: null, startY: 0, startCount: 0, total: 0 });

  React.useEffect(() => {
    if (readOnly) return;
    const draft = loadDraft(draftKey);
    if (!draft) return;
    const cleanGroups: GroupState[] = draft.groups.map((g) => {
      const cardIds = g.cardIds.filter((id) => knownIds.has(id));
      return {
        id: g.id,
        label: g.label,
        cardIds,
        notUsefulCount: Math.min(Math.max(g.notUsefulCount ?? 0, 0), cardIds.length),
      };
    });
    const inGroups = new Set(cleanGroups.flatMap((g) => g.cardIds));
    const cleanUnsorted = draft.unsorted.filter((id) => knownIds.has(id) && !inGroups.has(id));
    const present = new Set<string>([...inGroups, ...cleanUnsorted]);
    const missing = cards.map((c) => c.id).filter((id) => !present.has(id));
    setState({ unsorted: [...cleanUnsorted, ...missing], groups: cleanGroups });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  React.useEffect(() => {
    if (readOnly) return;
    saveDraft({ unsorted: state.unsorted, groups: state.groups }, draftKey);
  }, [state, draftKey, readOnly]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const findContainer = React.useCallback(
    (id: string): string | null => {
      if (isContainerId(id) || id.startsWith(GROUP_SORT_PREFIX)) return id;
      if (state.unsorted.includes(id)) return UNSORTED;
      for (const g of state.groups) {
        const idx = g.cardIds.indexOf(id);
        if (idx !== -1) {
          const usefulLen = g.cardIds.length - g.notUsefulCount;
          return (idx < usefulLen ? GROUP_PREFIX : GROUP_NU_PREFIX) + g.id;
        }
      }
      return null;
    },
    [state.unsorted, state.groups],
  );

  const groupById = React.useCallback(
    (containerId: string): GroupState | undefined => {
      const gid = containerId.slice(containerId.indexOf(':') + 1);
      return state.groups.find((g) => g.id === gid);
    },
    [state.groups],
  );

  const containerLength = React.useCallback(
    (id: string): number => {
      if (id === UNSORTED) return state.unsorted.length;
      if (id.startsWith(GROUP_PREFIX)) {
        const g = groupById(id);
        return g ? g.cardIds.length - g.notUsefulCount : 0;
      }
      if (id.startsWith(GROUP_NU_PREFIX)) {
        return groupById(id)?.notUsefulCount ?? 0;
      }
      return 0;
    },
    [state.unsorted.length, groupById],
  );

  const indexInContainer = React.useCallback(
    (cardId: string, containerId: string): number => {
      if (containerId === UNSORTED) return state.unsorted.indexOf(cardId);
      const g = groupById(containerId);
      if (!g) return -1;
      if (containerId.startsWith(GROUP_PREFIX)) return groupUseful(g).indexOf(cardId);
      if (containerId.startsWith(GROUP_NU_PREFIX)) return groupNotUseful(g).indexOf(cardId);
      return -1;
    },
    [state.unsorted, groupById],
  );

  /** Resolve any over-id (container, group-sort handle, or card) to the group it belongs to. */
  const resolveGroupId = React.useCallback(
    (overId: string): string | null => {
      if (
        overId.startsWith(GROUP_SORT_PREFIX) ||
        overId.startsWith(GROUP_PREFIX) ||
        overId.startsWith(GROUP_NU_PREFIX)
      ) {
        return overId.slice(overId.indexOf(':') + 1);
      }
      for (const g of state.groups) {
        if (g.cardIds.includes(overId)) return g.id;
      }
      return null;
    },
    [state.groups],
  );

  const moveCardToContainer = React.useCallback(
    (cardId: string, fromContainer: string, toContainer: string, toIndex: number) => {
      setState((prev) => {
        const next = structuredClone(prev) as State;
        removeCard(next, cardId, fromContainer);
        if (toContainer === UNSORTED) {
          const insertAt = Math.min(Math.max(toIndex, 0), next.unsorted.length);
          next.unsorted.splice(insertAt, 0, cardId);
        } else if (toContainer.startsWith(GROUP_PREFIX)) {
          const gid = toContainer.slice(GROUP_PREFIX.length);
          const g = next.groups.find((x) => x.id === gid);
          if (g) {
            const usefulLen = g.cardIds.length - g.notUsefulCount;
            const insertAt = Math.min(Math.max(toIndex, 0), usefulLen);
            g.cardIds.splice(insertAt, 0, cardId);
          }
        } else if (toContainer.startsWith(GROUP_NU_PREFIX)) {
          const gid = toContainer.slice(GROUP_NU_PREFIX.length);
          const g = next.groups.find((x) => x.id === gid);
          if (g) {
            const usefulLen = g.cardIds.length - g.notUsefulCount;
            const localIdx = Math.min(Math.max(toIndex, 0), g.notUsefulCount);
            g.cardIds.splice(usefulLen + localIdx, 0, cardId);
            g.notUsefulCount += 1;
          }
        }
        return next;
      });
      setHasChanges(true);
    },
    [],
  );

  const moveCardToNewGroup = React.useCallback((cardId: string, fromContainer: string) => {
    setState((prev) => {
      const next = structuredClone(prev) as State;
      removeCard(next, cardId, fromContainer);
      next.groups.push(newGroup([cardId]));
      return next;
    });
    setHasChanges(true);
  }, []);

  const reorderInContainer = React.useCallback(
    (containerId: string, fromIndex: number, toIndex: number) => {
      setState((prev) => {
        const next = structuredClone(prev) as State;
        if (containerId === UNSORTED) {
          next.unsorted = arrayMove(next.unsorted, fromIndex, toIndex);
        } else {
          const gid = containerId.slice(containerId.indexOf(':') + 1);
          const g = next.groups.find((x) => x.id === gid);
          if (g) {
            if (containerId.startsWith(GROUP_PREFIX)) {
              const useful = arrayMove(groupUseful(g), fromIndex, toIndex);
              g.cardIds = [...useful, ...groupNotUseful(g)];
            } else {
              const nu = arrayMove(groupNotUseful(g), fromIndex, toIndex);
              g.cardIds = [...groupUseful(g), ...nu];
            }
          }
        }
        return next;
      });
      setHasChanges(true);
    },
    [],
  );

  const reorderGroups = React.useCallback((activeGid: string, overGid: string) => {
    setState((prev) => {
      const from = prev.groups.findIndex((g) => g.id === activeGid);
      const to = prev.groups.findIndex((g) => g.id === overGid);
      if (from === -1 || to === -1 || from === to) return prev;
      return { ...prev, groups: arrayMove(prev.groups, from, to) };
    });
    setHasChanges(true);
  }, []);

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    if (activeIdStr.startsWith(GROUP_SORT_PREFIX)) {
      const activeGid = activeIdStr.slice(GROUP_SORT_PREFIX.length);
      const overGid = resolveGroupId(overIdStr);
      if (overGid && overGid !== activeGid) reorderGroups(activeGid, overGid);
      return;
    }

    const activeContainer = findContainer(activeIdStr);
    if (!activeContainer) return;
    // Hovering the group's outer body targets that group's useful list.
    const effectiveOverId = overIdStr.startsWith(GROUP_SORT_PREFIX)
      ? GROUP_PREFIX + overIdStr.slice(GROUP_SORT_PREFIX.length)
      : overIdStr;
    let overContainer = findContainer(effectiveOverId);
    if (!overContainer) return;
    // New-group creation happens on drop, not while hovering.
    if (overContainer === NEW_GROUP) return;
    if (activeContainer === overContainer) return;

    const overIsContainer = isContainerId(effectiveOverId);
    overContainer = overIsContainer ? effectiveOverId : overContainer;
    const overIndex = overIsContainer
      ? containerLength(overContainer)
      : indexInContainer(effectiveOverId, overContainer);

    moveCardToContainer(activeIdStr, activeContainer, overContainer, overIndex);
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    // Group reordering is committed live in onDragOver; nothing to finalize here.
    if (activeIdStr.startsWith(GROUP_SORT_PREFIX)) return;

    const activeContainer = findContainer(activeIdStr);
    if (!activeContainer) return;

    if (overIdStr === NEW_GROUP || findContainer(overIdStr) === NEW_GROUP) {
      moveCardToNewGroup(activeIdStr, activeContainer);
      return;
    }

    const effectiveOverId = overIdStr.startsWith(GROUP_SORT_PREFIX)
      ? GROUP_PREFIX + overIdStr.slice(GROUP_SORT_PREFIX.length)
      : overIdStr;
    const overContainer = findContainer(effectiveOverId);
    if (!overContainer) return;

    const overIsContainer = isContainerId(effectiveOverId);
    const resolvedOver = overIsContainer ? effectiveOverId : overContainer;
    if (activeContainer === resolvedOver) {
      const fromIndex = indexInContainer(activeIdStr, activeContainer);
      const toIndex = overIsContainer
        ? containerLength(resolvedOver) - 1
        : indexInContainer(effectiveOverId, resolvedOver);
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
      const g = prev.groups.find((x) => x.id === id);
      if (!g) return prev;
      return {
        unsorted: [...prev.unsorted, ...g.cardIds],
        groups: prev.groups.filter((x) => x.id !== id),
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
  const onDividerPressDown = (groupId: string, clientY: number) => {
    const g = state.groups.find((x) => x.id === groupId);
    dividerDragRef.current = {
      groupId,
      startY: clientY,
      startCount: g?.notUsefulCount ?? 0,
      total: g?.cardIds.length ?? 0,
    };
  };

  const onDividerDrag = (clientY: number) => {
    const drag = dividerDragRef.current;
    if (!drag.groupId) return;
    const dy = clientY - drag.startY;
    const stepDelta = -Math.round(dy / CARD_STEP_PX);
    const newCount = Math.max(0, Math.min(drag.total, drag.startCount + stepDelta));
    setState((prev) => {
      const g = prev.groups.find((x) => x.id === drag.groupId);
      if (!g || g.notUsefulCount === newCount) return prev;
      setHasChanges(true);
      return {
        ...prev,
        groups: prev.groups.map((x) =>
          x.id === drag.groupId ? { ...x, notUsefulCount: newCount } : x,
        ),
      };
    });
  };

  const onDividerDragEnd = () => {
    dividerDragRef.current.groupId = null;
  };

  const activeCard: CardItem | null = activeId ? cardsById[activeId] ?? null : null;
  const activeContainer = activeCard && activeId ? findContainer(activeId) : null;
  const activeOrder =
    activeCard && activeContainer && activeContainer.startsWith(GROUP_PREFIX)
      ? (() => {
          const g = groupById(activeContainer);
          return g ? groupUseful(g).indexOf(activeId!) + 1 : null;
        })()
      : null;
  const activeGroup =
    activeId && activeId.startsWith(GROUP_SORT_PREFIX)
      ? state.groups.find((g) => g.id === activeId.slice(GROUP_SORT_PREFIX.length)) ?? null
      : null;

  const remaining = state.unsorted.length;
  const blocked = remaining > 0;

  const onSubmitClick = async () => {
    if (!onSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      const notUseful: string[] = [];
      const groups = state.groups.map((g) => {
        notUseful.push(...groupNotUseful(g));
        return { id: g.id, label: g.label, cardIds: groupUseful(g) };
      });
      const payload: SubmissionInput = {
        groups,
        unsorted: state.unsorted,
        notUseful,
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
        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-[minmax(300px,380px)_1fr]">
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

        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-[minmax(300px,380px)_1fr]">
          <div className="flex flex-col gap-3 md:sticky md:top-[5rem] md:self-start">
            <ColumnHeading
              title="Items to sort"
              countLabel={remaining === 0 ? 'all sorted' : `${remaining} left`}
            />
            <div
              className="border-separator1 bg-bg1 relative flex flex-col rounded-lg border"
              style={{ maxHeight: 'min(760px, calc(100svh - 11rem))' }}
            >
              <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
                <Column id={UNSORTED} cardIds={state.unsorted}>
                  {state.unsorted.length === 0 ? (
                    <AllSortedHint />
                  ) : (
                    state.unsorted.map((id) => (
                      <SortableCard
                        key={id}
                        card={cardsById[id]!}
                        order={null}
                        tone="ok"
                        containerId={UNSORTED}
                      />
                    ))
                  )}
                </Column>
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-3">
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
              <NewGroupDropZone variant="empty" onAdd={onAddGroup} />
            ) : (
              <SortableContext
                items={state.groups.map((g) => GROUP_SORT_PREFIX + g.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {state.groups.map((g) => (
                    <SortableGroup
                      key={g.id}
                      group={g}
                      cardsById={cardsById}
                      activeId={activeId}
                      onRename={(label) => onRenameGroup(g.id, label)}
                      onDelete={() => onDeleteGroup(g.id)}
                      onDividerPressDown={onDividerPressDown}
                      onDividerDrag={onDividerDrag}
                      onDividerDragEnd={onDividerDragEnd}
                    />
                  ))}
                  <NewGroupDropZone variant="tile" onAdd={onAddGroup} />
                </div>
              </SortableContext>
            )}
          </div>
        </div>
      </div>

      {!readOnly && (onSubmit || onShowResults) && (
        <StickyActionBar
          hasChanges={hasChanges}
          submitting={submitting}
          remaining={remaining}
          blocked={blocked}
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
            tone={activeContainer?.startsWith(GROUP_NU_PREFIX) ? 'danger' : 'ok'}
            containerId="overlay"
            overlay
          />
        ) : activeGroup ? (
          <GroupDragPreview label={activeGroup.label} count={activeGroup.cardIds.length} />
        ) : null}
      </DragOverlay>

      <Toaster position="top-center" />
    </DndContext>
  );
}

function SortableGroup({
  group,
  cardsById,
  activeId,
  onRename,
  onDelete,
  onDividerPressDown,
  onDividerDrag,
  onDividerDragEnd,
}: {
  group: GroupState;
  cardsById: Record<string, CardItem>;
  activeId: string | null;
  onRename: (label: string) => void;
  onDelete: () => void;
  onDividerPressDown: (groupId: string, clientY: number) => void;
  onDividerDrag: (clientY: number) => void;
  onDividerDragEnd: () => void;
}) {
  const {
    setNodeRef,
    setActivatorNodeRef,
    listeners,
    attributes,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: GROUP_SORT_PREFIX + group.id, data: { type: 'group' } });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const usefulIds = groupUseful(group);
  const notUsefulIds = groupNotUseful(group);
  const usefulContainer = GROUP_PREFIX + group.id;
  const notUsefulContainer = GROUP_NU_PREFIX + group.id;
  const hasCards = group.cardIds.length > 0;
  // Only offer the not-useful zone once the group has a settled card (one other than the
  // card currently being dragged). This keeps the first card from landing below the line.
  const showNotUseful = group.cardIds.some((id) => id !== activeId);

  return (
    <GroupPanel
      label={group.label}
      count={group.cardIds.length}
      onRename={onRename}
      onDelete={onDelete}
      innerRef={setNodeRef}
      style={style}
      attributes={attributes}
      handleRef={setActivatorNodeRef}
      handleListeners={listeners}
      isDragging={isDragging}
    >
      <Column id={usefulContainer} cardIds={usefulIds} flush>
        {!hasCards && <GroupEmptyHint />}
        {usefulIds.map((id, idx) => (
          <SortableCard
            key={id}
            card={cardsById[id]!}
            order={idx + 1}
            tone="ok"
            containerId={usefulContainer}
            groupId={group.id}
          />
        ))}
      </Column>

      {showNotUseful && (
        <>
          <NotUsefulDivider
            onPressDown={(clientY) => onDividerPressDown(group.id, clientY)}
            onDrag={onDividerDrag}
            onDragEnd={onDividerDragEnd}
          />
          <Column id={notUsefulContainer} cardIds={notUsefulIds} flush className="min-h-9">
            {notUsefulIds.length === 0 ? (
              <GroupNotUsefulHint />
            ) : (
              notUsefulIds.map((id) => (
                <SortableCard
                  key={id}
                  card={cardsById[id]!}
                  order={null}
                  tone="danger"
                  containerId={notUsefulContainer}
                  groupId={group.id}
                />
              ))
            )}
          </Column>
        </>
      )}
    </GroupPanel>
  );
}

function NewGroupDropZone({
  variant,
  onAdd,
}: {
  variant: 'empty' | 'tile';
  onAdd: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: NEW_GROUP, data: { type: 'newGroup' } });

  if (variant === 'empty') {
    return (
      <div
        ref={setNodeRef}
        data-over={isOver || undefined}
        className={cn(
          'border-separator1 bg-bg1 relative flex min-h-64 flex-col items-center justify-center gap-3 overflow-hidden rounded-lg border border-dashed p-6 text-center transition-colors',
          isOver && 'border-fgAccent1 bg-bgAccent1/40',
        )}
      >
        <DotFill tone="accent" opacity={0.18} />
        <div className="relative flex flex-col items-center gap-1">
          <h3 className="text-fg0 text-sm font-semibold">No groups yet</h3>
          <p className="text-fg3 max-w-xs text-xs">
            Drag a card here to start a group, or use the button below. Create groups to bucket
            related cards together — the number of groups and their names are up to you.
          </p>
        </div>
        <Button
          className="relative"
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

  return (
    <button
      type="button"
      ref={setNodeRef as unknown as React.Ref<HTMLButtonElement>}
      onClick={onAdd}
      data-over={isOver || undefined}
      className={cn(
        'group border-separator1 text-fg4 hover:text-fg2 hover:border-separator2 relative flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden rounded-lg border border-dashed p-4 text-center text-xs font-medium transition-colors',
        isOver && 'border-fgAccent1 bg-bgAccent1/40 text-fgAccent1',
      )}
    >
      <DotFill tone="accent" opacity={0.12} />
      <CirclePlusIcon className="relative h-4 w-4" />
      <span className="relative group-hover:hidden">Drop a card here to start a new group</span>
      <span className="relative hidden group-hover:inline">Click here to create a new group</span>
    </button>
  );
}

function GroupDragPreview({ label, count }: { label: string; count: number }) {
  return (
    <div className="border-separator2 bg-bg1 flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
      <span className="text-fg0 truncate text-sm font-semibold">{label}</span>
      <span className="bg-bg2 text-fg3 ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded px-1 font-mono text-[10px] font-bold tabular-nums">
        {count}
      </span>
    </div>
  );
}

function StickyActionBar({
  hasChanges,
  submitting,
  remaining,
  blocked,
  groupCount,
  canSubmit,
  onSubmit,
  onShowResults,
  onResetDraft,
}: {
  hasChanges: boolean;
  submitting: boolean;
  remaining: number;
  blocked: boolean;
  groupCount: number;
  canSubmit: boolean;
  onSubmit: () => void;
  onShowResults?: () => void;
  onResetDraft: () => void;
}) {
  const reason = `Move all ${remaining} remaining ${remaining === 1 ? 'item' : 'items'} into groups before submitting.`;

  const handleSubmitClick = () => {
    if (submitting) return;
    if (blocked) {
      toast.info('Almost there', { description: reason });
      return;
    }
    onSubmit();
  };

  return (
    <div className="pointer-events-none sticky bottom-0 left-0 right-0 z-40 mt-4 px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="pointer-events-auto mx-auto flex w-full max-w-7xl items-center justify-between gap-3 rounded-xl border border-separator1 bg-bg1/95 px-3 py-2.5 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur supports-[backdrop-filter]:bg-bg1/80">
        <div className="hidden min-w-0 items-center gap-2 sm:flex">
          <span className="text-fg3 text-xs">
            {remaining > 0 ? (
              <>
                <span className="text-fg0 font-semibold">
                  {remaining} {remaining === 1 ? 'item' : 'items'} left to sort
                </span>
                <span className="text-fg4">
                  {' · '}
                  {groupCount} {groupCount === 1 ? 'group' : 'groups'}
                </span>
              </>
            ) : hasChanges ? (
              <>
                <span className="text-fg0 font-semibold">Ready to submit</span>
                <span className="text-fg4">
                  {' · '}
                  {groupCount} {groupCount === 1 ? 'group' : 'groups'}
                </span>
              </>
            ) : (
              <span>Drag a card into a group to begin.</span>
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<ArrowOutOfBoxIcon />}
                  onClick={handleSubmitClick}
                  className={cn(
                    blocked && 'cursor-not-allowed bg-bg3! text-fg4! hover:bg-bg3!',
                  )}
                >
                  {submitting ? 'Submitting…' : 'Submit my sort'}
                </Button>
              </TooltipTrigger>
              {blocked && (
                <TooltipPortal>
                  <TooltipContent>{reason}</TooltipContent>
                </TooltipPortal>
              )}
            </Tooltip>
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

function InstructionsAccordion() {
  const [open, setOpen] = React.useState(false);

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
                  · Group, reorder, and mark cards as not useful
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
            <InstructionsStep title="Group related items.">
              <p className="text-fg2 mt-1.5 ml-5 font-normal">
                Drag a card into the group area to start a group, or click{' '}
                <span className="font-semibold">New group</span>. Rename a group any time, and drag
                groups to reorder them.
              </p>
            </InstructionsStep>
            <InstructionsStep title="Reorder by importance.">
              <p className="text-fg2 mt-1.5 ml-5 font-normal">
                Drag cards up or down within a group. The number in the corner shows its current
                position.
              </p>
            </InstructionsStep>
            <InstructionsStep title="Mark anything irrelevant as not useful.">
              <p className="text-fg2 mt-1.5 ml-5 font-normal">
                Inside any group, drag the red{' '}
                <span className="text-fgSerious1 font-semibold">Not useful</span> divider up so the
                cards you don&apos;t care about drop below the line. Drag it back down to restore
                them.
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

function AllSortedHint() {
  return (
    <div className="border-separator1 text-fg4 relative flex min-h-12 items-center justify-center overflow-hidden rounded-md border border-dashed px-3 py-2 text-center text-xs font-medium">
      <DotFill tone="accent" opacity={0.2} />
      <span className="relative">Everything is in a group. You&apos;re ready to submit.</span>
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

function GroupNotUsefulHint() {
  return (
    <div className="text-fgSerious1/70 relative flex min-h-9 items-center justify-center px-3 text-center text-[11px] font-medium">
      <span className="relative">Pull the line up — anything below is &ldquo;not useful&rdquo;.</span>
    </div>
  );
}
