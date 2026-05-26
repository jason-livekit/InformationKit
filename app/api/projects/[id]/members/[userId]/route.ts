import { NextResponse } from 'next/server';
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  loadOwnedProject,
  requireSessionUser,
} from '@/lib/repo/access';
import { removeProjectMember } from '@/lib/repo/members';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Removes a member from a project. Owner-only.
export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string; userId: string }> },
) {
  try {
    const user = await requireSessionUser();
    const { id, userId } = await ctx.params;
    await loadOwnedProject(id, user.id);
    await removeProjectMember(id, userId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (e instanceof ForbiddenError) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (e instanceof NotFoundError) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    throw e;
  }
}
