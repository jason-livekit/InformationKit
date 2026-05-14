'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { Study, Card, Group } from '@/lib/repo/schemas';
import { Button } from '@/components/bytes/Button';
import { CirclePlusIcon, TrashCanIcon } from '@/icons/react';
import { cn } from '@/lib/bytes/utils';

interface SetupTabProps {
  study: Study;
}

function uid(prefix: string) {
  return `${prefix}${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function SetupTab({ study }: SetupTabProps) {
  const router = useRouter();
  const [name, setName] = React.useState(study.name);
  const [description, setDescription] = React.useState(study.description);
  const [cards, setCards] = React.useState<Card[]>(study.cards);
  const [groups, setGroups] = React.useState<Group[]>(study.predefinedGroups);
  const [saving, setSaving] = React.useState<'idle' | 'saving' | 'saved'>('idle');
  const dirtyRef = React.useRef(false);

  React.useEffect(() => {
    if (!dirtyRef.current) return;
    const t = setTimeout(async () => {
      setSaving('saving');
      await fetch(`/api/studies/${study.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, cards, predefinedGroups: groups }),
      });
      dirtyRef.current = false;
      setSaving('saved');
      router.refresh();
      setTimeout(() => setSaving('idle'), 1500);
    }, 600);
    return () => clearTimeout(t);
  }, [name, description, cards, groups, study.id, router]);

  function markDirty() {
    dirtyRef.current = true;
  }

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
        title={`Cards (${cards.length})`}
        description="Each card is a thing participants will sort. Add a short label, optionally a context tag (e.g. “Token”) for disambiguation."
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
          <ul className="border-separator1 divide-separator1 bg-bg2 divide-y overflow-hidden rounded-md border">
            {cards.map((c) => (
              <li key={c.id} className="flex items-stretch gap-0">
                <input
                  value={c.label}
                  onChange={(e) => updateCard(c.id, { label: e.target.value })}
                  placeholder="Card label"
                  className="text-fg0 placeholder:text-fg4 flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none"
                />
                <input
                  value={c.context ?? ''}
                  onChange={(e) =>
                    updateCard(c.id, { context: e.target.value.trim() || undefined })
                  }
                  placeholder="Context (optional)"
                  className="text-fg2 placeholder:text-fg4 border-l-separator1 w-40 border-l bg-transparent px-3 py-2 font-mono text-xs uppercase tracking-wider focus:outline-none"
                />
                <button
                  type="button"
                  aria-label="Remove card"
                  onClick={() => removeCard(c.id)}
                  className="text-fg3 hover:bg-bg3 hover:text-fgSerious1 border-l-separator1 inline-flex w-10 items-center justify-center border-l"
                >
                  <TrashCanIcon className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title={`Predefined groups (${groups.length})`}
        description="Optional. Pre-create groups participants can drop cards into. Leave empty to let them create groups from scratch."
        action={
          <Button variant="secondary" size="sm" leftIcon={<CirclePlusIcon />} onClick={addGroup}>
            Add group
          </Button>
        }
      >
        {groups.length === 0 ? (
          <div className="border-separator1 text-fg3 rounded-md border border-dashed px-4 py-6 text-center text-sm">
            No predefined groups. Participants will create their own.
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
