import { NextResponse } from 'next/server';
import { getStudy } from '@/lib/repo/studies';
import { addSubmission, listSubmissions, resetSubmissions } from '@/lib/repo/submissions';
import { SubmissionInputSchema } from '@/lib/repo/schemas';
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  loadOwnedStudy,
  requireSessionUser,
} from '@/lib/repo/access';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const study = await getStudy(id);
  if (!study) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (study.status !== 'open') {
    return NextResponse.json({ error: 'Study is not accepting submissions' }, { status: 409 });
  }
  const body = await request.json().catch(() => null);
  const parsed = SubmissionInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid submission' }, { status: 400 });
  }
  const validCardIds = new Set(study.cards.map((c) => c.id));
  const cleanGroups = parsed.data.groups.map((g) => ({
    ...g,
    cardIds: g.cardIds.filter((c) => validCardIds.has(c)),
  }));
  const cleanUnsorted = parsed.data.unsorted.filter((c) => validCardIds.has(c));
  const cleanNotUseful = parsed.data.notUseful.filter((c) => validCardIds.has(c));
  const submission = await addSubmission(id, {
    groups: cleanGroups,
    unsorted: cleanUnsorted,
    notUseful: cleanNotUseful,
    participantToken: parsed.data.participantToken,
  });
  return NextResponse.json({ submission }, { status: 201 });
}

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSessionUser();
    const { id } = await ctx.params;
    await loadOwnedStudy(id, user.id);
    return NextResponse.json({ submissions: await listSubmissions(id) });
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (e instanceof ForbiddenError) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (e instanceof NotFoundError) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    throw e;
  }
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSessionUser();
    const { id } = await ctx.params;
    await loadOwnedStudy(id, user.id);
    await resetSubmissions(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (e instanceof ForbiddenError) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (e instanceof NotFoundError) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    throw e;
  }
}
