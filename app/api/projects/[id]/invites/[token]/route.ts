import { NextResponse } from 'next/server';
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  loadOwnedProject,
  requireSessionUser,
} from '@/lib/repo/access';
import { getInvite, deleteInvite } from '@/lib/repo/invites';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Revokes a pending invite. Owner-only.
export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string; token: string }> },
) {
  try {
    const user = await requireSessionUser();
    const { id, token } = await ctx.params;
    await loadOwnedProject(id, user.id);
    const invite = await getInvite(token);
    if (!invite || invite.projectId !== id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    await deleteInvite(token);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (e instanceof ForbiddenError) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (e instanceof NotFoundError) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    throw e;
  }
}
