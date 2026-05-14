'use client';

import { CardSort } from '@/components/card-sort/card-sort';
import type { Card, Group } from '@/lib/repo/schemas';

interface PreviewSortClientProps {
  studyId: string;
  studyName: string;
  studyDescription: string;
  cards: Card[];
  predefinedGroups: Group[];
}

export function PreviewSortClient({
  studyId,
  studyName,
  studyDescription,
  cards,
  predefinedGroups,
}: PreviewSortClientProps) {
  return (
    <CardSort
      cards={cards}
      predefinedGroups={predefinedGroups}
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
