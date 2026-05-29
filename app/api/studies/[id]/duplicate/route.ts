import { NextResponse } from 'next/server';
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  loadAccessibleStudy,
  requireSessionUser,
} from '@/lib/repo/access';
import { duplicateStudy } from '@/lib/repo/studies';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSessionUser();
    const { id } = await ctx.params;
    await loadAccessibleStudy(id, user.id);
    const study = await duplicateStudy(id);
    if (!study) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ study }, { status: 201 });
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (e instanceof ForbiddenError) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (e instanceof NotFoundError) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    throw e;
  }
}
