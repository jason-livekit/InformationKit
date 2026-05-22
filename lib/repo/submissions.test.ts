import { describe, it, expect, beforeEach } from 'vitest';
import { __resetMemoryStoreForTests } from './redis';
import { upsertUser } from './users';
import { createProject } from './projects';
import { createStudy } from './studies';
import {
  addSubmission,
  listSubmissions,
  resetSubmissions,
  countSubmissions,
} from './submissions';

beforeEach(() => {
  __resetMemoryStoreForTests();
});

async function setupStudy() {
  const owner = await upsertUser({ email: 'o@x.com', name: 'Owner', image: null });
  const project = await createProject({ ownerId: owner.id, name: 'P', description: '' });
  const study = await createStudy({ projectId: project.id, name: 'S', type: 'card-sort' });
  return { owner, project, study };
}

describe('submissions repo', () => {
  it('appends a submission to a study and returns it normalized', async () => {
    const { study } = await setupStudy();
    const sub = await addSubmission(study.id, {
      groups: [{ id: 'g1', label: 'A', cardIds: ['c1'] }],
      unsorted: ['c2'],
      notUseful: [],
    });
    expect(sub.id).toMatch(/^sub_/);
    expect(sub.studyId).toBe(study.id);
    expect(sub.groups).toHaveLength(1);
    expect(sub.unsorted).toEqual(['c2']);
    expect(sub.createdAt).toBeGreaterThan(0);
  });

  it('scopes submissions per study', async () => {
    const { study } = await setupStudy();
    const { study: other } = await setupStudy();
    await addSubmission(study.id, { groups: [], unsorted: [], notUseful: [] });
    await addSubmission(study.id, { groups: [], unsorted: [], notUseful: [] });
    await addSubmission(other.id, { groups: [], unsorted: [], notUseful: [] });
    expect(await countSubmissions(study.id)).toBe(2);
    expect(await countSubmissions(other.id)).toBe(1);
    expect((await listSubmissions(study.id)).every((s) => s.studyId === study.id)).toBe(true);
  });

  it('resets only the target study', async () => {
    const { study } = await setupStudy();
    const { study: other } = await setupStudy();
    await addSubmission(study.id, { groups: [], unsorted: [], notUseful: [] });
    await addSubmission(other.id, { groups: [], unsorted: [], notUseful: [] });
    await resetSubmissions(study.id);
    expect(await countSubmissions(study.id)).toBe(0);
    expect(await countSubmissions(other.id)).toBe(1);
  });
});
