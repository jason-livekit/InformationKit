import { describe, it, expect, beforeEach } from 'vitest';
import { __resetMemoryStoreForTests } from './redis';
import { upsertUser } from './users';
import { createProject } from './projects';
import {
  createMap,
  getMap,
  getMapByShareSlug,
  listMapsByProject,
  updateMap,
  deleteMap,
  makeEmptyPage,
} from './maps';

beforeEach(() => {
  __resetMemoryStoreForTests();
});

async function setup() {
  const owner = await upsertUser({ email: 'o@x.com', name: 'Owner', image: null });
  const project = await createProject({ ownerId: owner.id, name: 'P', description: '' });
  return { owner, project };
}

describe('maps repo', () => {
  it('creates a map with a unique share slug and one empty page', async () => {
    const { project } = await setup();
    const m = await createMap({ projectId: project.id, name: 'Onboarding journey' });
    expect(m.id).toMatch(/^mapdoc_/);
    expect(m.projectId).toBe(project.id);
    expect(m.name).toBe('Onboarding journey');
    expect(m.published).toBe(false);
    expect(m.shareSlug.length).toBeGreaterThan(4);
    expect(m.pages).toHaveLength(1);
    expect(m.pages[0]!.table.rows).toEqual([]);
  });

  it('looks up by share slug', async () => {
    const { project } = await setup();
    const m = await createMap({ projectId: project.id, name: 'A' });
    expect((await getMapByShareSlug(m.shareSlug))?.id).toBe(m.id);
    expect(await getMapByShareSlug('nope')).toBeNull();
  });

  it('lists maps by project in creation order', async () => {
    const { project } = await setup();
    await createMap({ projectId: project.id, name: 'A' });
    await createMap({ projectId: project.id, name: 'B' });
    const maps = await listMapsByProject(project.id);
    expect(maps.map((m) => m.name)).toEqual(['A', 'B']);
  });

  it('updates name, published, and pages and bumps updatedAt', async () => {
    const { project } = await setup();
    const m = await createMap({ projectId: project.id, name: 'A' });
    await new Promise((r) => setTimeout(r, 5));
    const page = makeEmptyPage('Page 2');
    const updated = await updateMap(m.id, {
      name: 'A2',
      published: true,
      pages: [...m.pages, page],
    });
    expect(updated!.name).toBe('A2');
    expect(updated!.published).toBe(true);
    expect(updated!.pages).toHaveLength(2);
    expect(updated!.updatedAt).toBeGreaterThanOrEqual(m.updatedAt);
  });

  it('deletes a map, its slug index, and the project list entry', async () => {
    const { project } = await setup();
    const m = await createMap({ projectId: project.id, name: 'A' });
    await deleteMap(m.id);
    expect(await getMap(m.id)).toBeNull();
    expect(await getMapByShareSlug(m.shareSlug)).toBeNull();
    expect(await listMapsByProject(project.id)).toEqual([]);
  });
});
