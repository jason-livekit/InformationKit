import { NextResponse } from 'next/server';
import { addSubmission, aggregate } from '@/lib/card-sort/store';
import { CARDS_BY_ID } from '@/lib/card-sort/items';
import type { SubmissionInput } from '@/lib/card-sort/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(aggregate());
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = parseSubmission(body);
  if (!parsed) {
    return NextResponse.json({ error: 'Invalid submission shape' }, { status: 400 });
  }

  const submission = addSubmission(parsed);
  return NextResponse.json({ submission, results: aggregate() });
}

function parseSubmission(body: unknown): SubmissionInput | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  if (!Array.isArray(b.groups) || !Array.isArray(b.unsorted) || !Array.isArray(b.notUseful)) {
    return null;
  }

  const groups = b.groups
    .map((g) => {
      if (!g || typeof g !== 'object') return null;
      const gg = g as Record<string, unknown>;
      const id = typeof gg.id === 'string' ? gg.id : '';
      const label = typeof gg.label === 'string' ? gg.label : '';
      const cardIds = Array.isArray(gg.cardIds)
        ? gg.cardIds.filter(
            (c): c is string => typeof c === 'string' && CARDS_BY_ID[c] !== undefined,
          )
        : [];
      if (!id) return null;
      return { id, label, cardIds };
    })
    .filter((g): g is NonNullable<typeof g> => g !== null);

  const unsorted = b.unsorted.filter(
    (c): c is string => typeof c === 'string' && CARDS_BY_ID[c] !== undefined,
  );
  const notUseful = b.notUseful.filter(
    (c): c is string => typeof c === 'string' && CARDS_BY_ID[c] !== undefined,
  );

  return { groups, unsorted, notUseful };
}
