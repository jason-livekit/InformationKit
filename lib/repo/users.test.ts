import { describe, it, expect, beforeEach } from 'vitest';
import { __resetMemoryStoreForTests } from './redis';
import { upsertUser, getUserById, getUserByEmail } from './users';

beforeEach(() => {
  __resetMemoryStoreForTests();
});

describe('users repo', () => {
  it('creates a user on first upsert', async () => {
    const u = await upsertUser({ email: 'a@b.com', name: 'Alice', image: null });
    expect(u.id).toMatch(/^u_/);
    expect(u.email).toBe('a@b.com');
    expect(u.createdAt).toBeGreaterThan(0);
  });

  it('returns the same user on subsequent upserts of the same email', async () => {
    const first = await upsertUser({ email: 'a@b.com', name: 'Alice', image: null });
    const second = await upsertUser({ email: 'a@b.com', name: 'Alice Updated', image: 'x' });
    expect(second.id).toBe(first.id);
    expect(second.createdAt).toBe(first.createdAt);
    expect(second.name).toBe('Alice Updated');
    expect(second.image).toBe('x');
  });

  it('looks up by id and email', async () => {
    const u = await upsertUser({ email: 'a@b.com', name: 'Alice', image: null });
    expect(await getUserById(u.id)).toEqual(u);
    expect(await getUserByEmail('a@b.com')).toEqual(u);
    expect(await getUserByEmail('nobody@nowhere.com')).toBeNull();
  });
});
