import { NextResponse } from 'next/server';
import { ensureSeed, DEMO_STUDY_ID } from '@/lib/repo/seed';
import { addSubmission, listSubmissions } from '@/lib/repo/submissions';
import { aggregate } from '@/lib/card-sort/aggregate';
import { getStudy } from '@/lib/repo/studies';
import { SubmissionInputSchema } from '@/lib/repo/schemas';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Legacy endpoint kept alive for old shared links / cached browser tabs.
 * Internally it now writes to the seeded demo study so existing clients keep working.
 * New code should hit `/api/studies/{id}/submissions` directly.
 */

export async function GET() {
  await ensureSeed();
  const study = await getStudy(DEMO_STUDY_ID);
  const submissions = await listSubmissions(DEMO_STUDY_ID);
  return NextResponse.json(aggregate({ cards: study?.cards ?? [], submissions }));
}

export async function POST(request: Request) {
  await ensureSeed();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = SubmissionInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid submission shape' }, { status: 400 });
  }
  const study = await getStudy(DEMO_STUDY_ID);
  if (!study) {
    return NextResponse.json({ error: 'Demo study unavailable' }, { status: 500 });
  }
  const valid = new Set(study.cards.map((c) => c.id));
  const submission = await addSubmission(DEMO_STUDY_ID, {
    groups: parsed.data.groups.map((g) => ({
      ...g,
      cardIds: g.cardIds.filter((c) => valid.has(c)),
    })),
    unsorted: parsed.data.unsorted.filter((c) => valid.has(c)),
    notUseful: parsed.data.notUseful.filter((c) => valid.has(c)),
  });
  const submissions = await listSubmissions(DEMO_STUDY_ID);
  return NextResponse.json({ submission, results: aggregate({ cards: study.cards, submissions }) });
}
