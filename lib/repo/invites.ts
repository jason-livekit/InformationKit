import { getKV } from './redis';
import { ProjectInviteSchema, type ProjectInvite, type ProjectRole } from './schemas';
import { makeSlug } from './ids';

export const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

const inviteKey = (token: string) => `invite:${token}`;
const invitesByProjectKey = (projectId: string) => `project:${projectId}:invites`;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export interface IssueInviteInput {
  projectId: string;
  email: string;
  role?: ProjectRole;
  invitedBy: string;
  ttlMs?: number;
}

export async function issueInvite(input: IssueInviteInput): Promise<ProjectInvite> {
  const kv = getKV();
  const token = makeSlug(8).replace(/-/g, '');
  const now = Date.now();
  const invite: ProjectInvite = ProjectInviteSchema.parse({
    token,
    projectId: input.projectId,
    email: normalizeEmail(input.email),
    role: input.role ?? 'member',
    invitedBy: input.invitedBy,
    createdAt: now,
    expiresAt: now + (input.ttlMs ?? INVITE_TTL_MS),
  });
  await kv.jsonSet(inviteKey(invite.token), invite);
  await kv.setAdd(invitesByProjectKey(invite.projectId), invite.token);
  return invite;
}

export async function getInvite(token: string): Promise<ProjectInvite | null> {
  return getKV().jsonGet<ProjectInvite>(inviteKey(token));
}

export async function listInvitesByProject(projectId: string): Promise<ProjectInvite[]> {
  const kv = getKV();
  const tokens = await kv.setMembers(invitesByProjectKey(projectId));
  const invites = await Promise.all(tokens.map((t) => kv.jsonGet<ProjectInvite>(inviteKey(t))));
  const now = Date.now();
  const live: ProjectInvite[] = [];
  for (const invite of invites) {
    if (!invite) continue;
    if (invite.expiresAt < now) {
      await deleteInvite(invite.token);
      continue;
    }
    live.push(invite);
  }
  return live.sort((a, b) => a.createdAt - b.createdAt);
}

export async function deleteInvite(token: string): Promise<void> {
  const kv = getKV();
  const invite = await kv.jsonGet<ProjectInvite>(inviteKey(token));
  await kv.del(inviteKey(token));
  if (invite) await kv.setRem(invitesByProjectKey(invite.projectId), token);
}
