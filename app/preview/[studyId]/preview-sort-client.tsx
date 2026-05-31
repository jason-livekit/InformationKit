'use client';

import { CardSort } from '@/components/card-sort/card-sort';
import type { Card, Group, SortType } from '@/lib/repo/schemas';

interface PreviewSortClientProps {
  studyId: string;
  studyName: string;
  studyDescription: string;
  cards: Card[];
  predefinedGroups: Group[];
  sortType: SortType;
  randomizeCards: boolean;
}

export function PreviewSortClient({
  studyId,
  studyName,
  studyDescription,
  cards,
  predefinedGroups,
  sortType,
  randomizeCards,
}: PreviewSortClientProps) {
  // Open sorts hide the author's predefined groups; hybrid and closed show them.
  const groups = sortType === 'open' ? [] : predefinedGroups;

  return (
    <CardSort
      cards={cards}
      predefinedGroups={groups}
      randomizeCards={randomizeCards}
      lockGroups={sortType === 'closed'}
      draftKey={`card-sort:preview-draft:${studyId}`}
      title={`Preview · ${studyName}`}
      subtitle={
        studyDescription ||
        'You are previewing this study. Submissions are not recorded.'
      }
      badgeLabel="Preview"
    />
  );
}
