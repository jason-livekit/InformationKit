import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionUser, UnauthorizedError } from '@/lib/repo/access';
import { createProject, listProjectsByOwner } from '@/lib/repo/projects';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CreateInput = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).default(''),
});

export async function GET() {
  try {
    const user = await requireSessionUser();
    return NextResponse.json({ projects: await listProjectsByOwner(user.id) });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    throw e;
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = await request.json().catch(() => null);
    const parsed = CreateInput.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const project = await createProject({
      ownerId: user.id,
      name: parsed.data.name,
      description: parsed.data.description,
    });
    return NextResponse.json({ project }, { status: 201 });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    throw e;
  }
}
