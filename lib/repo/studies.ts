import { getKV } from './redis';
import {
  StudySchema,
  type Study,
  type StudyType,
  type StudyStatus,
  type Card,
  type Group,
  type Standardization,
} from './schemas';
import { makeId, makeSlug } from './ids';

const studyKey = (id: string) => `study:${id}`;
const studiesByProjectKey = (projectId: string) => `project:${projectId}:studies`;
const studyByShareSlugKey = (slug: string) => `study:byShareSlug:${slug}`;

export interface CreateStudyInput {
  projectId: string;
  name: string;
  type: StudyType;
  description?: string;
  cards?: Card[];
  predefinedGroups?: Group[];
  shareSlug?: string;
}

export async function createStudy(input: CreateStudyInput): Promise<Study> {
  const kv = getKV();
  const now = Date.now();
  const shareSlug = input.shareSlug ?? (await uniqueSlug());
  const study: Study = StudySchema.parse({
    id: makeId('st_'),
    projectId: input.projectId,
    name: input.name,
    description: input.description ?? '',
    type: input.type,
    status: 'draft' as StudyStatus,
    shareSlug,
    cards: input.cards ?? [],
    predefinedGroups: input.predefinedGroups ?? [],
    createdAt: now,
    updatedAt: now,
  });
  await kv.jsonSet(studyKey(study.id), study);
  await kv.listPush(studiesByProjectKey(study.projectId), study.id);
  await kv.setString(studyByShareSlugKey(study.shareSlug), study.id);
  return study;
}

async function uniqueSlug(): Promise<string> {
  const kv = getKV();
  for (let i = 0; i < 8; i++) {
    const candidate = makeSlug(2);
    if (!(await kv.getString(studyByShareSlugKey(candidate)))) return candidate;
  }
  return makeSlug(3);
}

export async function getStudy(id: string): Promise<Study | null> {
  return getKV().jsonGet<Study>(studyKey(id));
}

export async function getStudyByShareSlug(slug: string): Promise<Study | null> {
  const kv = getKV();
  const id = await kv.getString(studyByShareSlugKey(slug));
  if (!id) return null;
  return kv.jsonGet<Study>(studyKey(id));
}

export async function listStudiesByProject(projectId: string): Promise<Study[]> {
  const kv = getKV();
  const ids = await kv.listRange(studiesByProjectKey(projectId), 0, -1);
  const studies = await Promise.all(ids.map((id) => kv.jsonGet<Study>(studyKey(id))));
  return studies.filter((s): s is Study => s !== null);
}

export interface UpdateStudyInput {
  name?: string;
  description?: string;
  status?: StudyStatus;
  cards?: Card[];
  predefinedGroups?: Group[];
  standardization?: Standardization;
}

export async function updateStudy(
  id: string,
  patch: UpdateStudyInput,
): Promise<Study | null> {
  const kv = getKV();
  const existing = await kv.jsonGet<Study>(studyKey(id));
  if (!existing) return null;
  const updated: Study = StudySchema.parse({
    ...existing,
    ...patch,
    updatedAt: Date.now(),
  });
  await kv.jsonSet(studyKey(id), updated);
  return updated;
}

export async function deleteStudy(id: string): Promise<void> {
  const kv = getKV();
  const existing = await kv.jsonGet<Study>(studyKey(id));
  if (!existing) return;
  await kv.del(studyKey(id));
  await kv.del(studyByShareSlugKey(existing.shareSlug));
  // Rebuild the project's study list without this id.
  const list = await kv.listRange(studiesByProjectKey(existing.projectId), 0, -1);
  await kv.del(studiesByProjectKey(existing.projectId));
  for (const sid of list) {
    if (sid !== id) await kv.listPush(studiesByProjectKey(existing.projectId), sid);
  }
}
