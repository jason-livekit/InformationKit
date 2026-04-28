import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { AggregatedResults, Card, Submission, SubmissionInput } from './types';
import { CARDS, CARDS_BY_ID } from './items';

/**
 * Tiny submission store.
 *
 * Strategy:
 * - In-memory state on `globalThis` so it survives Next.js HMR in dev.
 * - Best-effort mirror to a JSON file (`/tmp/card-sort-submissions.json` on Vercel) so the
 *   same warm instance recovers state across reloads.
 *
 * On Vercel, `/tmp` is per-instance and ephemeral. For a small team poll done in one sitting
 * this is plenty; once the team grows or you need true cross-region consistency, swap
 * `loadFromDisk` / `saveToDisk` for Vercel KV or another shared store.
 */

interface SubmissionsStore {
  submissions: Submission[];
  loaded: boolean;
}

const STORE_KEY = '__card_sort_store__';
const FILE_PATH = path.join(
  process.env.CARD_SORT_DATA_DIR || (process.env.VERCEL ? '/tmp' : '.next/cache'),
  'card-sort-submissions.json',
);

function getStore(): SubmissionsStore {
  const g = globalThis as unknown as Record<string, SubmissionsStore | undefined>;
  if (!g[STORE_KEY]) {
    g[STORE_KEY] = { submissions: [], loaded: false };
  }
  return g[STORE_KEY]!;
}

async function loadFromDisk(store: SubmissionsStore) {
  if (store.loaded) return;
  store.loaded = true;
  try {
    const raw = await fs.readFile(FILE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as { submissions?: unknown };
    if (Array.isArray(parsed.submissions)) {
      store.submissions = parsed.submissions as Submission[];
    }
  } catch {
    // file may not exist yet — that's fine
  }
}

async function saveToDisk(store: SubmissionsStore) {
  try {
    await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
    await fs.writeFile(
      FILE_PATH,
      JSON.stringify({ submissions: store.submissions }, null, 2),
      'utf8',
    );
  } catch {
    // Disk persistence is best-effort. In-memory store still works.
  }
}

async function ensureLoaded() {
  const store = getStore();
  if (!store.loaded) {
    await loadFromDisk(store);
  }
  return store;
}

function makeId() {
  return `sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function listSubmissions(): Promise<Submission[]> {
  const store = await ensureLoaded();
  return [...store.submissions];
}

export async function addSubmission(input: SubmissionInput): Promise<Submission> {
  const store = await ensureLoaded();
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
  store.submissions.push(submission);
  void saveToDisk(store);
  return submission;
}

export async function resetSubmissions(): Promise<void> {
  const store = await ensureLoaded();
  store.submissions = [];
  void saveToDisk(store);
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

export async function aggregate(): Promise<AggregatedResults> {
  const submissions = await listSubmissions();
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
