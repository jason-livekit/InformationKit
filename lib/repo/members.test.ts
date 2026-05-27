import { describe, it, expect, beforeEach } from 'vitest';
import { __resetMemoryStoreForTests } from './redis';
import { upsertUser } from './users';
import { createProject, listProjectsForUser, deleteProject } from './projects';
import {
  addProjectMember,
  getProjectMember,
  listProjectMembers,
  listMemberProjectIds,
  removeProjectMember,
} from './members';

beforeEach(() => {
  __resetMemoryStoreForTests();
});

async function setup() {
  const owner = await upsertUser({ email: 'owner@x.com', name: 'Owner', image: null });
  const member = await upsertUser({ email: 'member@x.com', name: 'Member', image: null });
  const project = await createProject({ ownerId: owner.id, name: 'P', description: '' });
  return { owner, member, project };
}

describe('members repo', () => {
  it('adds a member and indexes both directions', async () => {
    const { member, project } = await setup();
    const m = await addProjectMember({ projectId: project.id, userId: member.id });
    expect(m.role).toBe('member');
    expect(await getProjectMember(project.id, member.id)).not.toBeNull();
    expect(await listProjectMembers(project.id)).toHaveLength(1);
    expect(await listMemberProjectIds(member.id)).toEqual([project.id]);
  });

  it('is idempotent when adding the same member twice', async () => {
    const { member, project } = await setup();
    await addProjectMember({ projectId: project.id, userId: member.id });
    await addProjectMember({ projectId: project.id, userId: member.id });
    expect(await listProjectMembers(project.id)).toHaveLength(1);
  });

  it('lets a member see the project via listProjectsForUser', async () => {
    const { member, project } = await setup();
    expect(await listProjectsForUser(member.id)).toEqual([]);
    await addProjectMember({ projectId: project.id, userId: member.id });
    const visible = await listProjectsForUser(member.id);
    expect(visible.map((p) => p.id)).toEqual([project.id]);
  });

  it('does not duplicate a project the user both owns and is a member of', async () => {
    const { owner, project } = await setup();
    await addProjectMember({ projectId: project.id, userId: owner.id });
    const visible = await listProjectsForUser(owner.id);
    expect(visible.map((p) => p.id)).toEqual([project.id]);
  });

  it('removes a member from both indexes', async () => {
    const { member, project } = await setup();
    await addProjectMember({ projectId: project.id, userId: member.id });
    await removeProjectMember(project.id, member.id);
    expect(await getProjectMember(project.id, member.id)).toBeNull();
    expect(await listProjectMembers(project.id)).toEqual([]);
    expect(await listMemberProjectIds(member.id)).toEqual([]);
  });

  it('clears memberships when the project is deleted', async () => {
    const { member, project } = await setup();
    await addProjectMember({ projectId: project.id, userId: member.id });
    await deleteProject(project.id);
    expect(await listMemberProjectIds(member.id)).toEqual([]);
    expect(await listProjectsForUser(member.id)).toEqual([]);
  });
});
