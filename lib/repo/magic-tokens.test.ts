import { describe, it, expect, beforeEach } from 'vitest';
import { __resetMemoryStoreForTests } from './redis';
import {
  issueMagicToken,
  consumeMagicToken,
  MAGIC_TOKEN_TTL_MS,
} from './magic-tokens';

beforeEach(() => {
  __resetMemoryStoreForTests();
});

describe('magic tokens', () => {
  it('issues an opaque token tied to an email', async () => {
    const { token, expiresAt } = await issueMagicToken('alice@example.com');
    expect(token).toMatch(/^[a-z0-9-]+$/);
    expect(token.length).toBeGreaterThan(16);
    expect(expiresAt).toBeGreaterThan(Date.now());
    expect(expiresAt).toBeLessThanOrEqual(Date.now() + MAGIC_TOKEN_TTL_MS + 50);
  });

  it('consumes a valid token exactly once', async () => {
    const { token } = await issueMagicToken('alice@example.com');
    const email = await consumeMagicToken(token);
    expect(email).toBe('alice@example.com');
    // second consumption returns null (single-use)
    expect(await consumeMagicToken(token)).toBeNull();
  });

  it('returns null for unknown tokens', async () => {
    expect(await consumeMagicToken('not-a-real-token')).toBeNull();
  });

  it('returns null and clears an expired token', async () => {
    const { token } = await issueMagicToken('alice@example.com', { ttlMs: 1 });
    await new Promise((r) => setTimeout(r, 10));
    expect(await consumeMagicToken(token)).toBeNull();
  });

  it('lowercases the email so the verification path is case-insensitive', async () => {
    const { token } = await issueMagicToken('Alice@Example.COM');
    expect(await consumeMagicToken(token)).toBe('alice@example.com');
  });
});
