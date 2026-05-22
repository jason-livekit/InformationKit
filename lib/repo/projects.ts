import { getKV } from './redis';
import { ProjectSchema, type Project } from './schemas';
import { makeId } from './ids';

const projectKey = (id: string) => `project:${id}`;
const projectsByOwnerKey = (ownerId: string) => `user:${ownerId}:projects`;

export interface CreateProjectInput {
  ownerId: string;
  name: string;
  description: string;
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const kv = getKV();
  const now = Date.now();
  const project: Project = ProjectSchema.parse({
    id: makeId('p_'),
    ownerId: input.ownerId,
    name: input.name,
    description: input.description,
    createdAt: now,
    updatedAt: now,
  });
  await kv.jsonSet(projectKey(project.id), project);
  await kv.setAdd(projectsByOwnerKey(project.ownerId), project.id);
  return project;
}

export async function getProject(id: string): Promise<Project | null> {
  return getKV().jsonGet<Project>(projectKey(id));
}

export async function listProjectsByOwner(ownerId: string): Promise<Project[]> {
  const kv = getKV();
  const ids = await kv.setMembers(projectsByOwnerKey(ownerId));
  const projects = await Promise.all(ids.map((id) => kv.jsonGet<Project>(projectKey(id))));
  return projects
    .filter((p): p is Project => p !== null)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
}

export async function updateProject(
  id: string,
  patch: UpdateProjectInput,
): Promise<Project | null> {
  const kv = getKV();
  const existing = await kv.jsonGet<Project>(projectKey(id));
  if (!existing) return null;
  const updated: Project = ProjectSchema.parse({
    ...existing,
    ...patch,
    updatedAt: Date.now(),
  });
  await kv.jsonSet(projectKey(id), updated);
  return updated;
}

export async function deleteProject(id: string): Promise<void> {
  const kv = getKV();
  const existing = await kv.jsonGet<Project>(projectKey(id));
  if (!existing) return;
  await kv.del(projectKey(id));
  await kv.setRem(projectsByOwnerKey(existing.ownerId), id);
}
