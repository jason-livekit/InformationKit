import { describe, it, expect, beforeEach } from 'vitest';
import { __resetMemoryStoreForTests } from './redis';
import { issueInvite, getInvite, listInvitesByProject, deleteInvite } from './invites';

beforeEach(() => {
  __resetMemoryStoreForTests();
});

describe('invites repo', () => {
  it('issues an invite tied to a normalized email', async () => {
    const invite = await issueInvite({ projectId: 'p1', email: '  Foo@Bar.com ', invitedBy: 'u1' });
    expect(invite.token).toMatch(/^[a-z0-9]+$/);
    expect(invite.email).toBe('foo@bar.com');
    expect(invite.role).toBe('member');
    expect(invite.expiresAt).toBeGreaterThan(Date.now());
    expect(await getInvite(invite.token)).not.toBeNull();
  });

  it('lists live invites for a project', async () => {
    await issueInvite({ projectId: 'p1', email: 'a@x.com', invitedBy: 'u1' });
    await issueInvite({ projectId: 'p1', email: 'b@x.com', invitedBy: 'u1' });
    await issueInvite({ projectId: 'p2', email: 'c@x.com', invitedBy: 'u1' });
    const p1 = await listInvitesByProject('p1');
    expect(p1.map((i) => i.email).sort()).toEqual(['a@x.com', 'b@x.com']);
  });

  it('drops expired invites when listing', async () => {
    await issueInvite({ projectId: 'p1', email: 'a@x.com', invitedBy: 'u1', ttlMs: -1 });
    await issueInvite({ projectId: 'p1', email: 'b@x.com', invitedBy: 'u1' });
    const live = await listInvitesByProject('p1');
    expect(live.map((i) => i.email)).toEqual(['b@x.com']);
  });

  it('deletes an invite and removes it from the project index', async () => {
    const invite = await issueInvite({ projectId: 'p1', email: 'a@x.com', invitedBy: 'u1' });
    await deleteInvite(invite.token);
    expect(await getInvite(invite.token)).toBeNull();
    expect(await listInvitesByProject('p1')).toEqual([]);
  });
});
