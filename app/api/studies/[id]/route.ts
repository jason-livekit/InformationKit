import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  loadOwnedStudy,
  requireSessionUser,
} from '@/lib/repo/access';
import { deleteStudy, updateStudy } from '@/lib/repo/studies';
import { CardSchema, GroupSchema, StudyStatusSchema } from '@/lib/repo/schemas';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const UpdateInput = z.object({
  name: z.string().min(1).max(160).optional(),
  description: z.string().max(4000).optional(),
  status: StudyStatusSchema.optional(),
  cards: z.array(CardSchema).optional(),
  predefinedGroups: z.array(GroupSchema).optional(),
});

function handleErr(e: unknown) {
  if (e instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (e instanceof ForbiddenError) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (e instanceof NotFoundError) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  throw e;
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireSessionUser();
    const { id } = await ctx.params;
    await loadOwnedStudy(id, user.id);
    const body = await request.json().catch(() => null);
    const parsed = UpdateInput.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
    const study = await updateStudy(id, parsed.data);
    return NextResponse.json({ study });
  } catch (e) {
    return handleErr(e);
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
    await deleteStudy(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleErr(e);
  }
}
