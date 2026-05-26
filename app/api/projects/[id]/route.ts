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
import { deleteProject, updateProject } from '@/lib/repo/projects';
import { deleteStudy, listStudiesByProject } from '@/lib/repo/studies';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const UpdateInput = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).optional(),
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
    await loadProjectAccess(id, user.id);
    const body = await request.json().catch(() => null);
    const parsed = UpdateInput.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    const project = await updateProject(id, parsed.data);
    return NextResponse.json({ project });
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
    await loadOwnedProject(id, user.id);
    const studies = await listStudiesByProject(id);
    for (const s of studies) {
      await deleteStudy(s.id);
    }
    await deleteProject(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleErr(e);
  }
}
