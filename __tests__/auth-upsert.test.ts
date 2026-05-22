import { describe, it, expect, beforeEach } from 'vitest';
import { __resetMemoryStoreForTests } from '@/lib/repo/redis';
import { upsertUser, getUserByEmail } from '@/lib/repo/users';

beforeEach(() => {
  __resetMemoryStoreForTests();
});

describe('auth.signIn → upsertUser semantics', () => {
  it('a fresh Google sign-in creates a user record', async () => {
    await upsertUser({ email: 'jane@example.com', name: 'Jane', image: null });
    const found = await getUserByEmail('jane@example.com');
    expect(found?.name).toBe('Jane');
  });

  it('a returning sign-in refreshes name + image but keeps id', async () => {
    const first = await upsertUser({ email: 'jane@example.com', name: 'Jane', image: null });
    const second = await upsertUser({
      email: 'jane@example.com',
      name: 'Jane Doe',
      image: 'https://x/y.png',
    });
    expect(second.id).toBe(first.id);
    expect(second.name).toBe('Jane Doe');
    expect(second.image).toBe('https://x/y.png');
  });
});
