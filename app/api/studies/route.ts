import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  loadOwnedProject,
  requireSessionUser,
} from '@/lib/repo/access';
import { createStudy } from '@/lib/repo/studies';
import { StudyTypeSchema } from '@/lib/repo/schemas';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CreateInput = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1).max(160),
  type: StudyTypeSchema,
});

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = await request.json().catch(() => null);
    const parsed = CreateInput.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    await loadOwnedProject(parsed.data.projectId, user.id);
    const study = await createStudy({
      projectId: parsed.data.projectId,
      name: parsed.data.name,
      type: parsed.data.type,
    });
    return NextResponse.json({ study }, { status: 201 });
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (e instanceof ForbiddenError) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (e instanceof NotFoundError) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    throw e;
  }
}
