import { describe, it, expect, beforeEach } from 'vitest';
import { __resetMemoryStoreForTests } from './redis';
import { upsertUser } from './users';
import { createProject, getProject, listProjectsByOwner, updateProject, deleteProject } from './projects';

beforeEach(() => {
  __resetMemoryStoreForTests();
});

async function makeOwner() {
  return upsertUser({ email: 'o@x.com', name: 'Owner', image: null });
}

describe('projects repo', () => {
  it('creates a project owned by a user', async () => {
    const owner = await makeOwner();
    const p = await createProject({ ownerId: owner.id, name: 'P', description: 'desc' });
    expect(p.id).toMatch(/^p_/);
    expect(p.ownerId).toBe(owner.id);
    expect(p.name).toBe('P');
    expect(p.description).toBe('desc');
    expect(p.createdAt).toBeGreaterThan(0);
    expect(p.updatedAt).toBe(p.createdAt);
  });

  it('lists projects scoped to an owner', async () => {
    const owner = await makeOwner();
    const other = await upsertUser({ email: 'x@y.com', name: 'X', image: null });
    await createProject({ ownerId: owner.id, name: 'A', description: '' });
    await createProject({ ownerId: owner.id, name: 'B', description: '' });
    await createProject({ ownerId: other.id, name: 'C', description: '' });
    const mine = await listProjectsByOwner(owner.id);
    expect(mine.map((p) => p.name).sort()).toEqual(['A', 'B']);
  });

  it('updates name + description and bumps updatedAt', async () => {
    const owner = await makeOwner();
    const p = await createProject({ ownerId: owner.id, name: 'A', description: 'old' });
    // Ensure clock tick.
    await new Promise((r) => setTimeout(r, 5));
    const updated = await updateProject(p.id, { name: 'A2', description: 'new' });
    expect(updated!.name).toBe('A2');
    expect(updated!.description).toBe('new');
    expect(updated!.updatedAt).toBeGreaterThanOrEqual(p.updatedAt);
  });

  it('deletes a project and removes it from the owner index', async () => {
    const owner = await makeOwner();
    const p = await createProject({ ownerId: owner.id, name: 'A', description: '' });
    await deleteProject(p.id);
    expect(await getProject(p.id)).toBeNull();
    expect(await listProjectsByOwner(owner.id)).toEqual([]);
  });
});
