import { NextResponse } from 'next/server';
import { z } from 'zod';
import { issueMagicToken } from '@/lib/repo/magic-tokens';
import { sendMagicLink } from '@/lib/auth/send-magic-link';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const Input = z.object({
  email: z.string().email(),
  next: z.string().optional(),
});

/** Only allow same-site relative paths as post-sign-in redirects (guards against open redirects). */
function safeNext(next: string | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return null;
  return next;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = Input.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }
  const { email } = parsed.data;
  const next = safeNext(parsed.data.next);
  const { token, expiresAt } = await issueMagicToken(email);

  const origin = new URL(request.url).origin;
  const verifyUrl =
    `${origin}/sign-in/verify?token=${encodeURIComponent(token)}` +
    (next ? `&next=${encodeURIComponent(next)}` : '');

  const result = await sendMagicLink({ email, url: verifyUrl, expiresAt });

  return NextResponse.json({
    ok: true,
    email,
    emailed: result.emailed,
    expiresAt,
  });
}
