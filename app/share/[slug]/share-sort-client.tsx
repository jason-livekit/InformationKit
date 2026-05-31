'use client';

import * as React from 'react';
import { CardSort } from '@/components/card-sort/card-sort';
import type { Card, Group, SortType, SubmissionInput } from '@/lib/repo/schemas';
import { Badge } from '@/components/bytes/Badge';
import { CircleCheckIcon } from '@/icons/react';
import { DotFill } from '@/components/card-sort/dot-fill';

interface ShareSortClientProps {
  studyId: string;
  studyName: string;
  studyDescription: string;
  cards: Card[];
  predefinedGroups: Group[];
  sortType: SortType;
  randomizeCards: boolean;
  closed: boolean;
}

export function ShareSortClient({
  studyId,
  studyName,
  studyDescription,
  cards,
  predefinedGroups,
  sortType,
  randomizeCards,
  closed,
}: ShareSortClientProps) {
  const [submitted, setSubmitted] = React.useState(false);

  if (closed) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 px-6 py-16 text-center">
        <Badge variant="muted" size="medium">
          Closed
        </Badge>
        <h1 className="font-display text-fg0 text-2xl">{studyName}</h1>
        <p className="text-fg3 max-w-md text-sm">
          This study is no longer accepting submissions. Thanks for stopping by!
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 px-6 py-16 text-center">
        <div className="border-separator1 bg-bg1 relative flex flex-col items-center gap-3 overflow-hidden rounded-xl border px-8 py-10">
          <DotFill tone="accent" opacity={0.18} />
          <CircleCheckIcon className="text-fgSuccess relative h-10 w-10" />
          <h1 className="font-display text-fg0 relative text-2xl">Thanks for sorting!</h1>
          <p className="text-fg3 relative max-w-md text-sm">
            Your sort has been submitted. You can close this tab, or take it again to see if you
            arrive at the same groups.
          </p>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="text-fgAccent1 relative text-sm font-semibold hover:underline"
          >
            Take it again
          </button>
        </div>
      </div>
    );
  }

  async function handleSubmit(input: SubmissionInput) {
    const res = await fetch(`/api/studies/${studyId}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(j.error || 'Failed to submit');
    }
    setSubmitted(true);
  }

  // Open sorts hide the author's predefined groups; hybrid and closed show them.
  const groups = sortType === 'open' ? [] : predefinedGroups;

  return (
    <CardSort
      cards={cards}
      predefinedGroups={groups}
      randomizeCards={randomizeCards}
      lockGroups={sortType === 'closed'}
      draftKey={`card-sort:draft:${studyId}`}
      title={studyName}
      subtitle={studyDescription || 'Drag cards into groups, mark anything irrelevant as not useful, then submit.'}
      badgeLabel="Card sort"
      onSubmit={handleSubmit}
    />
  );
}
