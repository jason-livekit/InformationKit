import type { Card, Submission } from '@/lib/repo/schemas';

export interface AggregatedResults {
  totalSubmissions: number;
  cards: Card[];
  notUsefulByCard: Record<string, number>;
  pairCounts: Record<string, Record<string, number>>;
  groupNameCountsByCard: Record<string, Record<string, number>>;
  groupNameTotals: Record<string, number>;
  recentSubmissions: {
    id: string;
    createdAt: number;
    groupCount: number;
    notUsefulCount: number;
  }[];
}

export interface AggregateInput {
  cards: Card[];
  submissions: Submission[];
}

export function normalizeGroupLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[\s_/\-]+/g, ' ')
    .replace(/[^\p{L}\p{N} ]+/gu, '')
    .trim();
}

export function aggregate({ cards, submissions }: AggregateInput): AggregatedResults {
  const notUsefulByCard: Record<string, number> = {};
  const pairCounts: Record<string, Record<string, number>> = {};
  const groupNameCountsByCard: Record<string, Record<string, number>> = {};
  const groupNameTotals: Record<string, number> = {};

  for (const card of cards) {
    notUsefulByCard[card.id] = 0;
    pairCounts[card.id] = {};
    groupNameCountsByCard[card.id] = {};
  }

  for (const sub of submissions) {
    for (const id of sub.notUseful) {
      if (notUsefulByCard[id] !== undefined) notUsefulByCard[id] += 1;
    }
    for (const group of sub.groups) {
      const key = normalizeGroupLabel(group.label) || 'untitled';
      groupNameTotals[key] = (groupNameTotals[key] ?? 0) + 1;
      for (const id of group.cardIds) {
        if (!groupNameCountsByCard[id]) continue;
        groupNameCountsByCard[id][key] = (groupNameCountsByCard[id][key] ?? 0) + 1;
      }
      for (let i = 0; i < group.cardIds.length; i++) {
        for (let j = 0; j < group.cardIds.length; j++) {
          if (i === j) continue;
          const a = group.cardIds[i]!;
          const b = group.cardIds[j]!;
          if (!pairCounts[a]) continue;
          pairCounts[a][b] = (pairCounts[a][b] ?? 0) + 1;
        }
      }
    }
  }

  const recentSubmissions = submissions
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 25)
    .map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      groupCount: s.groups.length,
      notUsefulCount: s.notUseful.length,
    }));

  return {
    totalSubmissions: submissions.length,
    cards,
    notUsefulByCard,
    pairCounts,
    groupNameCountsByCard,
    groupNameTotals,
    recentSubmissions,
  };
}
