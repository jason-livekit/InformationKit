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
  duplicateStudy,
} from './studies';
import { addSubmission, countSubmissions } from './submissions';

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
    expect(s.sortType).toBe('hybrid');
    expect(s.randomizeCards).toBe(false);
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

  it('updates sortType and randomizeCards', async () => {
    const { project } = await setup();
    const s = await createStudy({ projectId: project.id, name: 'A', type: 'card-sort' });
    const updated = await updateStudy(s.id, { sortType: 'closed', randomizeCards: true });
    expect(updated!.sortType).toBe('closed');
    expect(updated!.randomizeCards).toBe(true);
  });

  it('duplicates a study: copies setup, resets run-specific fields', async () => {
    const { project } = await setup();
    const source = await updateStudy(
      (await createStudy({ projectId: project.id, name: 'IA sort', type: 'card-sort' })).id,
      {
        description: 'desc',
        status: 'open',
        cards: [{ id: 'c1', label: 'One' }, { id: 'c2', label: 'Two' }],
        predefinedGroups: [{ id: 'g1', label: 'Group', cardIds: ['c1'] }],
        sortType: 'hybrid',
        randomizeCards: true,
        standardization: { categories: [{ id: 's1', name: 'Cat', labels: ['cat'] }] },
      },
    );
    await addSubmission(source!.id, { groups: [], unsorted: ['c1', 'c2'], notUseful: [] });

    const copy = await duplicateStudy(source!.id);
    expect(copy).not.toBeNull();
    // New identity, fresh slug.
    expect(copy!.id).not.toBe(source!.id);
    expect(copy!.shareSlug).not.toBe(source!.shareSlug);
    // Same project, default "(copy)" name suffix.
    expect(copy!.projectId).toBe(project.id);
    expect(copy!.name).toBe('IA sort (copy)');
    // Setup carried over.
    expect(copy!.description).toBe('desc');
    expect(copy!.type).toBe('card-sort');
    expect(copy!.cards).toEqual(source!.cards);
    expect(copy!.predefinedGroups).toEqual(source!.predefinedGroups);
    expect(copy!.sortType).toBe('hybrid');
    expect(copy!.randomizeCards).toBe(true);
    // Run-specific state reset.
    expect(copy!.status).toBe('draft');
    expect(copy!.standardization).toBeUndefined();
    expect(await countSubmissions(copy!.id)).toBe(0);
    // Source untouched, including its submissions.
    expect(await countSubmissions(source!.id)).toBe(1);
  });

  it('adds the duplicate to the project study list and looks it up by slug', async () => {
    const { project } = await setup();
    const source = await createStudy({ projectId: project.id, name: 'A', type: 'card-sort' });
    const copy = await duplicateStudy(source.id);
    const studies = await listStudiesByProject(project.id);
    expect(studies.map((s) => s.id)).toEqual([source.id, copy!.id]);
    expect((await getStudyByShareSlug(copy!.shareSlug))?.id).toBe(copy!.id);
  });

  it('accepts a name override and returns null for a missing source', async () => {
    const { project } = await setup();
    const source = await createStudy({ projectId: project.id, name: 'A', type: 'card-sort' });
    const copy = await duplicateStudy(source.id, { name: 'Custom name' });
    expect(copy!.name).toBe('Custom name');
    expect(await duplicateStudy('st_missing')).toBeNull();
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
