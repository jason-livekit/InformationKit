import 'server-only';
import { Redis } from '@upstash/redis';

/**
 * Thin KV interface used by every repo. Two implementations:
 *
 *   - Upstash Redis (REST). Credentials are read from either naming scheme:
 *       · UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (Upstash's own names)
 *       · KV_REST_API_URL / KV_REST_API_TOKEN (what the Vercel Marketplace
 *         "Upstash for Redis" integration injects)
 *   - In-memory (dev fallback + tests)
 *
 * The in-memory store is process-global so concurrent requests in dev see
 * each other's writes, and so tests can reset between cases.
 */
export interface KV {
  jsonGet<T = unknown>(key: string): Promise<T | null>;
  jsonSet(key: string, value: unknown): Promise<void>;
  del(key: string): Promise<void>;
  getString(key: string): Promise<string | null>;
  setString(key: string, value: string): Promise<void>;
  listPush(key: string, value: string): Promise<void>;
  listRange(key: string, start: number, stop: number): Promise<string[]>;
  listLen(key: string): Promise<number>;
  setAdd(key: string, member: string): Promise<void>;
  setRem(key: string, member: string): Promise<void>;
  setMembers(key: string): Promise<string[]>;
}

interface MemoryStore {
  values: Map<string, unknown>;
  lists: Map<string, string[]>;
  sets: Map<string, Set<string>>;
}

const STORE_KEY = '__information_kit_memory_store__';

function getMemoryStore(): MemoryStore {
  const g = globalThis as unknown as Record<string, MemoryStore | undefined>;
  if (!g[STORE_KEY]) {
    g[STORE_KEY] = {
      values: new Map(),
      lists: new Map(),
      sets: new Map(),
    };
  }
  return g[STORE_KEY]!;
}

function makeMemoryKV(): KV {
  const store = getMemoryStore();
  return {
    async jsonGet<T>(key: string): Promise<T | null> {
      const v = store.values.get(key);
      return (v ?? null) as T | null;
    },
    async jsonSet(key: string, value: unknown): Promise<void> {
      store.values.set(key, value);
    },
    async del(key: string): Promise<void> {
      store.values.delete(key);
      store.lists.delete(key);
      store.sets.delete(key);
    },
    async getString(key: string): Promise<string | null> {
      const v = store.values.get(key);
      return typeof v === 'string' ? v : null;
    },
    async setString(key: string, value: string): Promise<void> {
      store.values.set(key, value);
    },
    async listPush(key: string, value: string): Promise<void> {
      const arr = store.lists.get(key) ?? [];
      arr.push(value);
      store.lists.set(key, arr);
    },
    async listRange(key: string, start: number, stop: number): Promise<string[]> {
      const arr = store.lists.get(key) ?? [];
      // Redis lrange is inclusive; -1 means last element.
      const end = stop === -1 ? arr.length : stop + 1;
      return arr.slice(start, end);
    },
    async listLen(key: string): Promise<number> {
      return store.lists.get(key)?.length ?? 0;
    },
    async setAdd(key: string, member: string): Promise<void> {
      const s = store.sets.get(key) ?? new Set<string>();
      s.add(member);
      store.sets.set(key, s);
    },
    async setRem(key: string, member: string): Promise<void> {
      store.sets.get(key)?.delete(member);
    },
    async setMembers(key: string): Promise<string[]> {
      return Array.from(store.sets.get(key) ?? []);
    },
  };
}

function makeRedisKV(redis: Redis): KV {
  return {
    async jsonGet<T>(key: string): Promise<T | null> {
      const raw = await redis.get<unknown>(key);
      if (raw === null || raw === undefined) return null;
      if (typeof raw === 'string') {
        try {
          return JSON.parse(raw) as T;
        } catch {
          return null;
        }
      }
      return raw as T;
    },
    async jsonSet(key: string, value: unknown): Promise<void> {
      await redis.set(key, JSON.stringify(value));
    },
    async del(key: string): Promise<void> {
      await redis.del(key);
    },
    async getString(key: string): Promise<string | null> {
      const raw = await redis.get<unknown>(key);
      return typeof raw === 'string' ? raw : raw === null || raw === undefined ? null : String(raw);
    },
    async setString(key: string, value: string): Promise<void> {
      await redis.set(key, value);
    },
    async listPush(key: string, value: string): Promise<void> {
      await redis.rpush(key, value);
    },
    async listRange(key: string, start: number, stop: number): Promise<string[]> {
      const raw = await redis.lrange(key, start, stop);
      return raw.map((v) => (typeof v === 'string' ? v : JSON.stringify(v)));
    },
    async listLen(key: string): Promise<number> {
      return await redis.llen(key);
    },
    async setAdd(key: string, member: string): Promise<void> {
      await redis.sadd(key, member);
    },
    async setRem(key: string, member: string): Promise<void> {
      await redis.srem(key, member);
    },
    async setMembers(key: string): Promise<string[]> {
      const raw = await redis.smembers(key);
      return raw.map(String);
    },
  };
}

let cached: KV | null = null;
let cachedKind: 'redis' | 'memory' | null = null;

/**
 * Resolve Upstash REST credentials from the environment, accepting both the
 * UPSTASH_REDIS_REST_* names and the KV_REST_API_* names that the Vercel
 * Marketplace Upstash integration injects. Returns null when neither pair is set.
 */
function resolveRedisCreds(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (url && token) return { url, token };
  return null;
}

export function getKV(): KV {
  if (cached) return cached;
  const creds = resolveRedisCreds();
  if (creds) {
    cached = makeRedisKV(new Redis({ url: creds.url, token: creds.token }));
    cachedKind = 'redis';
  } else {
    cached = makeMemoryKV();
    cachedKind = 'memory';
  }
  return cached;
}

export function isSharedStoreConfigured(): boolean {
  getKV();
  return cachedKind === 'redis';
}

/**
 * Test-only helper. Clears the in-memory store between cases.
 */
export function __resetMemoryStoreForTests(): void {
  if (process.env.NODE_ENV === 'production') return;
  const g = globalThis as unknown as Record<string, MemoryStore | undefined>;
  g[STORE_KEY] = undefined;
  cached = null;
  cachedKind = null;
}
