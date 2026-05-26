import { getKV } from './redis';
import { ProjectMemberSchema, type ProjectMember, type ProjectRole } from './schemas';

const memberKey = (projectId: string, userId: string) => `member:${projectId}:${userId}`;
const membersByProjectKey = (projectId: string) => `project:${projectId}:members`;
const projectsByMemberKey = (userId: string) => `user:${userId}:memberProjects`;

export interface AddMemberInput {
  projectId: string;
  userId: string;
  role?: ProjectRole;
}

export async function addProjectMember(input: AddMemberInput): Promise<ProjectMember> {
  const kv = getKV();
  const existing = await kv.jsonGet<ProjectMember>(memberKey(input.projectId, input.userId));
  if (existing) return existing;
  const member: ProjectMember = ProjectMemberSchema.parse({
    projectId: input.projectId,
    userId: input.userId,
    role: input.role ?? 'member',
    createdAt: Date.now(),
  });
  await kv.jsonSet(memberKey(member.projectId, member.userId), member);
  await kv.setAdd(membersByProjectKey(member.projectId), member.userId);
  await kv.setAdd(projectsByMemberKey(member.userId), member.projectId);
  return member;
}

export async function getProjectMember(
  projectId: string,
  userId: string,
): Promise<ProjectMember | null> {
  return getKV().jsonGet<ProjectMember>(memberKey(projectId, userId));
}

export async function listProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const kv = getKV();
  const ids = await kv.setMembers(membersByProjectKey(projectId));
  const members = await Promise.all(ids.map((id) => kv.jsonGet<ProjectMember>(memberKey(projectId, id))));
  return members
    .filter((m): m is ProjectMember => m !== null)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function listMemberProjectIds(userId: string): Promise<string[]> {
  return getKV().setMembers(projectsByMemberKey(userId));
}

export async function removeProjectMember(projectId: string, userId: string): Promise<void> {
  const kv = getKV();
  await kv.del(memberKey(projectId, userId));
  await kv.setRem(membersByProjectKey(projectId), userId);
  await kv.setRem(projectsByMemberKey(userId), projectId);
}

/** Removes every membership for a project. Called when a project is deleted. */
export async function removeAllProjectMembers(projectId: string): Promise<void> {
  const kv = getKV();
  const ids = await kv.setMembers(membersByProjectKey(projectId));
  for (const userId of ids) {
    await kv.del(memberKey(projectId, userId));
    await kv.setRem(projectsByMemberKey(userId), projectId);
  }
  await kv.del(membersByProjectKey(projectId));
}
