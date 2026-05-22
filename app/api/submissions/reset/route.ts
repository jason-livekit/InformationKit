import { NextResponse } from 'next/server';
import { ensureSeed, DEMO_STUDY_ID } from '@/lib/repo/seed';
import { listSubmissions, resetSubmissions } from '@/lib/repo/submissions';
import { getStudy } from '@/lib/repo/studies';
import { aggregate } from '@/lib/card-sort/aggregate';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  await ensureSeed();
  await resetSubmissions(DEMO_STUDY_ID);
  const study = await getStudy(DEMO_STUDY_ID);
  const submissions = await listSubmissions(DEMO_STUDY_ID);
  return NextResponse.json({
    ok: true,
    results: aggregate({ cards: study?.cards ?? [], submissions }),
  });
}
