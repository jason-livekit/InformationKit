'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import type { Study, Card, Group, SortType } from '@/lib/repo/schemas';
import { mergeCardText } from '@/lib/card-sort/merge';
import { Button } from '@/components/bytes/Button';
import { Checkbox } from '@/components/bytes/Checkbox';
import { Switch } from '@/components/bytes/Switch';
import {
  ArrowUndoUpIcon,
  CirclePlusIcon,
  ReorderIcon,
  SquareBehindSquare1Icon,
  TrashCanIcon,
} from '@/icons/react';
import { cn } from '@/lib/bytes/utils';

const SORT_TYPE_OPTIONS: { value: SortType; title: string; description: string }[] = [
  {
    value: 'open',
    title: 'Open',
    description:
      'No predefined groups. Participants create as many groups as they want during the study.',
  },
  {
    value: 'hybrid',
    title: 'Hybrid',
    description:
      'Predefined groups are shown as a starting point, and participants can still add as many of their own as they want.',
  },
  {
    value: 'closed',
    title: 'Closed',
    description:
      'Predefined groups are shown and fixed. Participants sort into them and cannot add, rename, or remove groups.',
  },
];

interface SetupTabProps {
  study: Study;
  submissionsCount: number;
}

function uid(prefix: string) {
  return `${prefix}${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function SetupTab({ study, submissionsCount }: SetupTabProps) {
  const router = useRouter();
  const [name, setName] = React.useState(study.name);
  const [description, setDescription] = React.useState(study.description);
  const [cards, setCards] = React.useState<Card[]>(study.cards);
  const [groups, setGroups] = React.useState<Group[]>(study.predefinedGroups);
  const [sortType, setSortType] = React.useState<SortType>(study.sortType ?? 'hybrid');
  const [randomizeCards, setRandomizeCards] = React.useState<boolean>(
    study.randomizeCards ?? false,
  );
  const [selectedCardIds, setSelectedCardIds] = React.useState<Set<string>>(new Set());
  const [saving, setSaving] = React.useState<'idle' | 'saving' | 'saved'>('idle');
  const [resetting, setResetting] = React.useState(false);
  const dirtyRef = React.useRef(false);

  async function resetSubmissions() {
    if (submissionsCount === 0) return;
    const confirmation = prompt(
      `Permanently delete all ${submissionsCount} submission(s) for "${study.name}"? Type RESET to confirm.`,
    );
    if (confirmation !== 'RESET') return;
    setResetting(true);
    try {
      await fetch(`/api/studies/${study.id}/submissions`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setResetting(false);
    }
  }

  React.useEffect(() => {
    if (!dirtyRef.current) return;
    const t = setTimeout(async () => {
      setSaving('saving');
      await fetch(`/api/studies/${study.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          cards,
          predefinedGroups: groups,
          sortType,
          randomizeCards,
        }),
      });
      dirtyRef.current = false;
      setSaving('saved');
      router.refresh();
      setTimeout(() => setSaving('idle'), 1500);
    }, 600);
    return () => clearTimeout(t);
  }, [name, description, cards, groups, sortType, randomizeCards, study.id, router]);

  function markDirty() {
    dirtyRef.current = true;
  }

  const cardSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function addCard() {
    setCards((cs) => [...cs, { id: uid('c_'), label: '' }]);
    markDirty();
  }
  function updateCard(id: string, patch: Partial<Card>) {
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    markDirty();
  }
  function removeCard(id: string) {
    setCards((cs) => cs.filter((c) => c.id !== id));
    setGroups((gs) =>
      gs.map((g) => ({ ...g, cardIds: g.cardIds.filter((cid) => cid !== id) })),
    );
    setSelectedCardIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    markDirty();
  }
  function reorderCards(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setCards((cs) => {
      const from = cs.findIndex((c) => c.id === active.id);
      const to = cs.findIndex((c) => c.id === over.id);
      if (from === -1 || to === -1) return cs;
      return arrayMove(cs, from, to);
    });
    markDirty();
  }

  const selectedCount = cards.reduce((n, c) => (selectedCardIds.has(c.id) ? n + 1 : n), 0);
  const allSelected = cards.length > 0 && selectedCount === cards.length;
  const someSelected = selectedCount > 0 && !allSelected;

  function toggleSelectCard(id: string) {
    setSelectedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleSelectAll() {
    setSelectedCardIds(() => (allSelected ? new Set() : new Set(cards.map((c) => c.id))));
  }
  function duplicateSelected() {
    if (selectedCount === 0) return;
    setCards((cs) => {
      const out: Card[] = [];
      for (const c of cs) {
        out.push(c);
        if (selectedCardIds.has(c.id)) out.push({ ...c, id: uid('c_') });
      }
      return out;
    });
    setSelectedCardIds(new Set());
    markDirty();
  }
  function mergeSelected() {
    const chosen = cards.filter((c) => selectedCardIds.has(c.id));
    if (chosen.length < 2) return;
    const { label: mergedLabel, description: mergedDescription } = mergeCardText(chosen);
    const keepId = chosen[0]!.id;
    const removeIds = new Set(chosen.slice(1).map((c) => c.id));
    setCards((cs) =>
      cs
        .filter((c) => !removeIds.has(c.id))
        .map((c) =>
          c.id === keepId ? { ...c, label: mergedLabel, description: mergedDescription } : c,
        ),
    );
    setGroups((gs) =>
      gs.map((g) => ({ ...g, cardIds: g.cardIds.filter((cid) => !removeIds.has(cid)) })),
    );
    setSelectedCardIds(new Set());
    markDirty();
  }
  function deleteSelected() {
    if (selectedCount === 0) return;
    setCards((cs) => cs.filter((c) => !selectedCardIds.has(c.id)));
    setGroups((gs) =>
      gs.map((g) => ({ ...g, cardIds: g.cardIds.filter((cid) => !selectedCardIds.has(cid)) })),
    );
    setSelectedCardIds(new Set());
    markDirty();
  }

  function addGroup() {
    setGroups((gs) => [...gs, { id: uid('g_'), label: '', cardIds: [] }]);
    markDirty();
  }
  function updateGroup(id: string, patch: Partial<Group>) {
    setGroups((gs) => gs.map((g) => (g.id === id ? { ...g, ...patch } : g)));
    markDirty();
  }
  function removeGroup(id: string) {
    setGroups((gs) => gs.filter((g) => g.id !== id));
    markDirty();
  }

  return (
    <div className="flex flex-col gap-8">
      <Section title="Name & description">
        <label className="flex flex-col gap-1.5">
          <span className="text-fg2 text-xs font-semibold uppercase tracking-wider">Study name</span>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              markDirty();
            }}
            className="border-separator1 bg-bg2 text-fg0 focus:border-separatorAccent focus:outline-none rounded-md border px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-fg2 text-xs font-semibold uppercase tracking-wider">Description</span>
          <textarea
            value={description}
            rows={2}
            onChange={(e) => {
              setDescription(e.target.value);
              markDirty();
            }}
            placeholder="What are you trying to learn?"
            className="border-separator1 bg-bg2 text-fg0 focus:border-separatorAccent focus:outline-none rounded-md border px-3 py-2 text-sm"
          />
        </label>
      </Section>

      <Section
        title="Sort type"
        description="Choose how much structure participants get. This controls whether your predefined groups are shown and whether participants can create their own."
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {SORT_TYPE_OPTIONS.map((opt) => {
            const selected = sortType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setSortType(opt.value);
                  markDirty();
                }}
                className={cn(
                  'flex flex-col gap-1.5 rounded-md border p-3 text-left transition-colors',
                  selected
                    ? 'border-separatorAccent bg-bgAccent1/40'
                    : 'border-separator1 bg-bg2 hover:border-separator2',
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-fg0 text-sm font-semibold">{opt.title}</span>
                  <span
                    className={cn(
                      'inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border',
                      selected ? 'border-fgAccent1 bg-fgAccent1' : 'border-separator2',
                    )}
                  >
                    {selected && <span className="bg-bg1 h-1.5 w-1.5 rounded-full" />}
                  </span>
                </span>
                <span className="text-fg3 text-xs">{opt.description}</span>
              </button>
            );
          })}
        </div>

        <label className="border-separator1 bg-bg2 flex items-center justify-between gap-4 rounded-md border p-3">
          <span className="flex flex-col gap-0.5">
            <span className="text-fg0 text-sm font-semibold">Randomize card order</span>
            <span className="text-fg3 text-xs">
              Shuffle the cards into a different order for each participant to reduce ordering
              bias.
            </span>
          </span>
          <Switch
            checked={randomizeCards}
            onCheckedChange={(v) => {
              setRandomizeCards(v);
              markDirty();
            }}
            aria-label="Randomize card order"
          />
        </label>
      </Section>

      <Section
        title={`Cards (${cards.length})`}
        description="Each card is a thing participants will sort. Add a short label, and optionally a longer description to give participants more detail."
        action={
          <Button variant="secondary" size="sm" leftIcon={<CirclePlusIcon />} onClick={addCard}>
            Add card
          </Button>
        }
      >
        {cards.length === 0 ? (
          <div className="border-separator1 text-fg3 rounded-md border border-dashed px-4 py-6 text-center text-sm">
            No cards yet. Add some cards for participants to sort.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-fg2 flex cursor-pointer select-none items-center gap-2 text-xs font-medium">
                <Checkbox
                  checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all cards"
                />
                <span>{selectedCount > 0 ? `${selectedCount} selected` : 'Select all'}</span>
              </label>
              {selectedCount > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<SquareBehindSquare1Icon />}
                    onClick={duplicateSelected}
                  >
                    Duplicate
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={mergeSelected}
                    disabled={selectedCount < 2}
                    title={selectedCount < 2 ? 'Select at least two cards to merge' : undefined}
                  >
                    Merge
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    leftIcon={<TrashCanIcon />}
                    onClick={deleteSelected}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
            <DndContext
              sensors={cardSensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
              onDragEnd={reorderCards}
            >
              <SortableContext
                items={cards.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="border-separator1 divide-separator1 bg-bg2 divide-y overflow-hidden rounded-md border">
                  {cards.map((c) => (
                    <SortableCardRow
                      key={c.id}
                      card={c}
                      selected={selectedCardIds.has(c.id)}
                      onToggleSelect={toggleSelectCard}
                      onUpdate={updateCard}
                      onRemove={removeCard}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </Section>

      {sortType !== 'open' && (
        <Section
          title={`Predefined groups (${groups.length})`}
          description={
            sortType === 'closed'
              ? 'Shown to participants as the fixed set of groups they sort into. They cannot add, rename, or remove groups.'
              : 'Shown to participants as a starting point. They can still add as many of their own as they want.'
          }
          action={
            <Button variant="secondary" size="sm" leftIcon={<CirclePlusIcon />} onClick={addGroup}>
              Add group
            </Button>
          }
        >
          {groups.length === 0 ? (
            <div
              className={cn(
                'rounded-md border border-dashed px-4 py-6 text-center text-sm',
                sortType === 'closed'
                  ? 'border-separatorSerious1 text-fgSerious1'
                  : 'border-separator1 text-fg3',
              )}
            >
              {sortType === 'closed'
                ? 'A closed sort needs at least one group. Add the groups participants will sort into.'
                : 'No predefined groups yet. Add some to give participants a starting point.'}
            </div>
          ) : (
            <ul className="border-separator1 divide-separator1 bg-bg2 divide-y overflow-hidden rounded-md border">
              {groups.map((g) => (
                <li key={g.id} className="flex items-stretch gap-0">
                  <input
                    value={g.label}
                    onChange={(e) => updateGroup(g.id, { label: e.target.value })}
                    placeholder="Group name"
                    className="text-fg0 placeholder:text-fg4 flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none"
                  />
                  <button
                    type="button"
                    aria-label="Remove group"
                    onClick={() => removeGroup(g.id)}
                    className="text-fg3 hover:bg-bg3 hover:text-fgSerious1 border-l-separator1 inline-flex w-10 items-center justify-center border-l"
                  >
                    <TrashCanIcon className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      <Section
        title="Danger zone"
        description="Destructive actions. Cannot be undone."
      >
        <div className="border-separatorSerious1 bg-bgSerious1/40 flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-fg0 text-sm font-semibold">Reset submissions</h3>
            <p className="text-fg3 text-xs">
              {submissionsCount === 0
                ? 'No submissions to reset.'
                : `Permanently delete all ${submissionsCount} submission${submissionsCount === 1 ? '' : 's'} for this study.`}
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            leftIcon={<ArrowUndoUpIcon />}
            disabled={resetting || submissionsCount === 0}
            onClick={resetSubmissions}
          >
            {resetting ? 'Resetting…' : 'Reset submissions'}
          </Button>
        </div>
      </Section>

      <div
        className={cn(
          'text-fg3 sticky bottom-4 -mb-2 inline-flex w-fit items-center gap-2 self-end rounded-full bg-bg1/90 px-3 py-1.5 text-xs backdrop-blur',
          saving === 'idle' && 'invisible',
        )}
      >
        {saving === 'saving' ? 'Saving…' : 'Saved'}
      </div>
    </div>
  );
}

function SortableCardRow({
  card,
  selected,
  onToggleSelect,
  onUpdate,
  onRemove,
}: {
  card: Card;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Card>) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative flex items-stretch gap-0',
        selected ? 'bg-bgAccent1/30' : 'bg-bg2',
        isDragging && 'z-10 shadow-[0_8px_24px_rgba(0,0,0,0.18)]',
      )}
    >
      <div className="flex w-9 shrink-0 items-center justify-center">
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggleSelect(card.id)}
          aria-label={`Select ${card.label || 'card'}`}
        />
      </div>
      <button
        type="button"
        ref={setActivatorNodeRef}
        aria-label="Drag to reorder card"
        className="text-fg4 hover:text-fg2 inline-flex w-9 shrink-0 cursor-grab touch-none items-center justify-center focus:outline-none active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <ReorderIcon className="h-3.5 w-3.5" />
      </button>
      <input
        value={card.label}
        onChange={(e) => onUpdate(card.id, { label: e.target.value })}
        placeholder="Card label"
        className="text-fg0 placeholder:text-fg4 border-l-separator1 w-48 shrink-0 border-l bg-transparent px-3 py-2 text-sm focus:outline-none"
      />
      <input
        value={card.description ?? ''}
        onChange={(e) => onUpdate(card.id, { description: e.target.value || undefined })}
        placeholder="Description (optional)"
        className="text-fg2 placeholder:text-fg4 border-l-separator1 flex-1 border-l bg-transparent px-3 py-2 text-sm focus:outline-none"
      />
      <button
        type="button"
        aria-label="Remove card"
        onClick={() => onRemove(card.id)}
        className="text-fg3 hover:bg-bg3 hover:text-fgSerious1 border-l-separator1 inline-flex w-10 items-center justify-center border-l"
      >
        <TrashCanIcon className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-fg0 text-sm font-semibold">{title}</h2>
          {description && <p className="text-fg3 max-w-xl text-xs">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
