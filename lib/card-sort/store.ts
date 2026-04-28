import 'server-only';
import type { AggregatedResults, Card, Submission, SubmissionInput } from './types';
import { CARDS, CARDS_BY_ID } from './items';

/**
 * Tiny in-memory store for card-sort submissions.
 *
 * Notes:
 * - State lives on `globalThis` so it survives Next.js HMR in dev.
 * - On Vercel, storage is per-instance / per-region. For a small team poll this is fine.
 *   When the team grows, swap the read/write helpers for Vercel KV or a database.
 */

interface SubmissionsStore {
  submissions: Submission[];
}

const STORE_KEY = '__card_sort_store__';

function getStore(): SubmissionsStore {
  const g = globalThis as unknown as Record<string, SubmissionsStore | undefined>;
  if (!g[STORE_KEY]) {
    g[STORE_KEY] = { submissions: [] };
  }
  return g[STORE_KEY]!;
}

function makeId() {
  return `sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function listSubmissions(): Submission[] {
  return [...getStore().submissions];
}

export function addSubmission(input: SubmissionInput): Submission {
  const submission: Submission = {
    id: makeId(),
    createdAt: Date.now(),
    groups: input.groups.map((g) => ({
      id: g.id,
      label: g.label.trim() || 'Untitled group',
      cardIds: [...g.cardIds],
    })),
    unsorted: [...input.unsorted],
    notUseful: [...input.notUseful],
  };
  getStore().submissions.push(submission);
  return submission;
}

export function resetSubmissions(): void {
  getStore().submissions = [];
}

/**
 * Normalize a freeform group label into a canonical key for aggregation.
 * Lowercases, trims, collapses whitespace, strips trailing punctuation.
 */
function normalizeGroupLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[\s_/\-]+/g, ' ')
    .replace(/[^\p{L}\p{N} ]+/gu, '')
    .trim();
}

export function aggregate(): AggregatedResults {
  const submissions = listSubmissions();
  const cards: Card[] = CARDS;

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
      if (notUsefulByCard[id] !== undefined) notUsefulByCard[id]! += 1;
    }
    for (const group of sub.groups) {
      const key = normalizeGroupLabel(group.label) || 'untitled';
      groupNameTotals[key] = (groupNameTotals[key] ?? 0) + 1;
      for (const id of group.cardIds) {
        if (!groupNameCountsByCard[id]) continue;
        groupNameCountsByCard[id]![key] = (groupNameCountsByCard[id]![key] ?? 0) + 1;
      }
      for (let i = 0; i < group.cardIds.length; i++) {
        for (let j = 0; j < group.cardIds.length; j++) {
          if (i === j) continue;
          const a = group.cardIds[i]!;
          const b = group.cardIds[j]!;
          if (!pairCounts[a]) continue;
          pairCounts[a]![b] = (pairCounts[a]![b] ?? 0) + 1;
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

export { CARDS, CARDS_BY_ID };
