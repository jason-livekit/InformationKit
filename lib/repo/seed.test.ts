import { describe, it, expect, beforeEach } from 'vitest';
import { __resetMemoryStoreForTests, getKV } from './redis';
import {
  ensureSeed,
  __resetSeedForTests,
  DEMO_STUDY_ID,
  DEMO_PROJECT_ID,
  DEMO_SHARE_SLUG,
} from './seed';
import { getStudy, getStudyByShareSlug, listStudiesByProject } from './studies';
import { countSubmissions, listSubmissions } from './submissions';

beforeEach(() => {
  __resetMemoryStoreForTests();
  __resetSeedForTests();
});

describe('demo seed', () => {
  it('creates the demo project + study on first run', async () => {
    await ensureSeed();
    const study = await getStudy(DEMO_STUDY_ID);
    expect(study).not.toBeNull();
    expect(study!.shareSlug).toBe(DEMO_SHARE_SLUG);
    expect(study!.status).toBe('open');
    expect(study!.cards.length).toBeGreaterThan(0);
    expect((await getStudyByShareSlug(DEMO_SHARE_SLUG))?.id).toBe(DEMO_STUDY_ID);
    const studies = await listStudiesByProject(DEMO_PROJECT_ID);
    expect(studies.map((s) => s.id)).toContain(DEMO_STUDY_ID);
  });

  it('is idempotent — running again does not duplicate the study', async () => {
    await ensureSeed();
    await ensureSeed();
    const studies = await listStudiesByProject(DEMO_PROJECT_ID);
    expect(studies.filter((s) => s.id === DEMO_STUDY_ID)).toHaveLength(1);
  });

  it('migrates legacy submissions, tagging each with the demo study id', async () => {
    const kv = getKV();
    const legacy = {
      id: 'sub_old1',
      createdAt: 1000,
      groups: [{ id: 'g1', label: 'A', cardIds: ['room'] }],
      unsorted: ['duration'],
      notUseful: [],
    };
    await kv.listPush('card-sort:submissions', JSON.stringify(legacy));
    await ensureSeed();
    expect(await countSubmissions(DEMO_STUDY_ID)).toBe(1);
    const subs = await listSubmissions(DEMO_STUDY_ID);
    expect(subs[0]!.studyId).toBe(DEMO_STUDY_ID);
    expect(subs[0]!.id).toBe('sub_old1');
  });
});
