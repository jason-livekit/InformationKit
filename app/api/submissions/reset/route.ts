import { NextResponse } from 'next/server';
import { aggregate, resetSubmissions } from '@/lib/card-sort/store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  resetSubmissions();
  return NextResponse.json({ ok: true, results: aggregate() });
}
