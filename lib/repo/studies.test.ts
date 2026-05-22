import { describe, it, expect, beforeEach } from 'vitest';
import { __resetMemoryStoreForTests } from './redis';
import { upsertUser } from './users';
import { createProject } from './projects';
import {
  createStudy,
  getStudy,
  getStudyByShareSlug,
  listStudiesByProject,
  updateStudy,
  deleteStudy,
} from './studies';

beforeEach(() => {
  __resetMemoryStoreForTests();
});

async function setup() {
  const owner = await upsertUser({ email: 'o@x.com', name: 'Owner', image: null });
  const project = await createProject({ ownerId: owner.id, name: 'P', description: '' });
  return { owner, project };
}

describe('studies repo', () => {
  it('creates a study with a unique share slug', async () => {
    const { project } = await setup();
    const s = await createStudy({ projectId: project.id, name: 'Sort', type: 'card-sort' });
    expect(s.id).toMatch(/^st_/);
    expect(s.projectId).toBe(project.id);
    expect(s.name).toBe('Sort');
    expect(s.status).toBe('draft');
    expect(s.shareSlug.length).toBeGreaterThan(4);
    expect(s.cards).toEqual([]);
    expect(s.predefinedGroups).toEqual([]);
  });

  it('looks up by share slug', async () => {
    const { project } = await setup();
    const s = await createStudy({ projectId: project.id, name: 'Sort', type: 'card-sort' });
    expect((await getStudyByShareSlug(s.shareSlug))?.id).toBe(s.id);
    expect(await getStudyByShareSlug('nope')).toBeNull();
  });

  it('lists studies by project in creation order', async () => {
    const { project } = await setup();
    await createStudy({ projectId: project.id, name: 'A', type: 'card-sort' });
    await createStudy({ projectId: project.id, name: 'B', type: 'card-sort' });
    const studies = await listStudiesByProject(project.id);
    expect(studies.map((s) => s.name)).toEqual(['A', 'B']);
  });

  it('updates fields and bumps updatedAt', async () => {
    const { project } = await setup();
    const s = await createStudy({ projectId: project.id, name: 'A', type: 'card-sort' });
    await new Promise((r) => setTimeout(r, 5));
    const updated = await updateStudy(s.id, {
      name: 'A2',
      description: 'new',
      status: 'open',
      cards: [{ id: 'c1', label: 'One' }],
      predefinedGroups: [{ id: 'g1', label: 'Group', cardIds: [] }],
    });
    expect(updated!.name).toBe('A2');
    expect(updated!.status).toBe('open');
    expect(updated!.cards).toHaveLength(1);
    expect(updated!.predefinedGroups).toHaveLength(1);
    expect(updated!.updatedAt).toBeGreaterThanOrEqual(s.updatedAt);
  });

  it('deletes a study, its slug index, and the project list entry', async () => {
    const { project } = await setup();
    const s = await createStudy({ projectId: project.id, name: 'A', type: 'card-sort' });
    await deleteStudy(s.id);
    expect(await getStudy(s.id)).toBeNull();
    expect(await getStudyByShareSlug(s.shareSlug)).toBeNull();
    expect(await listStudiesByProject(project.id)).toEqual([]);
  });
});
