import 'server-only';
import { Redis } from '@upstash/redis';
import type { AggregatedResults, Card, Submission, SubmissionInput } from './types';
import { CARDS, CARDS_BY_ID } from './items';

/**
 * Submission store.
 *
 * Production (Vercel + Upstash Redis Marketplace integration):
 *   Submissions are stored as a Redis list (`SUBMISSIONS_KEY`). Every Vercel instance
 *   reads + writes the same list, so all teammates see the same aggregated results,
 *   regardless of which region/instance handled their request.
 *
 *   The Marketplace integration auto-injects `UPSTASH_REDIS_REST_URL` and
 *   `UPSTASH_REDIS_REST_TOKEN`; `Redis.fromEnv()` picks them up automatically.
 *
 * Local dev / no Redis configured:
 *   Falls back to a `globalThis`-backed in-memory list so the app still runs without
 *   any setup. This branch is single-process, so two browsers hitting the same dev
 *   server still see each other's submissions.
 *
 * To enable real cross-user sharing on Vercel:
 *   `vercel integration add upstash`  (or add it from the Marketplace dashboard)
 *   then redeploy. No code changes needed.
 */

const SUBMISSIONS_KEY = 'card-sort:submissions';

interface MemoryStore {
  submissions: Submission[];
}

const STORE_KEY = '__card_sort_memory_store__';

function getMemoryStore(): MemoryStore {
  const g = globalThis as unknown as Record<string, MemoryStore | undefined>;
  if (!g[STORE_KEY]) {
    g[STORE_KEY] = { submissions: [] };
  }
  return g[STORE_KEY]!;
}

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  // Cache the client across invocations to avoid re-instantiating.
  const g = globalThis as unknown as { __card_sort_redis__?: Redis };
  if (!g.__card_sort_redis__) {
    g.__card_sort_redis__ = Redis.fromEnv();
  }
  return g.__card_sort_redis__;
}

function makeId() {
  return `sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeSubmission(input: SubmissionInput): Submission {
  return {
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
}

function parseSubmission(value: unknown): Submission | null {
  // Upstash returns parsed JSON for objects, but values may also come back as strings.
  let obj: unknown = value;
  if (typeof obj === 'string') {
    try {
      obj = JSON.parse(obj);
    } catch {
      return null;
    }
  }
  if (!obj || typeof obj !== 'object') return null;
  const o = obj as Record<string, unknown>;
  if (typeof o.id !== 'string' || typeof o.createdAt !== 'number') return null;
  if (!Array.isArray(o.groups) || !Array.isArray(o.unsorted) || !Array.isArray(o.notUseful)) {
    return null;
  }
  return obj as Submission;
}

export async function listSubmissions(): Promise<Submission[]> {
  const redis = getRedis();
  if (!redis) {
    return [...getMemoryStore().submissions];
  }
  try {
    const raw = await redis.lrange(SUBMISSIONS_KEY, 0, -1);
    return raw.map(parseSubmission).filter((s): s is Submission => s !== null);
  } catch (err) {
    console.error('[card-sort] redis read failed, falling back to memory:', err);
    return [...getMemoryStore().submissions];
  }
}

export async function addSubmission(input: SubmissionInput): Promise<Submission> {
  const submission = normalizeSubmission(input);
  const redis = getRedis();
  if (!redis) {
    getMemoryStore().submissions.push(submission);
    return submission;
  }
  try {
    await redis.rpush(SUBMISSIONS_KEY, JSON.stringify(submission));
  } catch (err) {
    console.error('[card-sort] redis write failed, falling back to memory:', err);
    getMemoryStore().submissions.push(submission);
  }
  return submission;
}

export async function resetSubmissions(): Promise<void> {
  const redis = getRedis();
  getMemoryStore().submissions = [];
  if (!redis) return;
  try {
    await redis.del(SUBMISSIONS_KEY);
  } catch (err) {
    console.error('[card-sort] redis reset failed:', err);
  }
}

export function isSharedStoreConfigured(): boolean {
  return getRedis() !== null;
}

/** Normalize a freeform group label into a canonical key for aggregation. */
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
