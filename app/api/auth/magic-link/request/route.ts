import { NextResponse } from 'next/server';
import { z } from 'zod';
import { issueMagicToken } from '@/lib/repo/magic-tokens';
import { sendMagicLink } from '@/lib/auth/send-magic-link';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const Input = z.object({
  email: z.string().email(),
});

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
  const { token, expiresAt } = await issueMagicToken(email);

  const origin = new URL(request.url).origin;
  const verifyUrl = `${origin}/sign-in/verify?token=${encodeURIComponent(token)}`;

  const result = await sendMagicLink({ email, url: verifyUrl, expiresAt });

  return NextResponse.json({
    ok: true,
    email,
    emailed: result.emailed,
    fallbackLink: result.fallbackLink,
    expiresAt,
  });
}
