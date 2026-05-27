import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  loadOwnedProject,
  loadProjectAccess,
  requireSessionUser,
} from '@/lib/repo/access';
import { addProjectMember, listProjectMembers } from '@/lib/repo/members';
import { issueInvite, listInvitesByProject } from '@/lib/repo/invites';
import { getUserByEmail, getUserById } from '@/lib/repo/users';
import { sendInvite } from '@/lib/auth/send-invite';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const InviteInput = z.object({
  email: z.string().email(),
});

function handleErr(e: unknown) {
  if (e instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (e instanceof ForbiddenError) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (e instanceof NotFoundError) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  throw e;
}

// Lists the people with access to a project: the owner, accepted members, and pending invites.
export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSessionUser();
    const { id } = await ctx.params;
    const { project, role } = await loadProjectAccess(id, user.id);

    const owner = await getUserById(project.ownerId);
    const members = await listProjectMembers(id);
    const memberUsers = await Promise.all(
      members.map(async (m) => {
        const u = await getUserById(m.userId);
        return {
          userId: m.userId,
          role: m.role,
          email: u?.email ?? null,
          name: u?.name ?? null,
        };
      }),
    );
    // Only the owner needs to see (and manage) pending invites.
    const invites = role === 'owner' ? await listInvitesByProject(id) : [];

    return NextResponse.json({
      role,
      owner: owner ? { userId: owner.id, email: owner.email, name: owner.name } : null,
      members: memberUsers,
      invites: invites.map((i) => ({ token: i.token, email: i.email, expiresAt: i.expiresAt })),
    });
  } catch (e) {
    return handleErr(e);
  }
}

// Invites someone by email. If they already have an account, they're added immediately;
// otherwise a pending invite + link is created. Owner-only.
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSessionUser();
    const { id } = await ctx.params;
    const project = await loadOwnedProject(id, user.id);

    const body = await request.json().catch(() => null);
    const parsed = InviteInput.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    const email = parsed.data.email.trim().toLowerCase();

    const owner = await getUserById(project.ownerId);
    if (owner && owner.email.toLowerCase() === email) {
      return NextResponse.json({ error: 'That person already owns this project.' }, { status: 409 });
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      const member = await addProjectMember({ projectId: id, userId: existing.id });
      return NextResponse.json({ added: true, member }, { status: 201 });
    }

    // No account yet: reuse a live invite for this email if one exists, else issue a fresh one.
    const live = await listInvitesByProject(id);
    const invite =
      live.find((i) => i.email === email) ??
      (await issueInvite({ projectId: id, email, invitedBy: user.id }));

    const origin = new URL(request.url).origin;
    const acceptUrl = `${origin}/invite/${encodeURIComponent(invite.token)}`;
    const result = await sendInvite({
      email,
      url: acceptUrl,
      projectName: project.name,
      invitedByName: owner?.name ?? user.name ?? 'Someone',
      expiresAt: invite.expiresAt,
    });

    return NextResponse.json(
      { invited: true, emailed: result.emailed, fallbackLink: result.fallbackLink },
      { status: 201 },
    );
  } catch (e) {
    return handleErr(e);
  }
}
